/**
 * scripts/scrape-all.js
 *
 * Production KOL metrics scraper — runs on VPS via cron
 * Every 3 days at 23:00 WIB (UTC+7) = 16:00 UTC
 *
 * Usage:
 *   node scripts/scrape-all.js
 *
 * Flow:
 *   1. Auth Google Sheets
 *   2. Read all URLs from 21 KOL sheets
 *   3. Dedupe + split into batches
 *   4. For each batch:
 *       - Trigger Apify actor
 *       - Poll until SUCCEEDED
 *       - Fetch dataset
 *       - Write metrics to sheets
 *   5. Write run log to LOG_SHEET
 */

import { google } from 'googleapis';
import { ApifyClient } from 'apify-client';
import { readFileSync, appendFileSync } from 'fs';
import 'dotenv/config';

// ─── Config ───────────────────────────────────────────────────────────────────
const APIFY_TOKEN = process.env.VITE_APIFY_API_TOKEN;
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID;
const LOG_SHEET = process.env.LOG_SHEET || 'Log';

const TIKTOK_ACTOR = 'apidojo~tiktok-scraper';
const IG_ACTOR = 'shu8hvrXbJbY3Eb9W';
const TIKTOK_CHUNK = 500;
const IG_CHUNK = 50;
const POLL_INTERVAL_MS = 15000;
const MAX_WAIT_MS = 600000; // 10 min per batch
const LOG_FILE = '/home/digitaldecade/eji-kol/scrape-all.log';

// ─── Auth ─────────────────────────────────────────────────────────────────────
const creds = JSON.parse(readFileSync('./service-account.json', 'utf8'));
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const apify = new ApifyClient({ token: APIFY_TOKEN });

// ─── Logger ───────────────────────────────────────────────────────────────────
function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

// ─── Write run log to Google Sheet ────────────────────────────────────────────
async function writeRunLogToSheet({ timestamp, event, sheet, rowsUpdated, status, notes }) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${LOG_SHEET}'!A:F`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[
        timestamp,
        event,
        sheet || '',
        rowsUpdated || 0,
        status,
        notes || '',
      ]]},
    });
  } catch (e) {
    log('Failed to write run log to sheet: ' + e.message, 'ERROR');
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeUrl(url) {
  if (!url) return '';
  return url.trim().split('?')[0].replace(/\/$/, '').replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

function extractVideoId(url) {
  return url?.match(/\/video\/(\d+)/)?.[1] || null;
}

function extractIgShortCode(url) {
  const match = url?.match(/instagram\.com\/[^/]+\/([^/?]+)/);
  return match ? match[1] : null;
}

// ─── Read all KOL sheets ───────────────────────────────────────────────────────
async function readAllUrls() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const allSheets = meta.data.sheets
    .map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId }))
    .filter(s => /^\[(TT|YC|IG)\]/.test(s.title));

  log(`Found ${allSheets.length} KOL sheets`);

  const tiktokRows = []; // { url, sheetName, rowIndex }
  const igRows = [];

  const results = await Promise.allSettled(
    allSheets.map(async ({ title }) => {
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${title}'!H2:H`,
      });
      return { title, rows: resp.data.values || [] };
    })
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      log(`Failed to read sheet: ${result.reason?.message}`, 'ERROR');
      continue;
    }
    const { title, rows } = result.value;
    const isIg = title.startsWith('[IG]');

    rows.forEach((row, idx) => {
      const val = (row[0] || '').trim();
      if (!val) return;
      const rowIndex = idx + 2;
      if (/tiktok\.com/i.test(val) && /\/video\/\d+/i.test(val)) {
        tiktokRows.push({ url: val, sheetName: title, rowIndex });
      } else if (/instagram\.com/i.test(val)) {
        igRows.push({ url: val, sheetName: title, rowIndex });
      }
    });
  }

  // Dedupe
  const ttSeen = new Map();
  tiktokRows.forEach(r => { if (!ttSeen.has(r.url)) ttSeen.set(r.url, r); });
  const igSeen = new Map();
  igRows.forEach(r => { if (!igSeen.has(r.url)) igSeen.set(r.url, r); });

  const tiktok = Array.from(ttSeen.values());
  const ig = Array.from(igSeen.values());

  log(`TikTok URLs: ${tiktok.length} (${tiktokRows.length} raw)`);
  log(`Instagram URLs: ${ig.length} (${igRows.length} raw)`);

  return { tiktok, ig };
}

// ─── Build TikTok metrics map ──────────────────────────────────────────────────
function buildTikTokMap(items) {
  const map = new Map();
  for (const item of items) {
    const vid = item.id || '';
    const clean = normalizeUrl(item.postPage || item.webVideoUrl || '');
    const m = {
      impression: item.views || 0,
      view: item.views || 0,
      likes: item.likes || 0,
      share: item.shares || 0,
      comment: item.comments || 0,
      save: item.bookmarks || 0,
    };
    if (clean) map.set(clean, m);
    if (vid) map.set(vid, m);
  }
  return map;
}

// ─── Build Instagram metrics map ───────────────────────────────────────────────
function buildIgMap(items) {
  const map = new Map();
  for (const item of items) {
    const raw = item.inputUrl || item.url || '';
    const shortCode = extractIgShortCode(raw);
    // Use likesCount as proxy for impression (engagement signal)
    const m = {
      impression: item.videoViewCount || item.likesCount || 0,
      view: item.videoPlayCount || 0,
      likes: item.likesCount || 0,
      share: 0,
      comment: item.commentsCount || 0,
      save: 0,
    };
    if (shortCode) map.set(shortCode, m);
    if (raw) map.set(normalizeUrl(raw), m);
  }
  return map;
}

// ─── Write metrics for one platform ───────────────────────────────────────────
async function writeMetrics(platform, metricsMap, rows, sheetLogPrefix) {
  let written = 0;
  let noMetrics = 0;
  const sheetGroups = {};

  for (const row of rows) {
    let metrics = null;

    if (platform === 'tiktok') {
      const clean = normalizeUrl(row.url);
      const vid = extractVideoId(row.url);
      metrics = metricsMap.get(clean) || (vid ? metricsMap.get(vid) : null);
    } else {
      const shortCode = extractIgShortCode(row.url);
      const clean = normalizeUrl(row.url);
      metrics = metricsMap.get(shortCode) || metricsMap.get(clean);
    }

    if (metrics) {
      written++;
      // Group by sheet for batch writing
      if (!sheetGroups[row.sheetName]) sheetGroups[row.sheetName] = [];
      sheetGroups[row.sheetName].push({ rowIndex: row.rowIndex, metrics });
    } else {
      noMetrics++;
      log(`  NO DATA: ${row.sheetName} row ${row.rowIndex}: ${row.url}`, 'WARN');
    }
  }

  // Batch write per sheet (chunked)
  const CHUNK = 100;
  for (const [sheetName, updates] of Object.entries(sheetGroups)) {
    for (let i = 0; i < updates.length; i += CHUNK) {
      const chunk = updates.slice(i, i + CHUNK);
      const ranges = chunk.map(u =>
        `'${sheetName}'!I${u.rowIndex}:N${u.rowIndex}`
      );
      const values = chunk.map(u => [
        String(u.metrics.impression),
        String(u.metrics.view),
        String(u.metrics.likes),
        String(u.metrics.share),
        String(u.metrics.comment),
        String(u.metrics.save),
      ]);

      try {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: ranges.map((range, idx) => ({ range, values: [values[idx]] })),
          },
        });
      } catch (e) {
        log(`Batch write error [${sheetName}]: ${e.message}`, 'ERROR');
      }
    }
    log(`  ${sheetName}: ${updates.length} rows written`);
  }

  const total = written + noMetrics;
  log(`${platform.toUpperCase()} ${sheetLogPrefix}: ${written}/${total} written, ${noMetrics} no data`);

  await writeRunLogToSheet({
    timestamp: new Date().toISOString(),
    event: `WRITE_${platform.toUpperCase()}`,
    sheet: sheetLogPrefix,
    rowsUpdated: written,
    status: noMetrics === 0 ? 'OK' : 'PARTIAL',
    notes: `no_data=${noMetrics}`,
  });

  return { written, noMetrics };
}

// ─── Poll & wait for actor ─────────────────────────────────────────────────────
async function waitForRun(runId) {
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    const status = await apify.run(runId).get();
    log(`  Run ${runId}: ${status.status} (${Math.round((Date.now() - start) / 1000)}s)`);
    if (status.status === 'SUCCEEDED') return status;
    if (status.status === 'FAILED' || status.status === 'ABORTED') {
      throw new Error(`Actor run ${runId} ended with status: ${status.status}`);
    }
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Timeout waiting for run ${runId} after ${MAX_WAIT_MS}ms`);
}

// ─── Process one TikTok batch ─────────────────────────────────────────────────
async function processTiktokBatch(batch, batchNum, totalBatches) {
  log(`\n[TT] Batch ${batchNum}/${totalBatches} (${batch.length} URLs)`);

  const ttInput = {
    startUrls: batch.map(u => ({ url: u.url })),
    maxItems: batch.length,
    proxyConfiguration: { useApifyProxy: true },
  };

  const run = await apify.actor(TIKTOK_ACTOR).start(ttInput);
  log(`  Run started: ${run.id}`);

  const status = await waitForRun(run.id);
  const { items } = await apify.dataset(status.defaultDatasetId).listItems();
  log(`  Dataset: ${items.length} items fetched`);

  const metricsMap = buildTikTokMap(items);
  const { written, noMetrics } = await writeMetrics('tiktok', metricsMap, batch, `TT Batch ${batchNum}`);

  await writeRunLogToSheet({
    timestamp: new Date().toISOString(),
    event: 'SCRAPE_TT_BATCH',
    sheet: `TT Batch ${batchNum}`,
    rowsUpdated: written,
    status: noMetrics > batch.length * 0.5 ? 'LOW_MATCH' : 'OK',
    notes: `run=${run.id} items=${items.length} no_data=${noMetrics}`,
  });

  return { runId: run.id, items: items.length, written, noMetrics };
}

// ─── Process one Instagram batch ───────────────────────────────────────────────
async function processIgBatch(batch, batchNum, totalBatches) {
  log(`\n[IG] Batch ${batchNum}/${totalBatches} (${batch.length} URLs)`);

  const igInput = {
    directUrls: batch.map(u => u.url),
    resultsType: 'posts',
    proxy: { useApifyProxy: true },
  };

  const run = await apify.actor(IG_ACTOR).start(igInput);
  log(`  Run started: ${run.id}`);

  const status = await waitForRun(run.id);
  const { items } = await apify.dataset(status.defaultDatasetId).listItems();
  log(`  Dataset: ${items.length} items fetched`);

  const metricsMap = buildIgMap(items);
  const { written, noMetrics } = await writeMetrics('instagram', metricsMap, batch, `IG Batch ${batchNum}`);

  await writeRunLogToSheet({
    timestamp: new Date().toISOString(),
    event: 'SCRAPE_IG_BATCH',
    sheet: `IG Batch ${batchNum}`,
    rowsUpdated: written,
    status: noMetrics > batch.length * 0.5 ? 'LOW_MATCH' : 'OK',
    notes: `run=${run.id} items=${items.length} no_data=${noMetrics}`,
  });

  return { runId: run.id, items: items.length, written, noMetrics };
}

// ─���─ Chunk helper ─────────────────────────────────────────────────────────────
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  log('\n===== SCRAPE-ALL STARTED =====');

  await writeRunLogToSheet({
    timestamp: new Date().toISOString(),
    event: 'RUN_START',
    status: 'RUNNING',
    notes: `PID=${process.pid}`,
  });

  try {
    // 1. Read all URLs
    const { tiktok, ig } = await readAllUrls();

    if (tiktok.length === 0 && ig.length === 0) {
      log('No URLs found. Exiting.');
      await writeRunLogToSheet({
        timestamp: new Date().toISOString(),
        event: 'RUN_COMPLETE',
        status: 'SKIPPED',
        notes: 'No URLs found',
      });
      return;
    }

    // 2. Split into batches
    const ttBatches = chunk(tiktok, TIKTOK_CHUNK);
    const igBatches = chunk(ig, IG_CHUNK);

    log(`TikTok: ${tiktok.length} URLs in ${ttBatches.length} batches`);
    log(`Instagram: ${ig.length} URLs in ${igBatches.length} batches`);

    await writeRunLogToSheet({
      timestamp: new Date().toISOString(),
      event: 'RUN_SUMMARY',
      status: 'RUNNING',
      notes: `tt=${tiktok.length} in ${ttBatches.length} batches | ig=${ig.length} in ${igBatches.length} batches`,
    });

    // 3. Process TikTok batches
    const ttResults = [];
    for (let i = 0; i < ttBatches.length; i++) {
      try {
        const r = await processTiktokBatch(ttBatches[i], i + 1, ttBatches.length);
        ttResults.push(r);
      } catch (e) {
        log(`TT Batch ${i + 1} failed: ${e.message}`, 'ERROR');
        await writeRunLogToSheet({
          timestamp: new Date().toISOString(),
          event: 'SCRAPE_TT_BATCH',
          sheet: `TT Batch ${i + 1}`,
          status: 'ERROR',
          notes: e.message,
        });
      }
    }

    // 4. Process Instagram batches
    const igResults = [];
    for (let i = 0; i < igBatches.length; i++) {
      try {
        const r = await processIgBatch(igBatches[i], i + 1, igBatches.length);
        igResults.push(r);
      } catch (e) {
        log(`IG Batch ${i + 1} failed: ${e.message}`, 'ERROR');
        await writeRunLogToSheet({
          timestamp: new Date().toISOString(),
          event: 'SCRAPE_IG_BATCH',
          sheet: `IG Batch ${i + 1}`,
          status: 'ERROR',
          notes: e.message,
        });
      }
    }

    // 5. Summary
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const totalTtWritten = ttResults.reduce((s, r) => s + (r.written || 0), 0);
    const totalIgWritten = igResults.reduce((s, r) => s + (r.written || 0), 0);

    log('\n===== SCRAPE-ALL COMPLETED =====');
    log(`TikTok: ${ttResults.length} batches | ${totalTtWritten} rows written`);
    log(`Instagram: ${igResults.length} batches | ${totalIgWritten} rows written`);
    log(`Total time: ${elapsed}s`);

    await writeRunLogToSheet({
      timestamp: new Date().toISOString(),
      event: 'RUN_COMPLETE',
      status: 'OK',
      notes: `tt=${totalTtWritten} ig=${totalIgWritten} time=${elapsed}s tt_batches=${ttResults.length} ig_batches=${igResults.length}`,
    });

  } catch (err) {
    log('FATAL: ' + err.message, 'ERROR');
    log(err.stack, 'ERROR');
    await writeRunLogToSheet({
      timestamp: new Date().toISOString(),
      event: 'RUN_ERROR',
      status: 'ERROR',
      notes: err.message,
    });
    process.exit(1);
  }
}

main();