/**
 * scripts/scrape-kol-metrics.js
 *
 * Scrape TikTok & Instagram metrics from KOL spreadsheet URLs,
 * write to columns I–N and log to column T.
 *
 * Usage:
 *   node scripts/scrape-kol-metrics.js
 *
 * Auth — two modes:
 *   VPS (no BQ_CLIENT_EMAIL/BQ_PRIVATE_KEY in .env):
 *     Uses service account JSON keyFile at /home/digitaldecade/eji-kol/service-account.json
 *     (bypasses OpenSSL RS256 JWT signing issue on Node 24 / OpenSSL 3.x)
 *   Dev (env vars present):
 *     Uses BQ_CLIENT_EMAIL + BQ_PRIVATE_KEY from .env
 *
 * Env vars:
 *   VITE_SPREADSHEET_ID — ID of the spreadsheet
 *   BQ_CLIENT_EMAIL     — Google service account email (dev only)
 *   BQ_PRIVATE_KEY      — Google service account private key (dev only)
 */

import { google } from 'googleapis';
import { chromium } from 'playwright';
import 'dotenv/config';

// ─── Config ───────────────────────────────────────────────────────────────────

const CONCURRENCY     = 5;
const BATCH_WRITE     = 50;
const WRITE_DELAY     = 3000;
const SCRAPE_TIMEOUT  = 35000;
const SCRAPE_WAIT      = 3500;
const MAX_RETRIES      = 1;
const MAX_ROWS_PER_SHEET = 0; // 0 = no limit (scrape all rows)

const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID;
if (!SPREADSHEET_ID) {
  console.error('[ERROR] VITE_SPREADSHEET_ID is not set in .env');
  process.exit(1);
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
//
// VPS (Node 24 + OpenSSL 3.x): use keyFile to bypass the RS256 JWT signing error.
// Create + download a service account JSON key from Google Cloud Console,
// upload it to /home/digitaldecade/eji-kol/service-account.json on the VPS.
//
// Dev (local): falls back to BQ_CLIENT_EMAIL + BQ_PRIVATE_KEY from .env.

const SERVICE_ACCOUNT_KEYFILE = '/home/digitaldecade/eji-kol/service-account.json';

const auth = new google.auth.GoogleAuth({
  ...(process.env.BQ_CLIENT_EMAIL && process.env.BQ_PRIVATE_KEY
    ? {
        credentials: {
          client_email: process.env.BQ_CLIENT_EMAIL,
          // Normalise key: some env loaders strip newlines
          private_key: (() => {
            const raw = process.env.BQ_PRIVATE_KEY;
            // already multi-line PEM → use as-is
            if (raw && raw.includes('\n')) return raw;
            // single-line \n-escaped string → decode
            if (raw && raw.includes('\\n')) {
              return raw.replace(/\\n/g, '\n');
            }
            return raw || '';
          })(),
        },
      }
    : { keyFile: SERVICE_ACCOUNT_KEYFILE }),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function parseMetric(str) {
  if (!str) return 0;
  const s = String(str).replace(/,/g, '').toUpperCase().trim();
  if (s.endsWith('M')) return parseFloat(s) * 1_000_000;
  if (s.endsWith('K')) return parseFloat(s) * 1_000;
  return parseInt(s, 10) || 0;
}

function timestamp() {
  const d = new Date();
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    .replace(/\//g, '-').replace(/,/g, '');
}

function buildLog({ platform, metrics, error }) {
  const ts = timestamp();
  if (error) {
    return `✗ ${platform.toUpperCase()} | Error: ${error} | ${ts}`;
  }

  if (platform === 'instagram') {
    return [
      `✓ IG |`,
      `like:${fmt(metrics.likes)} |`,
      `comment:${fmt(metrics.comment)} |`,
      `IG-limited: no view/impression/share/save |`,
      ts,
    ].join(' ');
  }

  return [
    `✓ TT |`,
    `view:${fmt(metrics.view)} |`,
    `like:${fmt(metrics.likes)} |`,
    `share:${fmt(metrics.share)} |`,
    `comment:${fmt(metrics.comment)} |`,
    `save:${fmt(metrics.save)} |`,
    ts,
  ].join(' ');
}

// ─── TikTok Scraper ────────────────────────────────────────────────────────────

async function scrapeTikTok(page, url) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: SCRAPE_TIMEOUT });
      await page.waitForTimeout(SCRAPE_WAIT);

      const html = await page.content();
      const match = html.match(
        /"stats":\{"diggCount":(\d+),"shareCount":(\d+),"commentCount":(\d+),"playCount":(\d+),"collectCount":(\d+)/i
      );

      if (match) {
        return {
          impression: parseInt(match[4], 10),
          view       : parseInt(match[4], 10),
          likes      : parseInt(match[1], 10),
          share      : parseInt(match[2], 10),
          comment    : parseInt(match[3], 10),
          save       : parseInt(match[5], 10),
        };
      }

      if (attempt < MAX_RETRIES) await sleep(1500);
    } catch (err) {
      if (attempt < MAX_RETRIES) await sleep(1500);
    }
  }
  return null;
}

// ─── Instagram Scraper ────────────────────────────────────────────────────────

async function scrapeInstagram(page, url) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: SCRAPE_TIMEOUT });
      await page.waitForTimeout(SCRAPE_WAIT);

      const ogDesc = await page.evaluate(
        () => document.querySelector('meta[property="og:description"]')?.content || ''
      );

      if (!ogDesc) {
        if (attempt < MAX_RETRIES) await sleep(1500);
        continue;
      }

      const likeMatch    = ogDesc.match(/^([\d,\.]+[KMB]?)\s+like/i);
      const commentMatch = ogDesc.match(/,\s*([\d,\.]+[KMB]?)\s+comment/i);

      return {
        impression: 0,
        view       : 0,
        likes      : parseMetric(likeMatch?.[1] || '0'),
        share      : 0,
        comment    : parseMetric(commentMatch?.[1] || '0'),
        save       : 0,
      };
    } catch {
      if (attempt < MAX_RETRIES) await sleep(1500);
    }
  }
  return null;
}

// ─── Write to Google Sheets ────────────────────────────────────────────────────

async function writeResults(sheets, sheetUrlMap, results) {
  // Build a map: url → result (metrics + log)
  // results Map stores url → { metrics, log }
  // allEntries has url + sheetName + rowIndex for each entry

  const writePromises = [];

  for (const [sheetName, urlRows] of sheetUrlMap.entries()) {
    const metricUpdates = [];
    const logUpdates    = [];

    for (const { rowIndex, url } of urlRows) {
      const result = results.get(url);

      if (!result) continue;

      const { metrics, log } = result;

      // Only write metrics (I–N) if scrape succeeded; always write log (T)
      if (metrics) {
        metricUpdates.push({
          range: `'${sheetName}'!I${rowIndex}:N${rowIndex}`,
          values: [[
            String(metrics.impression),
            String(metrics.view),
            String(metrics.likes),
            String(metrics.share),
            String(metrics.comment),
            String(metrics.save),
          ]],
        });
      }

      logUpdates.push({
        range: `'${sheetName}'!T${rowIndex}`,
        values: [[log]],
      });
    }

    // Always write log (T); write metrics (I–N) only if scrape succeeded
    if (metricUpdates.length === 0 && logUpdates.length === 0) continue;

    writePromises.push(
      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [...metricUpdates, ...logUpdates],
        },
      }).then(() => {
        console.log(`  ✓ [${sheetName}] wrote ${metricUpdates.length} rows`);
      }).catch(err => {
        console.error(`  ✗ [${sheetName}] write failed: ${err.message}`);
      })
    );
  }

  await Promise.all(writePromises);
}

// ─── Main ─────────────────��────────────────────────────────────────────────────

async function detectPlatform(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('tiktok.com')) return 'tiktok';
    if (u.hostname.includes('instagram.com')) return 'instagram';
  } catch {}
  return null;
}

async function main() {
  const startTime = Date.now();

  console.log('🔐 Authenticating with Google Sheets...');
  console.log('📋 Fetching sheet list...');
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const allSheets = meta.data.sheets
    .map(s => ({ title: s.properties.title }))
    .filter(s => /^\[(TT|YC|IG)\]/.test(s.title));

  console.log(`  Found ${allSheets.length} KOL sheets:`);
  allSheets.forEach(s => console.log(`  - ${s.title}`));

  console.log('\n📥 Reading URLs from all sheets...');
  const allData = await Promise.allSettled(
    allSheets.map(async ({ title }) => {
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${title}'!A:S`,
      });
      return { title, rows: resp.data.values || [] };
    })
  );

  const sheetUrlMap = new Map();
  const allEntries  = []; // { sheetName, rowIndex, url }

  for (const result of allData) {
    if (result.status === 'rejected') {
      console.error('  Failed to read sheet:', result.reason.message);
      continue;
    }
    const { title, rows } = result.value;
    const urlRows = [];
    let count = 0;
    for (let i = 1; i < rows.length; i++) {
      const link = (rows[i][7] || '').trim();
      if (link && /https?:\/\/(www\.)?(tiktok\.com|instagram\.com)/i.test(link)) {
        if (MAX_ROWS_PER_SHEET && count >= MAX_ROWS_PER_SHEET) break;
        urlRows.push({ rowIndex: i + 2, url: link });
        allEntries.push({ sheetName: title, rowIndex: i + 2, url: link });
        count++;
      }
    }
    if (urlRows.length) sheetUrlMap.set(title, urlRows);
  }

  const total = allEntries.length;
  console.log(`\n🔗 Total URLs to scrape: ${total}\n`);

  if (total === 0) {
    console.log('Nothing to scrape. Exiting.');
    return;
  }

  console.log(`🌐 Launching ${CONCURRENCY} Chromium browsers...`);

  const BROWSER_ARGS = [
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled', '--disable-web-security',
  ];

  const UA_POOL = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  ];

  const browserPages = await Promise.all(
    Array.from({ length: CONCURRENCY }, async (_, i) => {
      const browser = await chromium.launch({ headless: true, args: BROWSER_ARGS });
      const viewport = { width: 390 + Math.floor(Math.random() * 50), height: 844 + Math.floor(Math.random() * 50) };
      const ctx = await browser.newContext({
        viewport,
        userAgent: UA_POOL[i % UA_POOL.length],
        locale: 'id-ID',
        timezoneId: 'Asia/Jakarta',
      });
      await ctx.route('**/*.{png,jpg,jpeg,gif,svg,webp,mp4,webm}', r => r.abort());
      await ctx.route('**/fonts.googleapis.com/**', r => r.abort());
      await ctx.route('**/fonts.gstatic.com/**', r => r.abort());
      const page = await ctx.newPage();
      return { browser, page };
    })
  );

  console.log(`  ${browserPages.length} browsers ready\n`);

  const results   = new Map(); // url → { metrics, log }
  let successCount = 0;
  let failCount    = 0;
  let lastPct = -1;

  let offset = 0;

  while (offset < total) {
    const chunkSize = Math.min(CONCURRENCY, total - offset);
    const chunk = allEntries.slice(offset, offset + chunkSize);

    const scraped = await Promise.all(
      chunk.map(async (entry, i) => {
        const { url } = entry;
        const { page } = browserPages[i];
        const platform = await detectPlatform(url);

        if (!platform) {
          return { entry, result: null };
        }

        const metrics = platform === 'tiktok'
          ? await scrapeTikTok(page, url)
          : await scrapeInstagram(page, url);

        const result = metrics
          ? { metrics, log: buildLog({ platform, metrics }) }
          : { metrics: null, log: buildLog({ platform, metrics: null, error: 'no data scraped' }) };

        return { entry, result };
      })
    );

    for (const { entry, result } of scraped) {
      if (result.metrics) {
        results.set(entry.url, result);
        successCount++;
      } else {
        results.set(entry.url, result);
        failCount++;
      }
    }

    offset += chunkSize;

    const pct = Math.floor((offset / total) * 100);
    if (pct !== lastPct && pct % 5 === 0) {
      console.log(`  📊 ${offset}/${total} done (${pct}%) — ${successCount} OK · ${failCount} failed`);
      lastPct = pct;
    }

    if (results.size >= BATCH_WRITE && offset < total) {
      console.log(`\n📤 Writing ${results.size} results to Sheets (I–N + T)...`);
      await writeResults(sheets, sheetUrlMap, results);
      results.clear();
      await sleep(WRITE_DELAY);
    }
  }

  await Promise.all(browserPages.map(bp => bp.browser.close().catch(() => {})));

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n✅ Done! ${successCount} scraped · ${failCount} failed · ${elapsed}s elapsed`);

  if (successCount === 0) return;

  console.log('\n📤 Writing final results to Sheets...');
  await writeResults(sheets, sheetUrlMap, results);
  console.log('\n🏁 All done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});