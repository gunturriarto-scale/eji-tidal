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

function buildProfileFilters({ start, end, username }) {
  const clauses = [];
  if (start) clauses.push(`DATE >= '${start}'`);
  if (end)   clauses.push(`DATE <= '${end}'`);
  if (username && username !== 'all') clauses.push(`USERNAME = '${username}'`);
  return clauses;
}

function buildVideoFilters({ start, end, username }) {
  const clauses = [];
  if (start) clauses.push(`CREATE_DATE >= '${start}'`);
  if (end)   clauses.push(`CREATE_DATE <= '${end}'`);
  if (username && username !== 'all') clauses.push(`USERNAME = '${username}'`);
  return clauses;
}

function buildAudienceFilters({ username }) {
  const clauses = [];
  if (username && username !== 'all') clauses.push(`USERNAME = '${username}'`);
  return clauses;
}

function where(clauses) {
  return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

const QUERIES = {

  kpiOverview: ({ start, end, username }) => {
    const profileClauses = buildProfileFilters({ start, end, username });
    const videoClauses = buildVideoFilters({ start, end, username });
    const profileWhere = where(profileClauses);
    const videoWhere = where(videoClauses);
    // NEW_FOLLOWERS is cumulative since account creation — use MAX-MIN per account for period gain
    // current_followers — SUM of latest snapshot per account
    const audienceWhere = where(buildAudienceFilters({ username }));
    return `
      SELECT
        (SELECT SUM(VIDEO_VIEWS)   FROM \`bigdata.TIKBA_PROFILE\` ${profileWhere}) AS total_video_views,
        (SELECT SUM(LIKES)         FROM \`bigdata.TIKBA_PROFILE\` ${profileWhere}) AS total_likes,
        (SELECT SUM(COMMENTS)      FROM \`bigdata.TIKBA_PROFILE\` ${profileWhere}) AS total_comments,
        (SELECT SUM(SHARES)        FROM \`bigdata.TIKBA_PROFILE\` ${profileWhere}) AS total_shares,
        (SELECT SUM(gained) FROM (
          SELECT MAX(NEW_FOLLOWERS) - MIN(NEW_FOLLOWERS) AS gained
          FROM \`bigdata.TIKBA_PROFILE\` ${profileWhere}
          GROUP BY USERNAME
        )) AS total_new_followers,
        (SELECT SUM(PROFILE_VIEWS) FROM \`bigdata.TIKBA_PROFILE\` ${profileWhere}) AS total_profile_views,
        (SELECT SUM(latest) FROM (
          SELECT MAX(PROFILE_FOLLOWERS_CURRENT_FOLLOWERS) AS latest
          FROM \`bigdata.TIKBA_PROFILE\` ${audienceWhere}
          GROUP BY USERNAME
        )) AS current_followers,
        (SELECT COUNT(*) FROM \`bigdata.TIKBA_VIDEO\` ${videoWhere}) AS total_videos,
        (SELECT ROUND(AVG(VIDEO_COMPLETION_RATE) * 100, 1) FROM \`bigdata.TIKBA_VIDEO\` ${where([...videoClauses, 'VIDEO_COMPLETION_RATE IS NOT NULL'])}) AS avg_completion_rate
    `;
  },

  profileTrend: ({ start, end, username }) => {
    const clauses = buildProfileFilters({ start, end, username });
    return `
      SELECT
        DATE,
        SUM(VIDEO_VIEWS)   AS video_views,
        SUM(LIKES)         AS likes,
        SUM(COMMENTS)      AS comments,
        SUM(SHARES)        AS shares,
        SUM(PROFILE_VIEWS) AS profile_views
      FROM \`bigdata.TIKBA_PROFILE\`
      ${where(clauses)}
      GROUP BY DATE
      ORDER BY DATE ASC
    `;
  },

  accounts: () => `
    SELECT DISTINCT DISPLAY_NAME, USERNAME
    FROM \`bigdata.TIKBA_PROFILE\`
    ORDER BY DISPLAY_NAME ASC
  `,

  videoAll: ({ start, end, username }) => {
    const clauses = buildVideoFilters({ start, end, username });
    return `
      SELECT
        VIDEO_ID, DISPLAY_NAME, USERNAME,
        CAPTION, CREATE_DATE, CREATE_DATETIME,
        VIDEO_VIEWS, LIKES, COMMENTS, SHARES, REACH,
        VIDEO_COMPLETION_RATE,
        TOTAL_TIME_WATCHED_MIN,
        VIDEO_DURATION_MIN,
        THUMBNAIL_URL, SHARE_URL
      FROM \`bigdata.TIKBA_VIDEO\`
      ${where(clauses)}
      ORDER BY CREATE_DATE DESC
    `;
  },

  topVideos: ({ start, end, username }) => {
    const clauses = buildVideoFilters({ start, end, username });
    return `
      SELECT
        VIDEO_ID, DISPLAY_NAME, USERNAME,
        CAPTION, CREATE_DATE,
        VIDEO_VIEWS, LIKES, COMMENTS, SHARES, REACH,
        VIDEO_COMPLETION_RATE,
        TOTAL_TIME_WATCHED_MIN,
        VIDEO_DURATION_MIN,
        THUMBNAIL_URL, SHARE_URL
      FROM \`bigdata.TIKBA_VIDEO\`
      ${where(clauses)}
      ORDER BY VIDEO_VIEWS DESC
      LIMIT 50
    `;
  },

  videoFunnel: ({ start, end, username }) => {
    const clauses = buildVideoFilters({ start, end, username });
    const videoWhere = where([...clauses, 'VIDEO_COMPLETION_RATE IS NOT NULL']);
    return `
      SELECT
        ROUND(AVG(VIDEO_COMPLETION_RATE) * 100, 1)                                                         AS avg_completion_pct,
        COUNTIF(VIDEO_COMPLETION_RATE < 0.05)                                                               AS bucket_0_5,
        COUNTIF(VIDEO_COMPLETION_RATE >= 0.05 AND VIDEO_COMPLETION_RATE < 0.25)                             AS bucket_5_25,
        COUNTIF(VIDEO_COMPLETION_RATE >= 0.25 AND VIDEO_COMPLETION_RATE < 0.50)                             AS bucket_25_50,
        COUNTIF(VIDEO_COMPLETION_RATE >= 0.50)                                                              AS bucket_50_plus,
        COUNT(*)                                                                                             AS total_videos,
        ROUND(AVG(VIDEO_DURATION_MIN), 2)                                                                   AS avg_duration_min,
        ROUND(AVG(SAFE_DIVIDE(TOTAL_TIME_WATCHED_MIN, VIDEO_VIEWS) * 60), 1)                                AS avg_sec_per_view
      FROM \`bigdata.TIKBA_VIDEO\`
      ${videoWhere}
    `;
  },

  country: ({ username }) => {
    const clauses = buildAudienceFilters({ username });
    const usernameFilter = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return `
      WITH latest AS (
        SELECT USERNAME, COUNTRY, DISTRIBUTION, \`DATE\`
        FROM \`bigdata.TIKBA_COUNTRY\`
        ${usernameFilter}
        QUALIFY ROW_NUMBER() OVER (PARTITION BY USERNAME ORDER BY \`DATE\` DESC) = 1
      )
      SELECT
        COUNTRY,
        ROUND(AVG(DISTRIBUTION) * 100, 2) AS distribution_pct
      FROM latest
      GROUP BY COUNTRY
      ORDER BY distribution_pct DESC
    `;
  },

  schema: () => `
    SELECT table_name, column_name, data_type
    FROM \`bigdata.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name IN ('TIKBA_COUNTRY', 'TIKBA_GENDER', 'TIKBA_PROFILE', 'TIKBA_VIDEO')
    ORDER BY table_name, ordinal_position
  `,

  gender: ({ username }) => {
    const clauses = buildAudienceFilters({ username });
    const usernameFilter = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return `
      WITH latest AS (
        SELECT USERNAME, GENDER, DISTRIBUTION, \`DATE\`
        FROM \`bigdata.TIKBA_GENDER\`
        ${usernameFilter}
        QUALIFY ROW_NUMBER() OVER (PARTITION BY USERNAME ORDER BY \`DATE\` DESC) = 1
      )
      SELECT
        GENDER,
        ROUND(AVG(DISTRIBUTION) * 100, 2) AS distribution_pct
      FROM latest
      GROUP BY GENDER
      ORDER BY distribution_pct DESC
    `;
  },
};

export default async function handler(req, res) {
  try {
    const { type = 'kpiOverview', start, end, username } = req.query;

    if (!QUERIES[type]) {
      return res.status(400).json({
        error: `Unknown query type: ${type}. Available: ${Object.keys(QUERIES).join(', ')}`
      });
    }

    const bq = getBigQueryClient();
    const query = QUERIES[type]({ start, end, username });
    const [rows] = await bq.query({ query });

    return res.status(200).json({ data: rows, meta: { type, start, end, username } });
  } catch (err) {
    console.error('[tiktok-organic API]', err);
    return res.status(500).json({ error: err.message });
  }
}
