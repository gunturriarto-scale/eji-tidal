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

// Sheet GIDs — maps to [TT], [YC], [IG] brand groups
const SHEET_CONFIGS = [
  { gid: '1955657192', name: null, platform: 'tt' },
  { gid: '1281836300', name: null, platform: 'tt' },
  { gid: '1330361111', name: null, platform: 'tt' },
  { gid: '1915305170', name: null, platform: 'tt' },
  { gid: '1051897312', name: null, platform: 'tt' },
  { gid: '15317985',   name: null, platform: 'tt' },
  { gid: '1430262330', name: null, platform: 'tt' },
];

// Platform prefix mapping for SHEET_CONFIGS
// These GIDs need to be verified against actual spreadsheet — using same order as original
// Will be resolved dynamically via resolveSheetNames

async function resolveSheetNames(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetList = meta.data.sheets;

  for (const cfg of SHEET_CONFIGS) {
    const found = sheetList.find(s => String(s.properties.sheetId) === cfg.gid);
    if (found) {
      cfg.name = found.properties.title;
      // Infer platform from sheet title
      if (/^\[TT\]/.test(cfg.name)) cfg.platform = 'tt';
      else if (/^\[IG\]/.test(cfg.name)) cfg.platform = 'ig';
      else if (/^\[YC\]/.test(cfg.name)) cfg.platform = 'yc'; // YC = YouTube/other, skip for now
      else cfg.platform = null;
    } else {
      cfg.skip = true;
    }
  }
}

// ─── Extract URLs from sheets ──────────────────────────────────────────────

async function extractUrls(sheets) {
  await resolveSheetNames(sheets);

  const tiktokUrls = [];
  const instagramProfiles = []; // { url, sheetName, rowIndex }

  for (const cfg of SHEET_CONFIGS) {
    if (cfg.skip || !cfg.name) continue;

    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${cfg.name}'!H2:H`,
    });

    const rows = getRes.data.values || [];
    rows.forEach((row, index) => {
      const val = (row[0] || '').trim();
      if (!val) return;

      // TikTok
      if (/tiktok\.com/i.test(val)) {
        // Only use URLs that have /video/ in them (single video)
        if (/\/video\/\d+/i.test(val)) {
          tiktokUrls.push({ url: val, sheetName: cfg.name, rowIndex: index + 2 });
        }
        // Log profile-only URLs but skip them for now
      }

      // Instagram
      if (/instagram\.com/i.test(val)) {
        instagramProfiles.push({ url: val, sheetName: cfg.name, rowIndex: index + 2 });
      }
    });
  }

  return {
    tiktokUrls: [...new Map(tiktokUrls.map(u => [u.url, u])).values()], // dedupe
    instagramProfiles: [...new Map(instagramProfiles.map(p => [p.url, p])).values()],
  };
}

// ─── Normalize URL / ID for matching ────────────────────────────────────────

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
  // https://www.instagram.com/username or https://www.instagram.com/username/
  const match = url?.match(/instagram\.com\/([^/?]+)/);
  return match ? match[1].replace(/\/$/, '') : null;
}

// ─── Trigger Apify actors ──────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📋 Extracting URLs from all KOL sheets...');
    const { tiktokUrls, instagramProfiles } = await extractUrls(sheets);

    console.log(`  TikTok video URLs: ${tiktokUrls.length}`);
    console.log(`  Instagram profiles: ${instagramProfiles.length}`);

    if (tiktokUrls.length === 0 && instagramProfiles.length === 0) {
      return res.status(200).json({ message: 'Tidak ada URL valid untuk di-scrape.' });
    }

    const client = new ApifyClient({ token: APIFY_TOKEN });
    const host = req.headers.origin || `https://${req.headers.host}`;
    const webhookUrl = `${host}/api/webhook-apify`;

    // Store metadata in memory for webhook matching (Vercel functions are stateless)
    // We'll store sheet/row mapping in a separate KV or pass via run context
    // For now, pass the urlMap as a base64-encoded JSON in a custom field

    const runs = [];

    // 1. TikTok: single video URLs
    if (tiktokUrls.length > 0) {
      const ttInput = {
        postURLs: tiktokUrls.map(u => u.url),
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        proxyConfiguration: { useApifyProxy: true },
      };

      // Pass URL metadata for matching later
      const urlMeta = tiktokUrls.map(u => ({ url: u.url, sheetName: u.sheetName, rowIndex: u.rowIndex }));

      const ttRun = await client.actor('clockworks/tiktok-video-scraper').start(ttInput, {
        webhooks: [
          {
            eventTypes: ['ACTOR.RUN.SUCCEEDED'],
            requestUrl: `${webhookUrl}?platform=tiktok&meta=${Buffer.from(JSON.stringify(urlMeta)).toString('base64')}`,
          },
        ],
      });

      console.log(`  TikTok run started: ${ttRun.id} (${tiktokUrls.length} URLs)`);
      runs.push({ platform: 'tiktok', runId: ttRun.id, urlCount: tiktokUrls.length });
    }

    // 2. Instagram: profile URLs → latest posts
    if (instagramProfiles.length > 0) {
      const igInput = {
        directUrls: instagramProfiles.map(p => p.url),
        resultsType: 'latest_posts',
        maxPosts: 10, // Get last 10 posts per profile
        proxy: { useApifyProxy: true },
      };

      const urlMeta = instagramProfiles.map(p => ({ url: p.url, sheetName: p.sheetName, rowIndex: p.rowIndex }));

      const igRun = await client.actor('shu8hvrXbJbY3Eb9W').start(igInput, {
        webhooks: [
          {
            eventTypes: ['ACTOR.RUN.SUCCEEDED'],
            requestUrl: `${webhookUrl}?platform=instagram&meta=${Buffer.from(JSON.stringify(urlMeta)).toString('base64')}`,
          },
        ],
      });

      console.log(`  Instagram run started: ${igRun.id} (${instagramProfiles.length} profiles)`);
      runs.push({ platform: 'instagram', runId: igRun.id, urlCount: instagramProfiles.length });
    }

    return res.status(200).json({
      message: `Scrape dimulai untuk ${runs.length} platform.`,
      runs,
      tiktokCount: tiktokUrls.length,
      instagramCount: instagramProfiles.length,
    });
  } catch (error) {
    console.error('Start Apify Error:', error);
    return res.status(500).json({ message: 'Gagal men-trigger Apify', error: error.message });
  }
}