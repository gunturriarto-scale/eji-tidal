import { BigQuery } from '@google-cloud/bigquery';

function formatPrivateKey(key) {
  if (!key) return '';
  let k = key.replace(/\\n/g, '\n').replace(/"/g, '');
  if (k.indexOf('\n') === -1) {
    const prefix = '-----BEGIN PRIVATE KEY-----';
    const suffix = '-----END PRIVATE KEY-----';
    if (k.startsWith(prefix) && k.endsWith(suffix)) {
      const body = k.substring(prefix.length, k.length - suffix.length).replace(/\s+/g, '');
      return `${prefix}\n${body.match(/.{1,64}/g).join('\n')}\n${suffix}`;
    }
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
  brandOverview: ({ start, end }) => `
    SELECT ACCOUNT_NAME,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1
    ORDER BY spend DESC`,

  brandPlatform: ({ start, end }) => `
    SELECT ACCOUNT_NAME, PUBLISHER_PLATFORM,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions
    FROM \`bigdata.FBADS_AD\`
    WHERE PUBLISHER_PLATFORM IN ('instagram','facebook','audience_network','threads')
    AND DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1, 2
    ORDER BY spend DESC`,

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

  ageGender: ({ start, end, account }) => `
    SELECT AGE, GENDER,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach
    FROM \`bigdata.FBADS_AGE_GENDER\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  platform: ({ start, end, account }) => `
    SELECT PUBLISHER_PLATFORM,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY spend DESC`,

  geo: ({ start, end, account }) => `
    SELECT REGION, COUNTRY_NAME,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach
    FROM \`bigdata.FBADS_GEO\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC
    LIMIT 15`,

  videoFunnel: ({ start, end, account }) => `
    SELECT AD_NAME, ACCOUNT_NAME,
      SUM(ACTION_VIDEO_VIEW) as video_views,
      SUM(VIDEO_P_25_WATCHED_ACTIONS) as p25,
      SUM(VIDEO_P_50_WATCHED_ACTIONS) as p50,
      SUM(VIDEO_P_75_WATCHED_ACTIONS) as p75,
      SUM(VIDEO_P_100_WATCHED_ACTIONS) as p100,
      SUM(VIDEO_THRUPLAY_WATCHED_ACTIONS) as thruplay
    FROM \`bigdata.FBADS_VIDEO\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY video_views DESC
    LIMIT 10`,

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
    ${account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY total_actions DESC`,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { type, start = '2026-01-01', end = '2099-12-31', account = 'all' } = req.query;

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
