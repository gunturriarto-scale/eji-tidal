import { BigQuery } from '@google-cloud/bigquery';

function formatPrivateKey(key) {
  if (!key) return '';
  // Normalize: handle both actual newlines and escaped \n strings
  let k = key
    .replace(/\\n/g, '\n')   // escaped \n → actual newline
    .replace(/\\\\n/g, '\n') // double-escaped \\n → actual newline
    .replace(/\r\n/g, '\n')  // CRLF → LF
    .replace(/\r/g, '\n');   // leftover CR → LF

  // Remove surrounding quotes if present
  k = k.replace(/^["']|["']$/g, '');

  // If still no newlines inside the key body, it's likely a single-line base64
  // Re-wrap to proper PEM format
  const prefix = '-----BEGIN PRIVATE KEY-----';
  const suffix = '-----END PRIVATE KEY-----';

  if (k.includes(prefix) && k.includes(suffix)) {
    // Already has PEM markers — just normalize the line breaks
    const start = k.indexOf(prefix);
    const end = k.lastIndexOf(suffix);
    const body = k.substring(start + prefix.length, end).trim().replace(/\s+/g, '');
    return `${prefix}\n${body.match(/.{1,64}/g).join('\n')}\n${suffix}`;
  }

  return k;
}

function getBigQueryClient() {
  return new BigQuery({
    projectId: process.env.BQ_PROJECT_ID,
    credentials: {
      client_email: process.env.BQ_CLIENT_EMAIL,
      private_key: formatPrivateKey(process.env.BQ_PRIVATE_KEY),
    },
  });
}

const QUERIES = {
  // ─── BRAND / ACCOUNT LEVEL ───────────────────────────────────────────────
  brandOverview: ({ start, end }) => `
    SELECT ACCOUNT_NAME,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks,
      ROUND(SUM(OFFSITE_CONVERSION_VALUE_FB_PIXEL_PURCHASE)) as purchase_value
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1
    ORDER BY spend DESC`,

  brandTrend: ({ start, end }) => `
    SELECT DATE,
      ACCOUNT_NAME,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(REACH) as reach
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1, 2
    ORDER BY DATE`,

  // ─── CAMPAIGN LEVEL ──────────────────────────────────────────────────────
  campaigns: ({ start, end }) => `
    SELECT ACCOUNT_NAME, CAMPAIGN_NAME, CAMPAIGN_OBJECTIVE,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1, 2, 3
    ORDER BY spend DESC
    LIMIT 100`,

  topCampaigns: ({ start, end, account }) => `
    SELECT ACCOUNT_NAME, CAMPAIGN_NAME, CAMPAIGN_OBJECTIVE, CAMPAIGN_STATUS,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks,
      ROUND(SUM(OFFSITE_CONVERSION_VALUE_FB_PIXEL_PURCHASE)) as purchase_value,
      ROUND(SUM(OFFSITE_CONVERSIONS_FB_PIXEL_PURCHASE)) as purchases
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2, 3, 4
    ORDER BY spend DESC
    LIMIT 50`,

  // ─── DEMOGRAPHICS ───────────────────────────────────────────────────────
  ageGender: ({ start, end, account }) => `
    SELECT AGE, GENDER,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach
    FROM \`bigdata.FBADS_AGE_GENDER\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ─── GEO ─────────────────────────────────────────────────────────────────
  geo: ({ start, end, account }) => `
    SELECT REGION, COUNTRY_NAME,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks
    FROM \`bigdata.FBADS_GEO\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC
    LIMIT 20`,

  // ─── VIDEO ────────────────────────────────────────────────────────────────
  videoFunnel: ({ start, end, account }) => `
    SELECT AD_NAME, ACCOUNT_NAME,
      SUM(ACTION_VIDEO_VIEW) as video_views,
      SUM(VIDEO_P_25_WATCHED_ACTIONS) as p25,
      SUM(VIDEO_P_50_WATCHED_ACTIONS) as p50,
      SUM(VIDEO_P_75_WATCHED_ACTIONS) as p75,
      SUM(VIDEO_P_100_WATCHED_ACTIONS) as p100,
      SUM(VIDEO_THRUPLAY_WATCHED_ACTIONS) as thruplay,
      ROUND(AVG(VIDEO_AVERAGE_WATCH_TIME), 1) as avg_watch_sec
    FROM \`bigdata.FBADS_VIDEO\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY video_views DESC
    LIMIT 20`,

  // ─── PLATFORM ─────────────────────────────────────────────────────────────
  platform: ({ start, end, account }) => `
    SELECT PUBLISHER_PLATFORM,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY spend DESC`,

  platformTrend: ({ start, end }) => `
    SELECT DATE, PUBLISHER_PLATFORM,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1, 2
    ORDER BY 1`,

  // ─── CONVERSION ───────────────────────────────────────────────────────────
  conversions: ({ start, end, account }) => `
    SELECT ACTION_TYPE,
      SUM(ACTIONS) as total_actions,
      ROUND(SUM(ACTION_VALUE)) as total_value
    FROM \`bigdata.FBADS_CONVERSION\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND ACTION_TYPE IN (
      'post_engagement','link_click',
      'offsite_conversion.fb_pixel_add_to_cart',
      'offsite_conversion.fb_pixel_purchase'
    )
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY total_actions DESC`,

  // ─── PLACEMENT ────────────────────────────────────────────────────────────
  placement: ({ start, end, account }) => `
    SELECT PLATFORM_POSITION, PUBLISHER_PLATFORM,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(OFFSITE_CONVERSIONS_FB_PIXEL_PURCHASE) as purchases,
      ROUND(SUM(OFFSITE_CONVERSION_VALUE_FB_PIXEL_PURCHASE)) as purchase_value
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND PLATFORM_POSITION != ''
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY purchase_value DESC, spend DESC`,

  // ─── PACING ───────────────────────────────────────���───────────────────────
  pacing: ({ start, end }) => `
    SELECT CAMPAIGN_NAME, ACCOUNT_NAME, CAMPAIGN_STATUS,
      CAMPAIGN_DAILY_BUDGET, CAMPAIGN_BUDGET_REMAINING,
      ROUND(SUM(COST)) as total_spend
    FROM \`bigdata.FBADS_CAMPAIGN\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND CAMPAIGN_DAILY_BUDGET > 0
    GROUP BY 1,2,3,4,5
    ORDER BY total_spend DESC
    LIMIT 15`,

  // ─── AD LEVEL ─────────────────────────────────────────────────────────────
  adsOverview: ({ start, end, account }) => `
    SELECT AD_NAME, AD_STATUS, ACCOUNT_NAME, CAMPAIGN_NAME,
      MAX(CREATIVE_THUMBNAIL_URL) as thumbnail_url,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks,
      ROUND(SUM(OFFSITE_CONVERSION_VALUE_FB_PIXEL_PURCHASE)) as purchase_value,
      ROUND(SUM(OFFSITE_CONVERSIONS_FB_PIXEL_PURCHASE)) as purchases
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1,2,3,4
    ORDER BY spend DESC
    LIMIT 50`,

  // ─── CTA PERFORMANCE ──────────────────────────────────────────────────────
  ctaPerformance: ({ start, end, account }) => `
    SELECT
      CREATIVE_CALL_TO_ACTION_TYPE as cta,
      CREATIVE_OBJECT_TYPE as format,
      COUNT(DISTINCT AD_ID) as ad_count,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(OFFSITE_CONVERSIONS_FB_PIXEL_PURCHASE) as purchases,
      ROUND(SUM(OFFSITE_CONVERSION_VALUE_FB_PIXEL_PURCHASE)) as purchase_value
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND CREATIVE_CALL_TO_ACTION_TYPE != ''
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ─── BRAND PLATFORM SPLIT ─────────────────────────────────────────────────
  brandPlatform: ({ start, end }) => `
    SELECT ACCOUNT_NAME, PUBLISHER_PLATFORM,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions
    FROM \`bigdata.FBADS_AD\`
    WHERE PUBLISHER_PLATFORM IN ('instagram','facebook','audience_network','threads')
    AND DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ─── KPI SUMMARY ──────────────────────────────────────────────────────────
  kpiSummary: ({ start, end, account }) => `
    SELECT
      ROUND(SUM(COST)) as total_spend,
      SUM(IMPRESSIONS) as total_impressions,
      SUM(CLICKS) as total_clicks,
      SUM(REACH) as total_reach,
      SUM(OFFSITE_CONVERSIONS_FB_PIXEL_PURCHASE) as total_purchases,
      ROUND(SUM(OFFSITE_CONVERSION_VALUE_FB_PIXEL_PURCHASE)) as total_purchase_value
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}`,

// ─── VIDEO KPI SUMMARY ───────────────────────────────────────────────────────
  videoKPISummary: ({ start, end, account }) => `
    SELECT
      SUM(ACTION_VIDEO_VIEW) as total_video_views,
      SUM(VIDEO_THRUPLAY_WATCHED_ACTIONS) as total_thruplay
    FROM \`bigdata.FBADS_VIDEO\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}`,

};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { type, start = '2026-01-01', end = '2099-12-31', account } = req.query;

  if (!type || !QUERIES[type]) {
    return res.status(400).json({ error: `Unknown query type: ${type}. Valid: ${Object.keys(QUERIES).join(', ')}` });
  }

  try {
    const bq = getBigQueryClient();
    const query = QUERIES[type]({ start, end, account });
    const [rows] = await bq.query({ query });
    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error('BigQuery error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
