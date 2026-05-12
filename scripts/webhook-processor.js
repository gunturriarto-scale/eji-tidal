/**
 * scripts/webhook-processor.js
 *
 * Standalone webhook processor — runs on VPS as a simple HTTP server
 * Triggered by Apify when scrape completes
 *
 * Usage:
 *   node scripts/webhook-processor.js
 *   or PM2: pm2 start scripts/webhook-processor.js --name webhook-processor
 */

import { google } from 'googleapis';
import { ApifyClient } from 'apify-client';
import http from 'http';
import 'dotenv/config';

const APIFY_TOKEN = process.env.VITE_APIFY_API_TOKEN;
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID;

const PORT = process.env.WEBHOOK_PORT || 9090;

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
  if (['p', 'reel', 'reels', 'stories'].includes(username)) return null;
  return username;
}

// ─── Build metrics maps ───────────────────────────────────────────────────────

function buildTikTokMetricsMap(items) {
  const map = new Map();
  for (const item of items) {
    // apidojo/tiktok-scraper output format:
    //   id, views, likes, comments, shares, bookmarks, postPage
    const videoUrl = item.postPage || item.webVideoUrl || item.id;
    const cleanUrl = normalizeUrl(videoUrl);
    const videoId = item.id || extractVideoId(videoUrl);
    const metrics = {
      impression: item.views ?? 0,
      view      : item.views ?? 0,
      likes     : item.likes ?? 0,
      share     : item.shares ?? 0,
      comment   : item.comments ?? 0,
      save      : item.bookmarks ?? 0,
    };
    map.set(cleanUrl, metrics);
    if (videoId) map.set(videoId, metrics);
  }
  return map;
}

function buildInstagramMetricsMap(items) {
  const map = new Map();
  for (const item of items) {
    // shu8hvrXbJbY3Eb9W with resultsType: 'posts' returns flat per-URL metrics
    const profileUrl = item.inputUrl || item.url || '';
    const username = (extractIgUsername(profileUrl) || item.username || '').toLowerCase();
    if (!username) continue;
    const metrics = {
      impression: item.videoViewCount ?? 0,
      view      : item.videoPlayCount ?? 0,
      likes     : item.likesCount ?? 0,
      share     : 0,
      comment   : item.commentsCount ?? 0,
      save      : 0,
    };
    map.set(username, metrics);
  }
  return map;
}

// ─── Get all KOL sheet names ───────────────────────────────────────────────────

async function getKOLSheetNames() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return meta.data.sheets
    .map(s => s.properties.title)
    .filter(t => /^\[(TT|YC|IG)\]/.test(t));
}

// ─── Write metrics to sheets ───────────────────────────────────────────────────

async function writeMetrics(platform, metricsMap, rowMeta) {
  const sheetNames = await getKOLSheetNames();
  const updates = [];

  for (const { url, sheetName, rowIndex } of rowMeta) {
    let metrics = null;

    if (platform === 'tiktok') {
      const cleanUrl = normalizeUrl(url);
      const videoId = extractVideoId(url);
      metrics = metricsMap.get(cleanUrl) || (videoId ? metricsMap.get(videoId) : null);
    } else if (platform === 'instagram') {
      const username = extractIgUsername(url);
      if (username) metrics = metricsMap.get(username.toLowerCase());
    }

    if (metrics) {
      updates.push({
        range: `'${sheetName}'!I${rowIndex}:N${rowIndex}`,
        values: [[
          String(metrics.impression || 0),
          String(metrics.view || 0),
          String(metrics.likes || 0),
          String(metrics.share || 0),
          String(metrics.comment || 0),
          String(metrics.save || 0),
        ]],
      });
    }
  }

  if (updates.length === 0) {
    console.log(`  [${platform}] No matching rows to update`);
    return 0;
  }

  // Write in chunks
  const CHUNK = 100;
  let written = 0;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: chunk.map(u => ({ range: u.range, values: u.values })),
        },
      });
      written += chunk.length;
      console.log(`  [${platform}] wrote ${chunk.length}/${updates.length} rows`);
    } catch (err) {
      console.error(`  [${platform}] batch error: ${err.message}`);
    }
  }

  return written;
}

// ─── Handle incoming webhook ───────────────────────────────────────────────────

async function handleWebhook(body, query) {
  const platform = query.platform || 'tiktok';
  const metafile = query.metafile; // path to JSON file on VPS with row metadata
  let rowMeta = [];

  // Load metadata from metafile if provided
  if (metafile) {
    try {
      const { readFileSync } = await import('fs');
      const raw = readFileSync(metafile, 'utf-8');
      rowMeta = JSON.parse(raw);
      console.log(`  Metadata loaded from ${metafile}: ${rowMeta.length} entries`);
    } catch (e) {
      console.error('  ✗ Failed to read metafile:', e.message);
    }
  }

  console.log(`\n🌐 Webhook received [${platform}]`);

  const datasetId = body?.resource?.defaultDatasetId;
  if (!datasetId) {
    console.error('  ✗ No datasetId in payload');
    return { status: 400, message: 'No dataset ID' };
  }

  // Fetch scraped data from Apify
  const client = new ApifyClient({ token: APIFY_TOKEN });
  console.log('  Fetching dataset items...');
  const { items } = await client.dataset(datasetId).listItems();
  console.log(`  ✓ ${items.length} items fetched`);

  if (items.length === 0) {
    return { status: 200, message: 'No items in dataset' };
  }

  // Build metrics map
  let metricsMap;
  if (platform === 'tiktok') {
    metricsMap = buildTikTokMetricsMap(items);
  } else if (platform === 'instagram') {
    metricsMap = buildInstagramMetricsMap(items);
  } else {
    return { status: 400, message: `Unknown platform: ${platform}` };
  }

  console.log(`  Metrics map size: ${metricsMap.size}`);

  // Load row metadata (from metafile or base64 query param)
  if (metafile) {
    // Already loaded above — rowMeta is set
  } else if (query.meta) {
    try {
      rowMeta = JSON.parse(Buffer.from(query.meta, 'base64').toString('utf-8'));
      console.log(`  Metadata from query: ${rowMeta.length} entries`);
    } catch (e) {
      console.error('  ✗ Failed to decode meta:', e.message);
    }
  }
  const updated = await writeMetrics(platform, metricsMap, rowMeta);

  // Log sample
  const sample = items.slice(0, 2).map(item => ({
    id: item.id || item.webVideoUrl || item.inputUrl || '?',
    views: item.playCount ?? item.likesCount ?? item.videoPlayCount ?? '?',
    likes: item.diggCount ?? item.likes ?? '?',
  }));
  console.log(`  Sample:`, sample);

  return { status: 200, platform, items: items.length, rowsUpdated: updated };
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'POST' && url.pathname === '/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const query = Object.fromEntries(url.searchParams);
        const result = await handleWebhook(parsed, query);

        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('Webhook error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Webhook processor listening on port ${PORT}`);
  console.log(`   Webhook URL: http://20.193.224.225:${PORT}/webhook`);
  console.log(`   Health check: http://20.193.224.225:${PORT}/health\n`);
});

server.on('error', err => {
  console.error('Server error:', err);
  process.exit(1);
});