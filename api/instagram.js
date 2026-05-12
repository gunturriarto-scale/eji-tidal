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

// ─── Filter builder helpers ──────────────────────────────────────────────────

// Build WHERE clause fragments from filter params
// Supports: start, end (date range on DATE col), accountId, mediaType
function buildMediaFilters({ start, end, accountId, mediaType }) {
  const clauses = [];
  if (start) clauses.push(`DATE >= '${start}'`);
  if (end)   clauses.push(`DATE <= '${end}'`);
  if (accountId && accountId !== 'all') clauses.push(`ACCOUNT_ID = '${accountId}'`);
  if (mediaType === 'FEED') clauses.push(`MEDIA_PRODUCT_TYPE = 'FEED'`);
  if (mediaType === 'REELS') clauses.push(`MEDIA_PRODUCT_TYPE = 'REELS'`);
  if (mediaType === 'STORY') clauses.push(`MEDIA_PRODUCT_TYPE = 'STORY'`);
  return clauses;
}

function where(clauses) {
  return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

// ─── QUERY DEFINITIONS ──────────────────────────────────────────────────────

const QUERIES = {

  // KPI overview — filtered by date range + account
  // Returns followers (static, not date-bound), and date-filtered media metrics
  kpiOverview: ({ start, end, accountId }) => {
    const mediaClauses = buildMediaFilters({ start, end, accountId });
    const mediaWhere = where(mediaClauses);
    // Separate WHERE for engagement — always requires MEDIA_REACH > 0
    const engWhere = where([...mediaClauses, 'MEDIA_REACH > 0']);
    const accountWhere = (accountId && accountId !== 'all')
      ? `WHERE ACCOUNT_ID = '${accountId}'`
      : '';

    return `
      SELECT
        (SELECT SUM(FOLLOWERS_COUNT) FROM \`bigdata.INSTAGRAM_ACCOUNT_LIFETIME\` ${accountWhere}) as total_followers,
        (SELECT SUM(REACH) FROM \`bigdata.INSTAGRAM_ACCOUNT\` ${accountWhere}) as total_reach,
        (SELECT COUNT(*) FROM \`bigdata.INSTAGRAM_MEDIA\` ${mediaWhere}) as total_posts,
        ROUND(
          (SELECT SUM(MEDIA_LIKE_COUNT + COALESCE(MEDIA_COMMENTS_COUNT,0)) FROM \`bigdata.INSTAGRAM_MEDIA\` ${engWhere})
          /
          NULLIF((SELECT SUM(MEDIA_REACH) FROM \`bigdata.INSTAGRAM_MEDIA\` ${mediaWhere}), 0)
          * 100, 2
        ) as avg_engagement_rate
    `;
  },

  // All account summaries — static (followers don't change with date)
  accounts: ({ accountId }) => {
    const accountWhere = (accountId && accountId !== 'all')
      ? `WHERE a.ACCOUNT_ID = '${accountId}'`
      : '';
    return `
      SELECT
        a.ACCOUNT_ID, a.ACCOUNT_NAME, a.USERNAME, a.BIOGRAPHY, a.IG_ID, a.REACH, a.DATE,
        l.FOLLOWERS_COUNT, l.FOLLOWS_COUNT
      FROM \`bigdata.INSTAGRAM_ACCOUNT\` a
      JOIN \`bigdata.INSTAGRAM_ACCOUNT_LIFETIME\` l USING (ACCOUNT_ID, IG_ID, ACCOUNT_NAME, USERNAME)
      ${accountWhere}
      ORDER BY l.FOLLOWERS_COUNT DESC
    `;
  },

  // Age × Gender breakdown — filterable by account
  ageGender: ({ accountId }) => {
    const clauses = (accountId && accountId !== 'all')
      ? [`ACCOUNT_ID = '${accountId}'`]
      : [];
    return `
      SELECT ACCOUNT_ID, ACCOUNT_NAME, AGE, GENDER, FOLLOWERS_COUNT
      FROM \`bigdata.INSTAGRAM_AGE_GENDER\`
      ${where(clauses)}
      ORDER BY ACCOUNT_NAME, AGE, GENDER
    `;
  },

  // City breakdown — filterable by account
  geo: ({ accountId }) => {
    const clauses = (accountId && accountId !== 'all')
      ? [`ACCOUNT_ID = '${accountId}'`]
      : [];
    return `
      SELECT ACCOUNT_ID, ACCOUNT_NAME, CITY, FOLLOWERS_COUNT
      FROM \`bigdata.INSTAGRAM_CITY\`
      ${where(clauses)}
      ORDER BY ACCOUNT_NAME, FOLLOWERS_COUNT DESC
    `;
  },

  // All media (feed + reels + story) — fully filterable
  mediaAll: ({ start, end, accountId }) => {
    const clauses = buildMediaFilters({ start, end, accountId });
    return `
      SELECT
        ACCOUNT_ID, ACCOUNT_NAME, USERNAME, MEDIA_ID, MEDIA_TYPE, MEDIA_PRODUCT_TYPE,
        MEDIA_CAPTION, MEDIA_SHORTCODE, MEDIA_PERMALINK, TIMESTAMP, DATE,
        MEDIA_LIKE_COUNT, MEDIA_COMMENTS_COUNT, MEDIA_SHARES, MEDIA_SAVED,
        MEDIA_VIEWS, MEDIA_REACH, INTERACTIONS,
        MEDIA_STORY_VIEWS, MEDIA_STORY_REACH, MEDIA_STORY_EXITS,
        MEDIA_STORY_TAPS_BACK, MEDIA_STORY_TAPS_FORWARD, MEDIA_STORY_REPLIES
      FROM \`bigdata.INSTAGRAM_MEDIA\`
      ${where(clauses)}
      ORDER BY TIMESTAMP DESC
    `;
  },

  // Story analytics only — fully filterable
  mediaStories: ({ start, end, accountId }) => {
    const clauses = buildMediaFilters({ start, end, accountId });
    return `
      SELECT
        ACCOUNT_ID, ACCOUNT_NAME, USERNAME, MEDIA_ID,
        MEDIA_SHORTCODE, MEDIA_PERMALINK, TIMESTAMP, DATE,
        MEDIA_STORY_VIEWS, MEDIA_STORY_REACH, MEDIA_STORY_EXITS,
        MEDIA_STORY_TAPS_BACK, MEDIA_STORY_TAPS_FORWARD, MEDIA_STORY_REPLIES
      FROM \`bigdata.INSTAGRAM_MEDIA\`
      ${where(clauses)}
      ORDER BY MEDIA_STORY_VIEWS DESC
    `;
  },

  // Top posts by engagement score — filtered by date + account
  topPerformers: ({ start, end, accountId }) => {
    const clauses = buildMediaFilters({ start, end, accountId });
    clauses.push(`MEDIA_PRODUCT_TYPE != 'STORY'`, `MEDIA_REACH > 0`);
    return `
      SELECT
        ACCOUNT_ID, ACCOUNT_NAME, MEDIA_TYPE, MEDIA_PRODUCT_TYPE,
        MEDIA_CAPTION, MEDIA_SHORTCODE, MEDIA_PERMALINK, TIMESTAMP, DATE,
        MEDIA_LIKE_COUNT, MEDIA_COMMENTS_COUNT, MEDIA_SHARES, MEDIA_SAVED,
        MEDIA_VIEWS, MEDIA_REACH,
        ROUND(
          (MEDIA_LIKE_COUNT + COALESCE(MEDIA_COMMENTS_COUNT,0)
           + COALESCE(MEDIA_SHARES,0) + COALESCE(MEDIA_SAVED,0))
          / NULLIF(MEDIA_REACH,0) * 100, 2
        ) as engagement_rate
      FROM \`bigdata.INSTAGRAM_MEDIA\`
      ${where(clauses)}
      ORDER BY (
        (MEDIA_LIKE_COUNT + COALESCE(MEDIA_COMMENTS_COUNT,0)
         + COALESCE(MEDIA_SHARES,0) + COALESCE(MEDIA_SAVED,0))
      ) DESC
      LIMIT 10
    `;
  },

  // Quick insights — aggregate by account + type, filtered by date + account
  quickInsights: ({ start, end, accountId }) => {
    const clauses = buildMediaFilters({ start, end, accountId });
    return `
      SELECT
        ACCOUNT_NAME, MEDIA_PRODUCT_TYPE,
        COUNT(*) as post_count,
        SUM(MEDIA_LIKE_COUNT) as total_likes,
        SUM(MEDIA_COMMENTS_COUNT) as total_comments,
        SUM(MEDIA_REACH) as total_reach,
        SUM(MEDIA_VIEWS) as total_views,
        SUM(MEDIA_SAVED) as total_saved,
        ROUND(
          AVG((MEDIA_LIKE_COUNT + COALESCE(MEDIA_COMMENTS_COUNT,0))
              / NULLIF(MEDIA_REACH,0) * 100), 2
        ) as avg_er
      FROM \`bigdata.INSTAGRAM_MEDIA\`
      ${where(clauses)}
      GROUP BY ACCOUNT_NAME, MEDIA_PRODUCT_TYPE
      ORDER BY ACCOUNT_NAME, post_count DESC
    `;
  },
};

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  try {
    const { type = 'kpiOverview', start, end, accountId } = req.query;

    if (!QUERIES[type]) {
      return res.status(400).json({
        error: `Unknown query type: ${type}. Available: ${Object.keys(QUERIES).join(', ')}`
      });
    }

    const bq = getBigQueryClient();
    const query = QUERIES[type]({ start, end, accountId });
    const [rows] = await bq.query({ query });

    return res.status(200).json({ data: rows, meta: { start, end, accountId } });
  } catch (err) {
    console.error('[instagram API]', err);
    return res.status(500).json({ error: err.message });
  }
}
