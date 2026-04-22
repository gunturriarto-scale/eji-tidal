import { google } from 'googleapis';
import { ApifyClient } from 'apify-client';

const APIFY_TOKEN = process.env.VITE_APIFY_API_TOKEN;
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID;

const CREDENTIALS = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
};

const SHEET_CONFIGS = [
  { gid: '1955657192', name: null }, 
  { gid: '1281836300', name: null },
  { gid: '1330361111', name: null },
  { gid: '1915305170', name: null },
  { gid: '1051897312', name: null },
  { gid: '15317985',   name: null },
  { gid: '1430262330', name: null },
];

async function resolveSheetNames(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetList = meta.data.sheets;

  for (const cfg of SHEET_CONFIGS) {
    const found = sheetList.find(s => String(s.properties.sheetId) === cfg.gid);
    if (found) {
      cfg.name = found.properties.title;
    } else {
      cfg.skip = true;
    }
  }
}

function normalizeUrl(url) {
  if (!url) return '';
  let u = url.trim().split('?')[0]; 
  if (u.endsWith('/')) u = u.slice(0, -1);
  return u.replace(/^https?:\/\//i, '');
}

function extractVideoId(url) {
  const match = url?.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const datasetId = req.body?.resource?.defaultDatasetId;
    if (!datasetId) {
      return res.status(400).json({ message: 'No dataset ID found in payload' });
    }

    const client = new ApifyClient({ token: APIFY_TOKEN });
    const { items } = await client.dataset(datasetId).listItems();
    
    // Extracted Metrics Map
    const metricsMap = new Map();
    for (const item of items) {
      const videoUrl  = item.webVideoUrl || item.videoUrl || item.id;
      const cleanUrl  = normalizeUrl(videoUrl);
      const videoId   = extractVideoId(videoUrl);

      const metrics = {
        impression : item.playCount   ?? item.viewCount ?? 0,
        view       : item.playCount   ?? 0,
        likes      : item.diggCount   ?? item.likeCount ?? 0,
        share      : item.shareCount  ?? 0,
        comment    : item.commentCount ?? 0,
        save       : item.collectCount ?? item.saveCount ?? 0,
      };

      metricsMap.set(cleanUrl, metrics);
      if (videoId) metricsMap.set(videoId, metrics);
    }

    // Google Sheets Auth
    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    await resolveSheetNames(sheets);

    const updates = [];

    // Loop through all sheets
    for (const cfg of SHEET_CONFIGS) {
      if (cfg.skip || !cfg.name) continue;

      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${cfg.name}'!H2:N`,
      });
      
      const rows = getRes.data.values || [];

      rows.forEach((row, index) => {
        const originalUrl = row[0];
        if (!originalUrl || !originalUrl.includes('tiktok.com/')) return;

        const cleanUrl = normalizeUrl(originalUrl);
        const videoId = extractVideoId(originalUrl);
        
        const metrics = metricsMap.get(cleanUrl) || metricsMap.get(videoId);

        if (metrics) {
          updates.push({
            range: `'${cfg.name}'!I${index + 2}:N${index + 2}`,
            values: [[
              metrics.impression.toString(),
              metrics.view.toString(),
              metrics.likes.toString(),
              metrics.share.toString(),
              metrics.comment.toString(),
              metrics.save.toString()
            ]]
          });
        }
      });
    }

    if (updates.length > 0) {
      // Chunk updates if it exceeds payload size, but Vercel / Google API handle ~500 updates fine.
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      });
    }

    return res.status(200).json({ message: 'Sheet Updated via Webhook!' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
