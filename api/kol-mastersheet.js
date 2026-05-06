import { google } from 'googleapis';

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

function parseNum(val) {
  if (val === undefined || val === null || val === '' || val === '-') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[Rp$\s%,]/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseAchievement(val) {
  if (!val || val === '-') return null;
  const s = String(val).replace('%', '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseRow(row, platform, brand) {
  // Skip placeholder/template rows
  const username = (row[4] || '').trim();
  const linkPost = (row[7] || '').trim();
  if (!username || username === '@username' || username === '-') return null;
  if ((row[0] || '').includes('Tambahkan')) return null;

  // Standard columns A–N (index 0–13), O=datePosting (14)
  // NCO extra: P=Jenis KOL (15), Q=CPV (16), R=Target Views (17), S=Achievement (18)
  const view = parseNum(row[9]);
  const likes = parseNum(row[10]);
  const share = parseNum(row[11]);
  const comment = parseNum(row[12]);
  const save = parseNum(row[13]);
  const ratecard = parseNum(row[6]);
  const targetViews = row[17] != null ? parseNum(row[17]) : null;
  const achievementRaw = row[18] != null ? parseAchievement(row[18]) : null;

  return {
    brand,
    platform,
    category: (row[0] || '').trim(),
    categoryProduct: (row[1] || '').trim(),
    product: (row[2] || '').trim(),
    pic: (row[3] || '').trim(),
    username,
    tier: (row[5] || '').trim().toLowerCase(),
    ratecard,
    linkPost,
    impression: parseNum(row[8]),
    view,
    likes,
    share,
    comment,
    save,
    engagement: likes + share + comment + save,
    datePosting: (row[14] || '').trim(),
    jenisKol: (row[15] || '').trim() || null,
    targetViews,
    achievement: achievementRaw,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Get all sheet names
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties',
    });

    const platformTabs = meta.data.sheets
      .map(s => s.properties.title)
      .filter(name => /^\[(TT|YC|IG)\]/.test(name));

    // Fetch all tabs in parallel
    const results = await Promise.all(
      platformTabs.map(async (tabName) => {
        const platformMatch = tabName.match(/^\[(TT|YC|IG)\]/);
        const platform = platformMatch ? platformMatch[1] : 'TT';
        const brand = tabName.replace(/^\[(TT|YC|IG)\]\s*/, '').trim();

        try {
          const resp = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${tabName}'!A:S`,
          });

          const rows = resp.data.values || [];
          // Row 0 = header, skip it
          const parsed = rows.slice(1)
            .map(row => parseRow(row, platform, brand))
            .filter(Boolean);

          return parsed;
        } catch {
          return [];
        }
      })
    );

    const data = results.flat();

    return res.status(200).json({
      data,
      meta: {
        total: data.length,
        tabs: platformTabs.length,
        fetched: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('kol-mastersheet error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
