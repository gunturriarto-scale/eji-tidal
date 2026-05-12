import { google } from 'googleapis';
import { ApifyClient } from 'apify-client';
import 'proxy-agent';

const APIFY_TOKEN = process.env.VITE_APIFY_API_TOKEN;
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID;

function formatPrivateKey(key) {
  if (!key) return '';
  let k = key.replace(/\\n/g, '\n').replace(/"/g, '');
  if (k.indexOf('\n') === -1) {
    const prefix = '-----BEGIN PRIVATE KEY-----';
    const suffix = '-----END PRIVATE KEY-----';
    if (k.startsWith(prefix) && k.endsWith(suffix)) {
      let body = k.substring(prefix.length, k.length - suffix.length).replace(/\s+/g, '');
      return `${prefix}\n${body.match(/.{1,64}/g).join('\n')}\n${suffix}`;
    }
  }
  return k;
}

const CREDENTIALS = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
};

// SHEET_CONFIGS: resolved dynamically, all KOL brand sheets
async function getSheetConfigs(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const all = meta.data.sheets
    .map(s => ({ title: s.properties.title, sheetId: s.properties.sheetId }))
    .filter(s => /^\[(TT|YC|IG)\]/.test(s.title));
  return all;
}

// ─── URL / ID helpers ────────────────────────────────────────────────────────

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

function extractIgShortcode(url) {
  // https://www.instagram.com/p/SHORTCODE/
  const match = url?.match(/instagram\.com\/p\/([^/?]+)/);
  return match ? match[1] : null;
}

function extractIgUsername(url) {
  const match = url?.match(/instagram\.com\/([^/?]+)/);
  if (!match) return null;
  const username = match[1].replace(/\/$/, '');
  // Ignore paths that look like /p/xxx
  if (username === 'p') return null;
  return username;
}

// ─── TikTok metrics mapping ──────────────────────────────────────────────────

function buildTikTokMetricsMap(items) {
  const map = new Map();

  for (const item of items) {
    const videoUrl = item.webVideoUrl || item.videoUrl || item.id;
    const cleanUrl = normalizeUrl(videoUrl);
    const videoId = item.id || extractVideoId(videoUrl);

    const metrics = {
      impression: item.playCount ?? 0,
      view: item.playCount ?? 0,
      likes: item.diggCount ?? 0,
      share: item.shareCount ?? 0,
      comment: item.commentCount ?? 0,
      save: item.collectCount ?? 0,
    };

    map.set(cleanUrl, metrics);
    if (videoId) map.set(videoId, metrics);
  }

  return map;
}

// ─── Instagram metrics mapping ──────────────────────────────────────────────
// IG actor (shu8hvrXbJbY3Eb9W) returns: { inputUrl, latestPosts: [...] }
// Each post has: likesCount, commentsCount, url, timestamp, ownerUsername
// We match profile username → most recent post (latestPosts[0])

function buildInstagramMetricsMap(items) {
  const map = new Map(); // username -> metrics

  for (const item of items) {
    const profileUrl = item.inputUrl || item.url || '';
    const username = (extractIgUsername(profileUrl) || item.username || '').toLowerCase();

    if (!username) continue;

    const latestPosts = item.latestPosts || [];
    if (latestPosts.length === 0) continue;

    // Take the most recent post (first in latestPosts)
    const post = latestPosts[0];

    const metrics = {
      impression: 0,
      view      : post.videoPlayCount ?? 0,
      likes     : post.likesCount ?? 0,
      share     : 0,
      comment   : post.commentsCount ?? 0,
      save      : post.savedCount ?? post.commentsSaved ?? 0,
      // Extra metadata for logging
      postsCount    : latestPosts.length,
      latestPostUrl : post.url || '',
      latestPostCode: post.shortCode || '',
    };

    map.set(username, metrics);
  }

  return map;
}

// ─── Write metrics to sheets ─────────────────────────────────────────────────

async function writeMetrics(sheets, sheetConfigs, metricsMap, platform, rowMeta) {
  // rowMeta: array of { url, sheetName, rowIndex } from start-apify
  // metricsMap: Map from url/username to metrics
  // platform: 'tiktok' or 'instagram'

  const updates = [];

  for (const { url, sheetName, rowIndex } of rowMeta) {
    let metrics = null;

    if (platform === 'tiktok') {
      const cleanUrl = normalizeUrl(url);
      const videoId = extractVideoId(url);
      metrics = metricsMap.get(cleanUrl) || (videoId ? metricsMap.get(videoId) : null);
    } else if (platform === 'instagram') {
      const username = extractIgUsername(url);
      if (username) {
        metrics = metricsMap.get(username.toLowerCase());
      }
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
        // Also write post URL + count to O/P for IG
        ...(platform === 'instagram' && metrics.latestPostUrl ? {
          igPostUrl: metrics.latestPostUrl,
          igPostCount: metrics.postsCount,
        } : {}),
      });
    }
  }

  // Chunk updates to avoid hitting API limits
  const CHUNK = 100;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);

    const data = chunk.map(u => ({
      range: u.range,
      values: u.values,
    }));

    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data,
        },
      });
      console.log(`  ✓ [${platform}] wrote ${chunk.length} rows (${i + chunk.length}/${updates.length})`);
    } catch (err) {
      console.error(`  ✗ [${platform}] batch write error: ${err.message}`);
    }
  }

  return updates.length;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const platform = req.query.platform;
    const metaEncoded = req.query.meta;

    if (!platform) {
      return res.status(400).json({ message: 'Missing platform query param' });
    }

    const datasetId = req.body?.resource?.defaultDatasetId;
    if (!datasetId) {
      return res.status(400).json({ message: 'No dataset ID in payload' });
    }

    // ── Load scraped data from Apify dataset ──
    const client = new ApifyClient({ token: APIFY_TOKEN });
    const { items } = await client.dataset(datasetId).listItems();

    console.log(`📥 [${platform}] Got ${items.length} items from Apify dataset`);

    if (items.length === 0) {
      return res.status(200).json({ message: 'No items in dataset — nothing to update.' });
    }

    // ── Build metrics map ──
    let metricsMap;
    let rowMeta;

    if (platform === 'tiktok') {
      metricsMap = buildTikTokMetricsMap(items);
    } else if (platform === 'instagram') {
      metricsMap = buildInstagramMetricsMap(items);
    } else {
      return res.status(400).json({ message: `Unknown platform: ${platform}` });
    }

    // ── Decode row metadata (passed from start-apify via webhook URL) ──
    if (metaEncoded) {
      try {
        const decoded = JSON.parse(Buffer.from(metaEncoded, 'base64').toString('utf-8'));
        rowMeta = decoded;
      } catch {
        rowMeta = [];
      }
    } else {
      rowMeta = [];
    }

    // ── Google Sheets auth ──
    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetConfigs = await getSheetConfigs(sheets);

    // ── Write to sheets ──
    let updatedCount = 0;
    if (rowMeta.length > 0) {
      updatedCount = await writeMetrics(sheets, sheetConfigs, metricsMap, platform, rowMeta);
    }

    // ── Summary log ──
    const sample = items.slice(0, 3).map(item => ({
      id: item.id || item.webVideoUrl || item.inputUrl,
      playCount: item.playCount ?? item.videoPlayCount ?? item.likes ?? '?',
      likes: item.diggCount ?? item.likes ?? '?',
    }));

    console.log(`✅ [${platform}] Done! Updated ${updatedCount} rows.`);
    console.log(`   Sample:`, sample);

    return res.status(200).json({
      message: `Sheet Updated! Platform: ${platform}`,
      platform,
      datasetItems: items.length,
      rowsUpdated: updatedCount,
      sample: sample.slice(0, 2),
    });
  } catch (error) {
    console.error(`Webhook [${req.query.platform}] error:`, error);
    return res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
}