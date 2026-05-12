import { BigQuery } from '@google-cloud/bigquery';
import Papa from 'papaparse';
import { google } from 'googleapis';

// ─── AdaCode AI Config ────────────────────────────────────────────────────────
const ADA_CODE_BASE_URL = 'https://api.adacode.ai/v1';
const ADA_CODE_API_KEY = process.env.ADA_CODE_API_KEY;
const ADA_CODE_MODEL = process.env.ADA_CODE_MODEL || 'claude-opus-4-7';

// ─── BigQuery Config ─────────────────────────────────────────────────────────
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

function getBQClient() {
  return new BigQuery({
    projectId: process.env.BQ_PROJECT_ID,
    credentials: {
      client_email: process.env.BQ_CLIENT_EMAIL,
      private_key: formatPrivateKey(process.env.BQ_PRIVATE_KEY),
    },
  });
}

// ─── In-memory BigQuery Cache (TTL 5 min) ─────────────────────────────────────
const bqCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCache(key) {
  const entry = bqCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    bqCache.delete(key);
    return null;
  }
  return entry.data;
}
function setCache(key, data) {
  bqCache.set(key, { data, ts: Date.now() });
}

// ─── Google Sheets (Command Center) ─────────────────────────────────────────
const COMMAND_CENTER_SHEET_ID = '1IBX2WsOdSn0rDDSBQFG1ZK9Ihp7AoSKU5NX3AbAqPmI';

function parseNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  let s = String(val).replace(/[Rp$\s%]/g, '').trim();
  if (!s) return 0;
  const lastSepPos = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  if (lastSepPos === -1) return parseFloat(s) || 0;
  if (s.length - 1 - lastSepPos === 3) return parseFloat(s.replace(/[.,]/g, '')) || 0;
  const thousands = s.substring(0, lastSepPos).replace(/[.,]/g, '');
  const decimals = s.substring(lastSepPos + 1).replace(/[.,]/g, '');
  return parseFloat(thousands + '.' + decimals) || 0;
}

function cleanNumbers(row) {
  const cleaned = { ...row };
  for (let key in cleaned) {
    if (typeof cleaned[key] === 'string') {
      const withoutCommas = cleaned[key].replace(/,/g, '');
      if (cleaned[key].includes('Rp') || /^-?[\d,.]+$/.test(cleaned[key])) {
        let raw = cleaned[key].replace(/[Rp\s]/g, '');
        if (raw.includes('.') && raw.includes(',')) {
          raw = raw.replace(/\./g, '').replace(',', '.');
        } else if (raw.includes('.') && raw.split('.').pop().length === 3) {
          raw = raw.replace(/\./g, '');
        } else if (raw.includes(',') && raw.split(',').pop().length === 3) {
          raw = raw.replace(/,/g, '');
        }
        const val = parseFloat(raw);
        if (!isNaN(val)) cleaned[key] = val;
      } else if (!isNaN(withoutCommas) && withoutCommas.trim() !== '' && !cleaned[key].includes('%')) {
        cleaned[key] = Number(withoutCommas);
      }
    }
  }
  return cleaned;
}

// Build a lookup of header name (lowercase, trimmed) → column index
function buildHeaderIndex(headerRow) {
  const idx = {};
  if (!headerRow) return idx;
  headerRow.forEach((cell, i) => {
    const key = String(cell || '').toLowerCase().trim();
    if (key) idx[key] = i;
  });
  return idx;
}

// Find first column index whose header contains any of the given keywords
function findCol(idx, ...keywords) {
  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    // Exact match first
    if (idx[lower] !== undefined) return idx[lower];
    // Partial match
    const found = Object.keys(idx).find((k) => k.includes(lower));
    if (found !== undefined) return idx[found];
  }
  return -1;
}

function mapPositionalData(rawRows) {
  if (!rawRows || rawRows.length < 2) return [];

  const headerRow = rawRows[0];
  const h = buildHeaderIndex(headerRow);

  // Map header names to column indices with fallback to known positions
  const col = {
    month:           findCol(h, 'month', 'bulan') !== -1 ? findCol(h, 'month', 'bulan') : 0,
    category:        findCol(h, 'category', 'kategori') !== -1 ? findCol(h, 'category', 'kategori') : 3,
    categoryProduct: findCol(h, 'category product', 'cat product') !== -1 ? findCol(h, 'category product', 'cat product') : 4,
    brand:           findCol(h, 'brand') !== -1 ? findCol(h, 'brand') : 5,
    product:         findCol(h, 'product', 'produk') !== -1 ? findCol(h, 'product', 'produk') : 6,
    pic:             findCol(h, 'pic') !== -1 ? findCol(h, 'pic') : 7,
    budgetOverall:   findCol(h, 'budget overall', 'total budget', 'overall budget') !== -1 ? findCol(h, 'budget overall', 'total budget', 'overall budget') : 9,
    estImp:          findCol(h, 'est imp', 'estimated imp') !== -1 ? findCol(h, 'est imp', 'estimated imp') : 10,
    impressions:     findCol(h, 'actual imp', 'impressions', 'total imp') !== -1 ? findCol(h, 'actual imp', 'impressions', 'total imp') : 11,
    reach:           findCol(h, 'reach') !== -1 ? findCol(h, 'reach') : 12,
    budgetMeta:      findCol(h, 'budget meta', 'meta budget') !== -1 ? findCol(h, 'budget meta', 'meta budget') : 21,
    spentMeta:       findCol(h, 'spent meta', 'meta spent', 'actual meta') !== -1 ? findCol(h, 'spent meta', 'meta spent', 'actual meta') : 22,
    actualImpMeta:   findCol(h, 'imp meta', 'meta imp') !== -1 ? findCol(h, 'imp meta', 'meta imp') : 23,
    budgetTiktok:    findCol(h, 'budget tiktok', 'tiktok budget') !== -1 ? findCol(h, 'budget tiktok', 'tiktok budget') : 24,
    spentTiktok:     findCol(h, 'spent tiktok', 'tiktok spent') !== -1 ? findCol(h, 'spent tiktok', 'tiktok spent') : 25,
    actualImpTiktok: findCol(h, 'imp tiktok', 'tiktok imp') !== -1 ? findCol(h, 'imp tiktok', 'tiktok imp') : 26,
    budgetGoogle:    findCol(h, 'budget google', 'google budget') !== -1 ? findCol(h, 'budget google', 'google budget') : 27,
    spentGoogle:     findCol(h, 'spent google', 'google spent') !== -1 ? findCol(h, 'spent google', 'google spent') : 28,
    actualImpGoogle: findCol(h, 'imp google', 'google imp') !== -1 ? findCol(h, 'imp google', 'google imp') : 29,
    spentTotal:      findCol(h, 'total spent', 'total spend', 'spent total') !== -1 ? findCol(h, 'total spent', 'total spend', 'spent total') : 75,
    budgetCriteo:    findCol(h, 'budget criteo', 'criteo budget') !== -1 ? findCol(h, 'budget criteo', 'criteo budget') : 93,
    spentCriteo:     findCol(h, 'spent criteo', 'criteo spent') !== -1 ? findCol(h, 'spent criteo', 'criteo spent') : 94,
    budgetSegomento: findCol(h, 'budget segom', 'segomento budget') !== -1 ? findCol(h, 'budget segom', 'segomento budget') : 95,
    actualImpCriteo: findCol(h, 'imp criteo', 'criteo imp') !== -1 ? findCol(h, 'imp criteo', 'criteo imp') : 96,
    spentSegomento:  findCol(h, 'spent segom', 'segomento spent') !== -1 ? findCol(h, 'spent segom', 'segomento spent') : 97,
    actualImpSegomento: findCol(h, 'imp segom', 'segomento imp') !== -1 ? findCol(h, 'imp segom', 'segomento imp') : 99,
  };

  return rawRows.slice(1).map(row => {
    const p = parseNum;
    const brand = row[col.brand] || '';
    const spentTotal = p(row[col.spentTotal]);
    const budgetOverall = p(row[col.budgetOverall]);
    if (!brand && !spentTotal && !budgetOverall) return null;

    return cleanNumbers({
      brand,
      month: row[col.month] || '',
      category: row[col.category] || '',
      categoryProduct: row[col.categoryProduct] || '',
      product: row[col.product] || '',
      pic: row[col.pic] || '',
      budgetOverall,
      spent: spentTotal,
      estImp: p(row[col.estImp]),
      impressions: p(row[col.impressions]) || p(row[col.estImp]),
      reach: p(row[col.reach]),
      budgetMeta: p(row[col.budgetMeta]),
      spentMeta: p(row[col.spentMeta]),
      actualImpMeta: p(row[col.actualImpMeta]),
      budgetTiktok: p(row[col.budgetTiktok]),
      spentTiktok: p(row[col.spentTiktok]),
      actualImpTiktok: p(row[col.actualImpTiktok]),
      budgetGoogle: p(row[col.budgetGoogle]),
      spentGoogle: p(row[col.spentGoogle]),
      actualImpGoogle: p(row[col.actualImpGoogle]),
      budgetCriteo: p(row[col.budgetCriteo]),
      spentCriteo: p(row[col.spentCriteo]),
      actualImpCriteo: p(row[col.actualImpCriteo]),
      budgetSegomento: p(row[col.budgetSegomento]),
      spentSegomento: p(row[col.spentSegomento]),
      actualImpSegomento: p(row[col.actualImpSegomento]),
      pacing: budgetOverall > 0 ? (spentTotal / budgetOverall) * 100 : 0,
    });
  }).filter(Boolean);
}

async function fetchCommandCenter() {
  const cacheKey = 'commandCenter';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `https://docs.google.com/spreadsheets/d/${COMMAND_CENTER_SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;
  const resp = await fetch(url);
  const csv = await resp.text();
  const parsed = Papa.parse(csv, { skipEmptyLines: true, header: false });
  const data = mapPositionalData(parsed.data || []);
  setCache(cacheKey, data);
  return data;
}

const KOL_SHEET_ID = process.env.VITE_SPREADSHEET_ID;

function formatGoogleKey(key) {
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

function parseKolNum(val) {
  if (val === undefined || val === null || val === '' || val === '-') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[Rp$\s%,]/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

async function fetchKOL() {
  const cacheKey = 'kol';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: formatGoogleKey(process.env.GOOGLE_PRIVATE_KEY),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: KOL_SHEET_ID,
      fields: 'sheets.properties',
    });

    const platformTabs = meta.data.sheets
      .map((s) => s.properties.title)
      .filter((name) => /^\[(TT|YC|IG)\]/.test(name));

    const results = await Promise.all(
      platformTabs.map(async (tabName) => {
        const platformMatch = tabName.match(/^\[(TT|YC|IG)\]/);
        const platform = platformMatch ? platformMatch[1] : 'TT';
        const brand = tabName.replace(/^\[(TT|YC|IG)\]\s*/, '').trim();
        try {
          const resp = await sheets.spreadsheets.values.get({
            spreadsheetId: KOL_SHEET_ID,
            range: `'${tabName}'!A:S`,
          });
          const rows = resp.data.values || [];
          return rows.slice(1).map((row) => {
            const username = (row[4] || '').trim();
            const linkPost = (row[7] || '').trim();
            if (!username || username === '@username' || username === '-') return null;
            if ((row[0] || '').includes('Tambahkan')) return null;
            const view = parseKolNum(row[9]);
            const likes = parseKolNum(row[10]);
            const share = parseKolNum(row[11]);
            const comment = parseKolNum(row[12]);
            const save = parseKolNum(row[13]);
            const ratecard = parseKolNum(row[6]);
            const targetViews = row[17] != null ? parseKolNum(row[17]) : null;
            const achievementRaw = row[18] != null ? parseKolNum(row[18]) : null;
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
              impression: parseKolNum(row[8]),
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
          }).filter(Boolean);
        } catch {
          return [];
        }
      })
    );

    const data = results.flat();
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error('KOL fetch error:', err);
    return [];
  }
}

// ─── BigQuery Query Registry ───────────────────────────────────────────────────
function getBQQuery(type, params = {}) {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-01-01`;
  const defaultEnd = `${now.getFullYear()}-12-31`;
  const start = params.start || defaultStart;
  const end = params.end || defaultEnd;
  const account = params.account || 'all';

  const queries = {
    topCampaigns: `
      SELECT ACCOUNT_NAME, CAMPAIGN_NAME, CAMPAIGN_OBJECTIVE, CAMPAIGN_STATUS,
        ROUND(SUM(COST)) as spend,
        SUM(IMPRESSIONS) as impressions,
        SUM(REACH) as reach,
        SUM(CLICKS) as clicks,
        ROUND(SUM(OFFSITE_CONVERSION_VALUE_FB_PIXEL_PURCHASE)) as purchase_value,
        ROUND(SUM(OFFSITE_CONVERSIONS_FB_PIXEL_PURCHASE)) as purchases,
        ROUND(SUM(COST) / NULLIF(SUM(IMPRESSIONS),0) * 1000, 2) as cpm
      FROM \`bigdata.FBADS_AD\`
      WHERE DATE BETWEEN '${start}' AND '${end}'
      ${account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
      GROUP BY 1,2,3,4
      ORDER BY spend DESC
      LIMIT 20`,

    metaOverview: `
      SELECT ACCOUNT_NAME,
        ROUND(SUM(COST)) as spend,
        SUM(IMPRESSIONS) as impressions,
        SUM(REACH) as reach,
        SUM(CLICKS) as clicks,
        ROUND(SUM(COST) / NULLIF(SUM(IMPRESSIONS),0) * 1000, 2) as cpm,
        ROUND(SUM(OFFSITE_CONVERSION_VALUE_FB_PIXEL_PURCHASE)) as purchase_value
      FROM \`bigdata.FBADS_AD\`
      WHERE DATE BETWEEN '${start}' AND '${end}'
      GROUP BY 1
      ORDER BY spend DESC`,

    metaTrend: `
      SELECT DATE,
        ROUND(SUM(COST)) as spend,
        SUM(IMPRESSIONS) as impressions,
        SUM(CLICKS) as clicks
      FROM \`bigdata.FBADS_AD\`
      WHERE DATE BETWEEN '${start}' AND '${end}'
      GROUP BY 1
      ORDER BY DATE`,

    metaAgeGender: `
      SELECT AGE, GENDER,
        ROUND(SUM(COST)) as spend,
        SUM(IMPRESSIONS) as impressions,
        SUM(REACH) as reach
      FROM \`bigdata.FBADS_AGE_GENDER\`
      WHERE DATE BETWEEN '${start}' AND '${end}'
      ${account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
      GROUP BY 1,2
      ORDER BY spend DESC
      LIMIT 30`,

    metaPlatform: `
      SELECT PUBLISHER_PLATFORM as platform,
        ROUND(SUM(COST)) as spend,
        SUM(IMPRESSIONS) as impressions,
        SUM(REACH) as reach
      FROM \`bigdata.FBADS_AD\`
      WHERE DATE BETWEEN '${start}' AND '${end}'
      GROUP BY 1
      ORDER BY spend DESC`,

    metaPlacement: `
      SELECT PLATFORM_POSITION as placement, PUBLISHER_PLATFORM as platform,
        ROUND(SUM(COST)) as spend,
        SUM(IMPRESSIONS) as impressions,
        ROUND(SUM(OFFSITE_CONVERSIONS_FB_PIXEL_PURCHASE)) as purchases
      FROM \`bigdata.FBADS_AD\`
      WHERE DATE BETWEEN '${start}' AND '${end}'
      AND PLATFORM_POSITION != ''
      GROUP BY 1,2
      ORDER BY spend DESC
      LIMIT 20`,

    tiktokTopCampaigns: `
      SELECT ACCOUNT_NAME, CAMPAIGN_NAME, CAMPAIGN_OBJECTIVE_TYPE as objective,
        ROUND(SUM(SPEND)) as spend,
        SUM(IMPRESSIONS) as impressions,
        SUM(CLICKS) as clicks,
        SUM(VIDEO_VIEW_2_SECONDS) as video_2s,
        SUM(CONVERSIONS) as conversions
      FROM \`bigdata.TIKTOK_AD\`
      WHERE DATE BETWEEN '${start}' AND '${end}'
      ${account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
      GROUP BY 1,2,3
      ORDER BY spend DESC
      LIMIT 20`,

    tiktokOverview: `
      SELECT ACCOUNT_NAME,
        ROUND(SUM(SPEND)) as spend,
        SUM(IMPRESSIONS) as impressions,
        SUM(CLICKS) as clicks,
        SUM(VIDEO_VIEW_2_SECONDS) as video_views,
        SUM(CONVERSIONS) as conversions
      FROM \`bigdata.TIKTOK_AD\`
      WHERE DATE BETWEEN '${start}' AND '${end}'
      GROUP BY 1
      ORDER BY spend DESC`,
  };

  return queries[type] || null;
}

async function fetchBigQuery(type, params = {}) {
  const cacheKey = `bq:${type}:${params.start || 'all'}:${params.end || 'all'}:${params.account || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const query = getBQQuery(type, params);
  if (!query) return null;

  try {
    const bq = getBQClient();
    const [rows] = await bq.query({ query, location: 'US' });
    const data = rows.map((row) => {
      const cleaned = {};
      for (const [key, val] of Object.entries(row)) {
        if (val !== null && val !== undefined) cleaned[key] = val;
      }
      return cleaned;
    });
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.error('BigQuery error:', err);
    return null;
  }
}

// ─── AdaCode AI Call ──────────────────────────────────────────────────────────
async function callAdaCode(messages) {
  const response = await fetch(`${ADA_CODE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ADA_CODE_API_KEY}`,
    },
    body: JSON.stringify({
      model: ADA_CODE_MODEL,
      messages,
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AdaCode API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Maaf, terjadi kesalahan saat memproses jawaban.';
}

// ─── Date Range Parsing ────────────────────────────────────────────────────────
function parseDateRange(message) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const day = now.getDate();

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

  const lower = message.toLowerCase();

  // "hari ini" / "today"
  if (/hari ini|today/.test(lower)) {
    const d = fmt(year, month + 1, day);
    return { start: d, end: d };
  }

  // "kemarin" / "yesterday"
  if (/kemarin|yesterday/.test(lower)) {
    const yesterday = new Date(now);
    yesterday.setDate(day - 1);
    const d = fmt(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate());
    return { start: d, end: d };
  }

  // "7 hari terakhir" / "minggu lalu" / "last week" / "7 days"
  if (/7 hari|minggu lalu|last week|last 7 days|7 days/.test(lower)) {
    const start = new Date(now);
    start.setDate(day - 7);
    return {
      start: fmt(start.getFullYear(), start.getMonth() + 1, start.getDate()),
      end: fmt(year, month + 1, day),
    };
  }

  // "30 hari terakhir" / "sebulan terakhir" / "last 30 days"
  if (/30 hari|sebulan terakhir|last 30 days|last month/.test(lower)) {
    const start = new Date(now);
    start.setDate(day - 30);
    return {
      start: fmt(start.getFullYear(), start.getMonth() + 1, start.getDate()),
      end: fmt(year, month + 1, day),
    };
  }

  // "bulan ini" / "this month"
  if (/bulan ini|this month/.test(lower)) {
    return {
      start: fmt(year, month + 1, 1),
      end: fmt(year, month + 1, day),
    };
  }

  // "bulan lalu" / "last month" (exact)
  if (/bulan lalu/.test(lower)) {
    const lastMonth = month === 0 ? 12 : month;
    const lastMonthYear = month === 0 ? year - 1 : year;
    const lastDay = new Date(lastMonthYear, lastMonth, 0).getDate();
    return {
      start: fmt(lastMonthYear, lastMonth, 1),
      end: fmt(lastMonthYear, lastMonth, lastDay),
    };
  }

  // "tahun ini" / "this year"
  if (/tahun ini|this year/.test(lower)) {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }

  // Month names (ID & EN): "januari", "februari", ... / "january", ...
  const monthNames = [
    ['januari', 'january', 'jan'],
    ['februari', 'february', 'feb'],
    ['maret', 'march', 'mar'],
    ['april', 'apr'],
    ['mei', 'may'],
    ['juni', 'june', 'jun'],
    ['juli', 'july', 'jul'],
    ['agustus', 'august', 'aug'],
    ['september', 'sep', 'sept'],
    ['oktober', 'october', 'oct'],
    ['november', 'nov'],
    ['desember', 'december', 'dec'],
  ];
  for (let i = 0; i < monthNames.length; i++) {
    const variants = monthNames[i];
    if (variants.some((v) => lower.includes(v))) {
      const m = i + 1; // 1-based
      // Try to extract year from message like "mei 2025"
      const yearMatch = message.match(/20\d{2}/);
      const targetYear = yearMatch ? parseInt(yearMatch[0]) : year;
      const lastDay = new Date(targetYear, m, 0).getDate();
      return {
        start: fmt(targetYear, m, 1),
        end: fmt(targetYear, m, lastDay),
      };
    }
  }

  // Default: current month (safer than full year)
  return {
    start: fmt(year, month + 1, 1),
    end: fmt(year, month + 1, day),
  };
}

// ─── Intent Detection & Data Fetching ─────────────────────────────────────────
function detectIntent(message) {
  const lower = message.toLowerCase();
  const intents = new Set();

  // KOL / Influencer
  if (/kol|konten kreator|influencer|kreator|creator|content creator/i.test(lower)) intents.add('kol');

  // Meta / Facebook / Instagram Ads
  if (/meta|facebook|fb ads|fb campaign|ig ads|instagram (ads|campaign|iklan)|paid social|facebook ads/i.test(lower)) intents.add('meta_ads');

  // TikTok Ads
  if (/tiktok|tt ads|tiktok (ads|campaign|spend|iklan)/i.test(lower)) intents.add('tiktok_ads');

  // Trend / time series
  if (/trend|per bulan|bulanan|growth|month|mingguan|weekly|harian|daily|naik|turun|grafik/i.test(lower)) intents.add('trend');

  // Top campaigns / rankings
  if (/top\s*\d*|tertinggi|ranking|terbaik|campaign.*spend|spend.*tertinggi|best perform|performa terbaik/i.test(lower)) intents.add('top_campaigns');

  // Brand breakdown
  if (/brand|per brand|merk|produk/i.test(lower)) intents.add('brand');

  // Channel breakdown
  if (/channel|per channel|meta.*tiktok|breakdown.*channel|platform|saluran/i.test(lower)) intents.add('channel');

  // Pacing / budget usage
  if (/pacing|underspend|overspend|exceed|penggunaan budget|sisa budget|budget usage|serap|serapan/i.test(lower)) intents.add('pacing');

  // CPM / efficiency
  if (/cpm|biaya per|cost per|impresi|hemat|efisiensi|efficiency|cpc|ctr/i.test(lower)) intents.add('cpm');

  // Overview / total summary
  if (/overview|total.*spend|total.*budget|summary|ringkasan|rekap|rekapitulasi|keseluruhan|semua|berapa.*total/i.test(lower)) intents.add('overview');

  // Alerts / anomalies
  if (/alert|warning|masalah|problem|issue|overspending|underspending|anomali|abnormal/i.test(lower)) intents.add('alert');

  // Demographics
  if (/demo|age|usia|gender|laki|perempuan|female|male|demografi/i.test(lower)) intents.add('demographics');

  // Placement
  if (/placement|reels|stories|feed|explore|audience network|position/i.test(lower)) intents.add('placement');

  // Fallback: if no specific intent matched, default to overview so we still fetch CC data
  if (intents.size === 0) intents.add('overview');

  return [...intents];
}

async function fetchAllRelevantData(intents, ccData, dateParams = {}) {
  const results = {};

  // Always include CC summary as base context regardless of intent
  if (ccData.length > 0) {
    results.commandCenter = {
      raw: ccData,
      summary: aggregateCC(ccData),
      byBrand: groupBy(ccData, 'brand'),
      byChannel: aggregateChannel(ccData),
      overspending: ccData.filter((r) => r.pacing > 100),
      underspending: ccData.filter((r) => r.pacing < 70),
    };
  }

  // KOL data
  if (intents.includes('kol')) {
    results.kol = await fetchKOL();
  }

  // BigQuery - Meta Ads
  if (intents.includes('meta_ads') || intents.includes('top_campaigns') || intents.includes('demographics')) {
    const bqData = {};
    const bqTypes = [];
    if (intents.includes('top_campaigns') || intents.includes('meta_ads')) bqTypes.push('topCampaigns', 'metaOverview');
    if (intents.includes('demographics')) bqTypes.push('metaAgeGender');
    if (intents.includes('placement')) bqTypes.push('metaPlacement');

    await Promise.all(
      bqTypes.map(async (type) => {
        bqData[type] = await fetchBigQuery(type, dateParams);
      })
    );
    if (Object.values(bqData).some(Boolean)) results.bigQueryMeta = bqData;
  }

  // BigQuery - TikTok Ads
  if (intents.includes('tiktok_ads')) {
    results.bigQueryTikTok = {
      overview: await fetchBigQuery('tiktokOverview', dateParams),
      campaigns: await fetchBigQuery('tiktokTopCampaigns', dateParams),
    };
  }

  return results;
}

function aggregateCC(data) {
  const totalBudget = data.reduce((s, r) => s + (r.budgetOverall || 0), 0);
  const totalSpent = data.reduce((s, r) => s + (r.spent || 0), 0);
  const totalImp = data.reduce((s, r) => s + (r.impressions || 0), 0);
  const avgPacing = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const actualCPM = totalImp > 0 ? (totalSpent / totalImp) * 1000 : 0;

  return {
    totalBudget,
    totalSpent,
    totalRemaining: Math.max(0, totalBudget - totalSpent),
    totalImpressions: totalImp,
    avgPacing: Math.round(avgPacing * 10) / 10,
    actualCPM: Math.round(actualCPM * 100) / 100,
    brandCount: [...new Set(data.map((r) => r.brand).filter(Boolean))].length,
    productCount: [...new Set(data.map((r) => r.product).filter(Boolean))].length,
  };
}

function groupBy(data, key) {
  const groups = {};
  for (const row of data) {
    const k = row[key] || 'Unknown';
    if (!groups[k]) groups[k] = [];
    groups[k].push(row);
  }
  const result = [];
  for (const [k, rows] of Object.entries(groups)) {
    result.push({
      [key]: k,
      budget: rows.reduce((s, r) => s + (r.budgetOverall || 0), 0),
      spent: rows.reduce((s, r) => s + (r.spent || 0), 0),
      impressions: rows.reduce((s, r) => s + (r.impressions || 0), 0),
      pacing: 0,
    });
  }
  for (const g of result) {
    g.pacing = g.budget > 0 ? Math.round((g.spent / g.budget) * 1000) / 10 : 0;
    g.cpm = g.impressions > 0 ? Math.round((g.spent / g.impressions) * 1000 * 100) / 100 : 0;
  }
  result.sort((a, b) => b.spent - a.spent);
  return result;
}

function aggregateChannel(data) {
  const channels = [
    { id: 'meta', label: 'Meta', budgetKey: 'budgetMeta', spentKey: 'spentMeta', impKey: 'actualImpMeta', color: '#1877F2' },
    { id: 'tiktok', label: 'TikTok', budgetKey: 'budgetTiktok', spentKey: 'spentTiktok', impKey: 'actualImpTiktok', color: '#FF0050' },
    { id: 'google', label: 'Google', budgetKey: 'budgetGoogle', spentKey: 'spentGoogle', impKey: 'actualImpGoogle', color: '#4285F4' },
    { id: 'criteo', label: 'Criteo', budgetKey: 'budgetCriteo', spentKey: 'spentCriteo', impKey: 'actualImpCriteo', color: '#E8064D' },
    { id: 'segmento', label: 'Segomento', budgetKey: 'budgetSegomento', spentKey: 'spentSegomento', impKey: 'actualImpSegomento', color: '#00C2FF' },
  ];

  return channels
    .map((ch) => {
      const totalBudget = data.reduce((s, r) => s + (r[ch.budgetKey] || 0), 0);
      const totalSpent = data.reduce((s, r) => s + (r[ch.spentKey] || 0), 0);
      const totalImp = data.reduce((s, r) => s + (r[ch.impKey] || 0), 0);
      return {
        channel: ch.label,
        budget: totalBudget,
        spent: totalSpent,
        impressions: totalImp,
        pacing: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0,
        cpm: totalImp > 0 ? Math.round((totalSpent / totalImp) * 1000 * 100) / 100 : 0,
      };
    })
    .filter((ch) => ch.budget > 0 || ch.spent > 0);
}

function formatNumber(num) {
  if (!num && num !== 0) return '—';
  const n = Number(num);
  if (isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

function buildContextPrompt(userMessage, dataSources) {
  let context = '';

  if (dataSources.commandCenter) {
    const { summary, byBrand, byChannel, overspending, underspending } = dataSources.commandCenter;

    context += `## COMMAND CENTER DATA (Google Sheets)\n\n`;
    context += `### Overall KPI Summary:\n`;
    context += `- Total Budget: ${formatNumber(summary.totalBudget)}\n`;
    context += `- Total Spend: ${formatNumber(summary.totalSpent)}\n`;
    context += `- Sisa Budget: ${formatNumber(summary.totalRemaining)}\n`;
    context += `- Total Impressions: ${summary.totalImpressions.toLocaleString('id-ID')}\n`;
    context += `- Avg Pacing: ${summary.avgPacing}%\n`;
    context += `- Actual CPM: Rp ${summary.actualCPM?.toFixed(0) || 0}\n`;
    context += `- Brands: ${summary.brandCount}, Products: ${summary.productCount}\n\n`;

    if (byBrand && byBrand.length > 0) {
      context += `### By Brand (sorted by spend):\n`;
      context += `| Brand | Budget | Spend | Pacing | CPM |\n`;
      context += `|-------|--------|-------|--------|-----|\n`;
      byBrand.slice(0, 15).forEach((b) => {
        context += `| ${b.brand} | ${formatNumber(b.budget)} | ${formatNumber(b.spent)} | ${b.pacing}% | Rp ${b.cpm || 0} |\n`;
      });
      context += `\n`;
    }

    if (byChannel && byChannel.length > 0) {
      context += `### By Channel:\n`;
      context += `| Channel | Budget | Spend | Pacing | CPM |\n`;
      context += `|---------|--------|-------|--------|-----|\n`;
      byChannel.forEach((c) => {
        context += `| ${c.channel} | ${formatNumber(c.budget)} | ${formatNumber(c.spent)} | ${c.pacing}% | Rp ${c.cpm || 0} |\n`;
      });
      context += `\n`;
    }

    if (overspending.length > 0) {
      context += `### ⚠️ Overspending Items (>100% pacing):\n`;
      overspending.slice(0, 10).forEach((r) => {
        context += `- ${r.brand} / ${r.product}: ${formatNumber(r.spent)} spend, ${r.pacing?.toFixed(0)}% pacing\n`;
      });
      context += `\n`;
    }

    if (underspending.length > 0) {
      context += `### ⚠️ Underspending Items (<70% pacing):\n`;
      underspending.slice(0, 10).forEach((r) => {
        context += `- ${r.brand} / ${r.product}: ${formatNumber(r.spent)} spend, ${r.pacing?.toFixed(0)}% pacing\n`;
      });
      context += `\n`;
    }
  }

  if (dataSources.kol && dataSources.kol.length > 0) {
    context += `## KOL MASTER SHEET DATA\n`;
    context += `Top KOL by achievement (first 20 rows):\n`;
    context += `| Brand | Platform | Username | Ratecard | Views | Engagement | Achievement |\n`;
    context += `|-------|----------|----------|----------|-------|-----------|------------|\n`;
    dataSources.kol
      .filter((k) => k.achievement != null)
      .sort((a, b) => (b.achievement || 0) - (a.achievement || 0))
      .slice(0, 20)
      .forEach((k) => {
        context += `| ${k.brand} | ${k.platform} | ${k.username} | ${formatNumber(k.ratecard)} | ${(k.view || 0).toLocaleString()} | ${(k.engagement || 0).toLocaleString()} | ${k.achievement}% |\n`;
      });
    context += `\n`;
  }

  if (dataSources.bigQueryMeta) {
    const { topCampaigns, metaOverview } = dataSources.bigQueryMeta;
    if (topCampaigns && topCampaigns.length > 0) {
      context += `## META ADS (BigQuery) - Top Campaigns\n`;
      context += `| Campaign | Account | Spend | Impressions | CPM | Purchases |\n`;
      context += `|----------|---------|-------|-------------|-----|-----------|\n`;
      topCampaigns.slice(0, 15).forEach((c) => {
        context += `| ${c.CAMPAIGN_NAME || c.campaign_name} | ${c.ACCOUNT_NAME || c.account_name} | ${formatNumber(c.spend)} | ${(c.impressions || 0).toLocaleString()} | Rp ${(c.cpm || 0).toFixed(0)} | ${c.purchases || 0} |\n`;
      });
      context += `\n`;
    }
    if (metaOverview && metaOverview.length > 0) {
      context += `## META ADS - Overview by Account\n`;
      context += `| Account | Spend | Impressions | CPM |\n`;
      context += `|---------|-------|-------------|-----|\n`;
      metaOverview.slice(0, 10).forEach((a) => {
        context += `| ${a.ACCOUNT_NAME || a.account_name} | ${formatNumber(a.spend)} | ${(a.impressions || 0).toLocaleString()} | Rp ${(a.cpm || 0).toFixed(0)} |\n`;
      });
      context += `\n`;
    }
  }

  if (dataSources.bigQueryTikTok) {
    const { campaigns } = dataSources.bigQueryTikTok;
    if (campaigns && campaigns.length > 0) {
      context += `## TIKTOK ADS (BigQuery) - Top Campaigns\n`;
      context += `| Campaign | Spend | Impressions | Video Views | Conversions |\n`;
      context += `|----------|-------|-------------|-------------|-------------|\n`;
      campaigns.slice(0, 15).forEach((c) => {
        context += `| ${c.CAMPAIGN_NAME || c.campaign_name} | ${formatNumber(c.spend)} | ${(c.impressions || 0).toLocaleString()} | ${(c.VIDEO_VIEW_2_SECONDS || c.video_2s || 0).toLocaleString()} | ${c.conversions || 0} |\n`;
      });
      context += `\n`;
    }
  }

  return context;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

// Strict output schema the AI must follow
const OUTPUT_SCHEMA = `
RESPON KAMU HARUS DALAM FORMAT JSON. TIDAK BOLEH ADA TEXT DI LUAR BLOCK JSON.

Format JSON yang WAJIB kamu ikuti:
{
  "summary": "Paragraf pembuka 1-2 kalimat dalam Bahasa Indonesia, seperti ngobrol sama kolega. Singkat dan to the point.",
  "keyInsights": [
    "Insight 1 dengan angka konkret dari data",
    "Insight 2 dengan angka konkret dari data",
    "Insight 3 (opsional)"
  ],
  "table": {
    "title": "Judul tabel deskriptif",
    "columns": ["Kolom 1", "Kolom 2", "Kolom 3"],
    "rows": [
      ["Nilai 1", "Nilai 2", "Nilai 3"]
    ],
    "note": "Catatan di bawah tabel (null kalau tidak ada)"
  },
  "chartType": "bar" | "line" | null,
  "chartLabel": "Label chart (null kalau tidak perlu)",
  "status": "ok" | "no_data" | "partial"
}

ATURAN KRUSIAL:
1. WAJIB return JSON valid dalam code block \`\`\`json ... \`\`\`
2. summary: max 2 kalimat, langsung to the point
3. keyInsights: WAJIB dengan angka. Contoh: "Total spend Rp 2.3M dari 15 brand, rata-rata pacing 78%"
4. table: selalu included, rows boleh kosong [] kalau tidak ada data numeric
5. chartType: "bar" untuk compare antar item, "line" untuk trend over time, null kalau tidak perlu
6. numbers di table.rows gunakan format string: "Rp 2.3M", "78%", "1.2M"
7. Hanya gunakan data yang diberikan
8. Kalau data insufficient: status: "no_data", table.rows: []

DATA YANG TERSEDIA:\n{DATA_CONTEX}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!ADA_CODE_API_KEY) {
    return res.status(500).json({ text: '❌ Server configuration error: ADA_CODE_API_KEY is not set.', status: 'error' });
  }

  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'message is required' });
    }

    const intents = detectIntent(message);
    const dateParams = parseDateRange(message);

    // Fetch all relevant data
    let dataSources = {};
    let fetchErrors = {};
    try {
      const ccData = await fetchCommandCenter();
      dataSources = await fetchAllRelevantData(intents, ccData, dateParams);
    } catch (dataErr) {
      console.error('Data fetch error:', dataErr);
      fetchErrors.main = dataErr.message;
    }

    // Fast-fail: if intent needs data we know we have nothing for, return early
    const hasBigQueryData = dataSources.bigQueryMeta || dataSources.bigQueryTikTok;
    const hasKOLData = dataSources.kol && dataSources.kol.length > 0;
    const hasCCData = !!dataSources.commandCenter;

    const contextData = buildContextPrompt(message, dataSources);
    const systemPromptWithSchema = OUTPUT_SCHEMA.replace('{DATA_CONTEX}', contextData || 'Tidak ada data yang tersedia.');

    // If context is empty and intent is specific (not general), tell AI what's available
    const availableSourcesNote = `\n\nDATE RANGE USED FOR BIGQUERY DATA: ${dateParams.start} to ${dateParams.end}

AVAILABLE DATA SOURCES (real-time status):
- Command Center (Google Sheets): ${hasCCData ? '✅ HAS DATA' : '❌ UNAVAILABLE'}
- KOL Master Sheet (Google Sheets API): ${hasKOLData ? '✅ HAS DATA' : '❌ UNAVAILABLE'}
- BigQuery Meta Ads: ${dataSources.bigQueryMeta ? '✅ HAS DATA' : '❌ UNAVAILABLE'}
- BigQuery TikTok Ads: ${dataSources.bigQueryTikTok ? '✅ HAS DATA' : '❌ UNAVAILABLE'}

IMPORTANT: If a data source shows ❌ UNAVAILABLE, say EXPLICITLY: "Data [nama source] tidak tersedia saat ini." Do NOT say "I don't have access to [database]" — say "Data tersebut tidak tersedia."`;

    const finalSystemPrompt = systemPromptWithSchema.replace('{DATA_CONTEX}',
      (contextData || 'Tidak ada data yang tersedia.') + availableSourcesNote
    );

    const recentHistory = history.slice(-8);
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      ...recentHistory.map((h) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.text,
      })),
      { role: 'user', content: message },
    ];

    const sourcesUsed = [];
    if (dataSources.commandCenter) sourcesUsed.push('Command Center');
    if (dataSources.kol?.length) sourcesUsed.push('KOL Master Sheet');
    if (dataSources.bigQueryMeta) sourcesUsed.push('BigQuery Meta Ads');
    if (dataSources.bigQueryTikTok) sourcesUsed.push('BigQuery TikTok Ads');

    const rawAnswer = await callAdaCode(messages);

    // Parse JSON from code block
    let parsed = null;
    const jsonMatch = rawAnswer.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr, 'Raw:', jsonMatch[1]);
      }
    }

    if (!parsed) {
      return res.status(200).json({
        text: rawAnswer,
        summary: null,
        keyInsights: [],
        sources: sourcesUsed,
        data: null,
        table: null,
        chartType: null,
        chartLabel: null,
        tableTitle: null,
        tableNote: null,
        tableColumns: [],
        status: 'parse_error',
      });
    }

    const normalized = {
      text: parsed.summary || '',
      summary: parsed.summary || null,
      keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
      sources: sourcesUsed,
      data: parsed.table && Array.isArray(parsed.table.rows) && parsed.table.rows.length > 0
        ? buildTableData(parsed.table)
        : null,
      tableTitle: parsed.table?.title || null,
      tableNote: parsed.table?.note || null,
      tableColumns: parsed.table?.columns || [],
      chartType: ['bar', 'line'].includes(parsed.chartType) ? parsed.chartType : null,
      chartLabel: parsed.chartLabel || null,
      status: parsed.status || 'ok',
    };

    return res.status(200).json(normalized);
  } catch (error) {
    console.error('ai-chat error:', error);
    return res.status(500).json({
      text: `❌ Error: ${error.message}. Silakan coba lagi.`,
      summary: null,
      keyInsights: [],
      sources: [],
      data: null,
      table: null,
      chartType: null,
      chartLabel: null,
      tableTitle: null,
      tableNote: null,
      tableColumns: [],
      status: 'error',
    });
  }
}

function buildTableData(table) {
  if (!table.columns || !table.rows) return null;
  return table.rows.map((row) => {
    const obj = {};
    table.columns.forEach((col, i) => {
      obj[col] = row[i] ?? null;
    });
    return obj;
  });
}
