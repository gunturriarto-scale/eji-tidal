import { google } from 'googleapis';
import { ApifyClient } from 'apify-client';

// We map credentials via process.env internally
const APIFY_TOKEN = process.env.VITE_APIFY_API_TOKEN;
const SPREADSHEET_ID = process.env.VITE_SPREADSHEET_ID;
const SHEET_NAME = 'Sheet1'; 

// Using the same credentials from your GCP
const CREDENTIALS = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
};

/** Normalisasi URL untuk cocokin */
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
    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Step 1: Read urls from Column H
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!H2:H`,
    });
    
    const rows = getRes.data.values;
    if (!rows || rows.length === 0) {
      return res.status(200).json({ message: 'Tidak ada data URL di kolom H ditemukan.' });
    }

    // Step 2: Ambil yg formatnya Tiktok / valid URL string
    const urlsToScrape = [...new Set(
      rows.map(r => r[0])
          .filter(val => typeof val === 'string' && val.includes('tiktok.com/'))
    )];

    if (urlsToScrape.length === 0) {
      return res.status(200).json({ message: 'Tidak ada URL valid untuk di-scrape.' });
    }

    // Step 3: Trigger Apify dengan Webhook
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
