import { BigQuery } from '@google-cloud/bigquery';

function formatPrivateKey(key) {
  if (!key) return '';
  let k = key
    .replace(/\\n/g, '\n')
    .replace(/\\\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  k = k.replace(/^["']|["']$/g, '');
  const prefix = '-----BEGIN PRIVATE KEY-----';
  const suffix = '-----END PRIVATE KEY-----';
  if (k.includes(prefix) && k.includes(suffix)) {
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

function buildFilters({ start, end, account, channel }) {
  const clauses = [];
  if (start)   clauses.push(`DATE >= '${start}'`);
  if (end)     clauses.push(`DATE <= '${end}'`);
  if (account && account !== 'all') clauses.push(`ACCOUNT_NAME = '${account}'`);
  if (channel && channel !== 'all') clauses.push(`ADVERTISING_CHANNEL_TYPE = '${channel}'`);
  return clauses;
}

function buildSimpleFilters({ start, end, account }) {
  const clauses = [];
  if (start)   clauses.push(`DATE >= '${start}'`);
  if (end)     clauses.push(`DATE <= '${end}'`);
  if (account && account !== 'all') clauses.push(`ACCOUNT_NAME = '${account}'`);
  return clauses;
}

function where(clauses) {
  return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

const QUERIES = {

  // Discover actual column names — use this for debugging schema mismatches
  schema: () => `
    SELECT table_name, column_name, data_type
    FROM \`bigdata.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name IN ('GOOGLEADS_CAMPAIGN', 'GOOGLEADS_AD', 'GOOGLEADS_CONVERSION', 'GOOGLEADS_SHOPPING', 'GOOGLEADS_PLACEMENT')
    ORDER BY table_name, ordinal_position
  `,

  kpiOverview: ({ start, end, account, channel }) => {
    const clauses = buildFilters({ start, end, account, channel });
    const w = where(clauses);
    return `
      SELECT
        ROUND(SUM(COST))                                                              AS total_cost,
        SUM(CLICKS)                                                                   AS total_clicks,
        SUM(IMPRESSIONS)                                                              AS total_impressions,
        ROUND(SUM(CONVERSIONS), 1)                                                    AS total_conversions,
        ROUND(SUM(CONVERSION_VALUE))                                                  AS total_conv_value,
        ROUND(SAFE_DIVIDE(SUM(CLICKS), SUM(IMPRESSIONS)) * 100, 2)                   AS ctr,
        ROUND(SAFE_DIVIDE(SUM(COST), SUM(CLICKS)))                                    AS cpc,
        ROUND(SAFE_DIVIDE(SUM(COST) * 1000, SUM(IMPRESSIONS)))                        AS cpm,
        ROUND(SAFE_DIVIDE(SUM(CONVERSION_VALUE), SUM(COST)), 2)                       AS roas,
        ROUND(SAFE_DIVIDE(SUM(CONVERSIONS), SUM(CLICKS)) * 100, 2)                   AS conv_rate,
        SUM(VIDEO_VIEWS)                                                              AS total_video_views
      FROM \`bigdata.GOOGLEADS_CAMPAIGN\`
      ${w}
    `;
  },

  dailyTrend: ({ start, end, account, channel }) => {
    const clauses = buildFilters({ start, end, account, channel });
    return `
      SELECT
        DATE,
        ROUND(SUM(COST))                                          AS cost,
        SUM(CLICKS)                                               AS clicks,
        SUM(IMPRESSIONS)                                          AS impressions,
        ROUND(SUM(CONVERSIONS), 1)                                AS conversions,
        ROUND(SAFE_DIVIDE(SUM(CONVERSION_VALUE), SUM(COST)), 2)   AS roas
      FROM \`bigdata.GOOGLEADS_CAMPAIGN\`
      ${where(clauses)}
      GROUP BY DATE
      ORDER BY DATE ASC
    `;
  },

  channelBreakdown: ({ start, end, account }) => {
    const clauses = buildSimpleFilters({ start, end, account });
    return `
      SELECT
        ADVERTISING_CHANNEL_TYPE                                   AS channel_type,
        ROUND(SUM(COST))                                           AS cost,
        SUM(IMPRESSIONS)                                           AS impressions,
        SUM(CLICKS)                                                AS clicks,
        ROUND(SUM(CONVERSIONS), 1)                                 AS conversions,
        ROUND(SAFE_DIVIDE(SUM(CONVERSION_VALUE), SUM(COST)), 2)    AS roas
      FROM \`bigdata.GOOGLEADS_CAMPAIGN\`
      ${where(clauses)}
      GROUP BY ADVERTISING_CHANNEL_TYPE
      ORDER BY cost DESC
    `;
  },

  accounts: () => `
    SELECT DISTINCT ACCOUNT_NAME
    FROM \`bigdata.GOOGLEADS_CAMPAIGN\`
    ORDER BY ACCOUNT_NAME ASC
  `,

  campaigns: ({ start, end, account, channel }) => {
    const clauses = buildFilters({ start, end, account, channel });
    return `
      SELECT
        CAMPAIGN_NAME,
        CAMPAIGN_STATUS                                                      AS STATUS,
        ADVERTISING_CHANNEL_TYPE                                             AS channel_type,
        ACCOUNT_NAME,
        MAX(DAILY_BUDGET)                                                    AS daily_budget,
        SUM(IMPRESSIONS)                                                     AS impressions,
        SUM(CLICKS)                                                          AS clicks,
        ROUND(SAFE_DIVIDE(SUM(CLICKS), SUM(IMPRESSIONS)) * 100, 2)          AS ctr,
        ROUND(SUM(COST))                                                     AS cost,
        ROUND(SAFE_DIVIDE(SUM(COST), SUM(CLICKS)))                          AS cpc,
        ROUND(SAFE_DIVIDE(SUM(COST) * 1000, SUM(IMPRESSIONS)))              AS cpm,
        ROUND(SUM(CONVERSIONS), 1)                                           AS conversions,
        ROUND(SAFE_DIVIDE(SUM(CONVERSIONS), SUM(CLICKS)) * 100, 2)          AS conv_rate,
        ROUND(SAFE_DIVIDE(SUM(CONVERSION_VALUE), SUM(COST)), 2)             AS roas,
        ROUND(AVG(SEARCH_IMPRESSION_SHARE) * 100, 1)                        AS impression_share,
        SUM(VIDEO_VIEWS)                                                     AS video_views
      FROM \`bigdata.GOOGLEADS_CAMPAIGN\`
      ${where(clauses)}
      GROUP BY CAMPAIGN_NAME, CAMPAIGN_STATUS, ADVERTISING_CHANNEL_TYPE, ACCOUNT_NAME
      ORDER BY cost DESC
    `;
  },

  ads: ({ start, end, account }) => {
    const clauses = buildSimpleFilters({ start, end, account });
    return `
      SELECT
        CAMPAIGN_NAME,
        AD_GROUP_NAME,
        AD_TYPE,
        AD_STATUS                                                             AS STATUS,
        DEVICE,
        NETWORK,
        ACCOUNT_NAME,
        SUM(IMPRESSIONS)                                                      AS impressions,
        SUM(CLICKS)                                                           AS clicks,
        ROUND(SAFE_DIVIDE(SUM(CLICKS), SUM(IMPRESSIONS)) * 100, 2)           AS ctr,
        ROUND(SUM(COST))                                                      AS cost,
        ROUND(SUM(CONVERSIONS), 1)                                            AS conversions,
        SUM(VIDEO_VIEWS)                                                      AS video_views
      FROM \`bigdata.GOOGLEADS_AD\`
      ${where(clauses)}
      GROUP BY CAMPAIGN_NAME, AD_GROUP_NAME, AD_TYPE, AD_STATUS, DEVICE, NETWORK, ACCOUNT_NAME
      ORDER BY cost DESC
      LIMIT 500
    `;
  },

  deviceBreakdown: ({ start, end, account }) => {
    const clauses = buildSimpleFilters({ start, end, account });
    return `
      SELECT
        DEVICE,
        SUM(CLICKS)                AS clicks,
        SUM(IMPRESSIONS)           AS impressions,
        ROUND(SUM(COST))           AS cost,
        ROUND(SUM(CONVERSIONS), 1) AS conversions
      FROM \`bigdata.GOOGLEADS_AD\`
      ${where(clauses)}
      GROUP BY DEVICE
      ORDER BY clicks DESC
    `;
  },

  shopping: ({ start, end, account }) => {
    const clauses = buildSimpleFilters({ start, end, account });
    return `
      SELECT
        BRAND,
        PRODUCT_TITLE,
        CATEGORY_LEVEL_1,
        CATEGORY_LEVEL_2,
        CATEGORY_LEVEL_3,
        PRODUCT_TYPE_LEVEL_1,
        SUM(CLICKS)                                                     AS clicks,
        SUM(IMPRESSIONS)                                                AS impressions,
        ROUND(SAFE_DIVIDE(SUM(CLICKS), SUM(IMPRESSIONS)) * 100, 2)     AS ctr,
        ROUND(SUM(COST))                                                AS cost,
        ROUND(SAFE_DIVIDE(SUM(COST), SUM(CLICKS)))                     AS cpc
      FROM \`bigdata.GOOGLEADS_SHOPPING\`
      ${where(clauses)}
      GROUP BY BRAND, PRODUCT_TITLE, CATEGORY_LEVEL_1, CATEGORY_LEVEL_2, CATEGORY_LEVEL_3, PRODUCT_TYPE_LEVEL_1
      ORDER BY clicks DESC
      LIMIT 500
    `;
  },

  shoppingBrand: ({ start, end, account }) => {
    const clauses = buildSimpleFilters({ start, end, account });
    return `
      SELECT
        BRAND,
        SUM(CLICKS)                                                     AS clicks,
        SUM(IMPRESSIONS)                                                AS impressions,
        ROUND(SAFE_DIVIDE(SUM(CLICKS), SUM(IMPRESSIONS)) * 100, 2)     AS ctr,
        ROUND(SUM(COST))                                                AS cost
      FROM \`bigdata.GOOGLEADS_SHOPPING\`
      ${where(clauses)}
      GROUP BY BRAND
      ORDER BY clicks DESC
    `;
  },

  conversions: ({ start, end, account }) => {
    const clauses = buildSimpleFilters({ start, end, account });
    return `
      SELECT
        CONVERSION_TYPE_NAME,
        DEVICE,
        CAMPAIGN_NAME,
        ROUND(SUM(CONVERSIONS), 1)                                      AS conversions,
        ROUND(SUM(CONVERSION_VALUE))                                    AS conversion_value,
        ROUND(SUM(ESTIMATED_CROSS_DEVICE_CONVERSIONS), 1)               AS est_cross_device,
        ROUND(SUM(VIEW_THROUGH_CONVERSIONS), 1)                         AS view_through
      FROM \`bigdata.GOOGLEADS_CONVERSION\`
      ${where(clauses)}
      GROUP BY CONVERSION_TYPE_NAME, DEVICE, CAMPAIGN_NAME
      ORDER BY conversions DESC
    `;
  },

  placements: ({ start, end, account }) => {
    const clauses = buildSimpleFilters({ start, end, account });
    return `
      SELECT
        PLACEMENT_URL                                                   AS PLACEMENT,
        PLACEMENT_TYPE,
        CAMPAIGN_NAME,
        ACCOUNT_NAME,
        SUM(IMPRESSIONS)                                                AS impressions,
        SUM(CLICKS)                                                     AS clicks,
        ROUND(SAFE_DIVIDE(SUM(CLICKS), SUM(IMPRESSIONS)) * 100, 2)     AS ctr,
        ROUND(SUM(COST))                                                AS cost,
        ROUND(SAFE_DIVIDE(SUM(COST), SUM(CLICKS)))                     AS cpc
      FROM \`bigdata.GOOGLEADS_PLACEMENT\`
      ${where(clauses)}
      GROUP BY PLACEMENT_URL, PLACEMENT_TYPE, CAMPAIGN_NAME, ACCOUNT_NAME
      ORDER BY impressions DESC
    `;
  },
};

export default async function handler(req, res) {
  try {
    const { type = 'kpiOverview', start, end, account, channel } = req.query;

    if (!QUERIES[type]) {
      return res.status(400).json({
        error: `Unknown query type: ${type}. Available: ${Object.keys(QUERIES).join(', ')}`
      });
    }

    const bq = getBigQueryClient();
    const query = QUERIES[type]({ start, end, account, channel });
    const [rows] = await bq.query({ query });

    return res.status(200).json({ data: rows, meta: { type, start, end, account, channel } });
  } catch (err) {
    console.error('[google-ads API]', err);
    return res.status(500).json({ error: err.message });
  }
}
