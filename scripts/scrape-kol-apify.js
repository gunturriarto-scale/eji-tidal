/**
 * scripts/scrape-kol-apify.js
 *
 * Trigger Apify actors for TikTok & Instagram scraping
 * Runs on VPS via cronjob
 *
 * Usage:
 *   node scripts/scrape-kol-apify.js
 *
 * Env vars:
 *   VITE_APIFY_API_TOKEN
 *   VITE_SPREADSHEET_ID
 *   GOOGLE_CLIENT_EMAIL (or BQ_CLIENT_EMAIL)
 *   GOOGLE_PRIVATE_KEY (or BQ_PRIVATE_KEY)
 */

import { google } from 'googleapis';
import { ApifyClient } from 'apify-client';
import { writeFileSync } from 'fs';
import 'dotenv/config';

// ─── Config ───────────────────────────────────────────────────────────────────

const APIFY_TOKEN = process.env.VITE_APIFY_API_TOKEN;
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID;
const WEBHOOK_URL = process.env.APIFY_WEBHOOK_URL || 'https://eji-tidal.vercel.app/api/webhook-apify';

if (!APIFY_TOKEN) {
  console.error('[ERROR] VITE_APIFY_API_TOKEN not set');
  process.exit(1);
}

if (!SPREADSHEET_ID) {
  console.error('[ERROR] VITE_SPREADSHEET_ID not set');
  process.exit(1);
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

const SERVICE_ACCOUNT_KEYFILE = '/home/digitaldecade/eji-kol/service-account.json';

const auth = new google.auth.GoogleAuth({
  ...(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    ? {
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL || process.env.BQ_CLIENT_EMAIL,
          private_key: (() => {
            const raw = process.env.GOOGLE_PRIVATE_KEY || process.env.BQ_PRIVATE_KEY;
            if (raw && raw.includes('\n')) return raw;
            if (raw && raw.includes('\\n')) return raw.replace(/\\n/g, '\n');
            return raw || '';
          })(),
        },
      }
    : { keyFile: SERVICE_ACCOUNT_KEYFILE }),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUrl(url) {
  if (!url) return '';
  let u = url.trim().split('?')[0];
  if (u.endsWith('/')) u = u.slice(0, -1);
  return u.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

function extractVideoId(url) {
  const match = url?.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

function extractIgUsername(url) {
  const match = url?.match(/instagram\.com\/([^/?]+)/);
  if (!match) return null;
  const username = match[1].replace(/\/$/, '');
  if (username === 'p' || username === 'reel' || username === 'stories') return null;
  return username;
}

// ─── Extract URLs from sheets ──────────────────────────────────────────────────

async function extractUrls() {
  console.log('📋 Fetching sheet list...');
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const allSheets = meta.data.sheets
    .map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId }))
    .filter(s => /^\[(TT|YC|IG)\]/.test(s.title));

  console.log(`  Found ${allSheets.length} KOL sheets`);

  const tiktokUrls = [];
  const instagramProfiles = [];

  console.log('\n📥 Reading URLs from all sheets...');
  const allData = await Promise.allSettled(
    allSheets.map(async ({ title }) => {
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${title}'!H2:H`,
      });
      return { title, rows: resp.data.values || [] };
    })
  );

  for (const result of allData) {
    if (result.status === 'rejected') {
      console.error('  Failed to read sheet:', result.reason.message);
      continue;
    }

    const { title, rows } = result.value;

    rows.forEach((row, index) => {
      const val = (row[0] || '').trim();
      if (!val) return;

      const rowIndex = index + 2;

      // TikTok: only /video/ URLs
      if (/tiktok\.com/i.test(val) && /\/video\/\d+/i.test(val)) {
        tiktokUrls.push({ url: val, sheetName: title, rowIndex });
      }

      // Instagram: profile or post URLs
      if (/instagram\.com/i.test(val)) {
        instagramProfiles.push({ url: val, sheetName: title, rowIndex });
      }
    });
  }

  // Dedupe
  const ttUnique = [...new Map(tiktokUrls.map(u => [u.url, u])).values()];
  const igUnique = [...new Map(instagramProfiles.map(p => [p.url, p])).values()];

  console.log(`\n🔗 URLs extracted:`);
  console.log(`  TikTok videos: ${ttUnique.length}`);
  console.log(`  Instagram profiles: ${igUnique.length}`);

  return { tiktokUrls: ttUnique, instagramProfiles: igUnique };
}

// ─── Trigger Apify actors ──────────────────────────────────────────────────────

async function triggerApify(tiktokUrls, instagramProfiles) {
  const client = new ApifyClient({ token: APIFY_TOKEN });
  const runs = [];

  // 1. TikTok - split into chunks to avoid 414 Request-URI Too Large
  if (tiktokUrls.length > 0) {
    const CHUNK_SIZE = 500; // Process 500 URLs per actor run
    const chunks = [];
    for (let i = 0; i < tiktokUrls.length; i += CHUNK_SIZE) {
      chunks.push(tiktokUrls.slice(i, i + CHUNK_SIZE));
    }

    console.log(`\n🚀 Starting TikTok scraper (${tiktokUrls.length} URLs in ${chunks.length} batches)...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`  Batch ${i + 1}/${chunks.length}: ${chunk.length} URLs`);

      const ttInput = {
        startUrls: chunk.map(u => ({ url: u.url })),
        maxItems: chunk.length,
        proxyConfiguration: { useApifyProxy: true },
      };

      const urlMeta = chunk.map(u => ({ url: u.url, sheetName: u.sheetName, rowIndex: u.rowIndex }));
      const metaFilename = `/tmp/meta_tt_batch_${i + 1}.json`;
      writeFileSync(metaFilename, JSON.stringify(urlMeta));

      const ttRun = await client.actor('apidojo~tiktok-scraper').start(ttInput, {
        webhooks: [
          {
            eventTypes: ['ACTOR.RUN.SUCCEEDED'],
            requestUrl: `${WEBHOOK_URL}?platform=tiktok&metafile=${metaFilename}`,
          },
        ],
      });

      console.log(`    ✓ Run started: ${ttRun.id}`);
      runs.push({ platform: 'tiktok', runId: ttRun.id, count: chunk.length, batch: i + 1 });
    }
  }

  // 2. Instagram - split into chunks
  if (instagramProfiles.length > 0) {
    const CHUNK_SIZE = 50; // Instagram actor limit
    const chunks = [];
    for (let i = 0; i < instagramProfiles.length; i += CHUNK_SIZE) {
      chunks.push(instagramProfiles.slice(i, i + CHUNK_SIZE));
    }

    console.log(`\n🚀 Starting Instagram scraper (${instagramProfiles.length} URLs in ${chunks.length} batches)...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`  Batch ${i + 1}/${chunks.length}: ${chunk.length} URLs`);

      const igInput = {
        directUrls: chunk.map(p => p.url),
        resultsType: 'posts',
        proxy: { useApifyProxy: true },
      };

      const urlMeta = chunk.map(p => ({ url: p.url, sheetName: p.sheetName, rowIndex: p.rowIndex }));
      const metaFilename = `/tmp/meta_ig_batch_${i + 1}.json`;
      writeFileSync(metaFilename, JSON.stringify(urlMeta));

      const igRun = await client.actor('shu8hvrXbJbY3Eb9W').start(igInput, {
        webhooks: [
          {
            eventTypes: ['ACTOR.RUN.SUCCEEDED'],
            requestUrl: `${WEBHOOK_URL}?platform=instagram&metafile=${metaFilename}`,
          },
        ],
      });

      console.log(`    ✓ Run started: ${igRun.id}`);
      runs.push({ platform: 'instagram', runId: igRun.id, count: chunk.length, batch: i + 1 });
    }
  }

  return runs;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  console.log('🔐 Authenticating with Google Sheets...');

  const { tiktokUrls, instagramProfiles } = await extractUrls();

  if (tiktokUrls.length === 0 && instagramProfiles.length === 0) {
    console.log('\n⚠️  No URLs to scrape. Exiting.');
    return;
  }

  const runs = await triggerApify(tiktokUrls, instagramProfiles);

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n✅ Done! ${runs.length} Apify actor(s) started in ${elapsed}s`);
  console.log('   Webhook will write results to sheets when scraping completes.');
  console.log('   Check Apify dashboard: https://console.apify.com/actors/runs\n');

  runs.forEach(r => {
    const batch = r.batch ? ` batch ${r.batch}` : '';
    console.log(`   ${r.platform}${batch}: ${r.runId} (${r.count} URLs)`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
