import { google } from 'googleapis';
import { ApifyClient } from 'apify-client';

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
  private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY)
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    await resolveSheetNames(sheets);

    const allUrls = [];

    // Read column H from all valid sheets
    for (const cfg of SHEET_CONFIGS) {
      if (cfg.skip || !cfg.name) continue;
      
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${cfg.name}'!H2:H`,
      });
      
      const rows = getRes.data.values || [];
      rows.forEach(r => {
        const val = r[0];
        if (typeof val === 'string' && val.includes('tiktok.com/')) {
          allUrls.push(val);
        }
      });
    }

    const urlsToScrape = [...new Set(allUrls)];

    if (urlsToScrape.length === 0) {
      return res.status(200).json({ message: 'Tidak ada URL valid untuk di-scrape.' });
    }

    const client = new ApifyClient({ token: APIFY_TOKEN });
    const host = req.headers.origin || `https://${req.headers.host}`;
    
    const input = {
      postURLs: urlsToScrape,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      proxyConfiguration: { useApifyProxy: true }
    };

    const run = await client.actor('clockworks/tiktok-video-scraper').start(input, {
      webhooks: [
        {
          eventTypes: ['ACTOR.RUN.SUCCEEDED'],
          requestUrl: `${host}/api/webhook-apify`
        }
      ]
    });

    return res.status(200).json({ 
      message: 'Perintah Scrape berhasil dikirim ke Apify.',
      runId: run.id
    });
  } catch (error) {
    console.error('Start Apify Error:', error);
    return res.status(500).json({ message: 'Gagal men-trigger Apify', error: error.message });
  }
}
