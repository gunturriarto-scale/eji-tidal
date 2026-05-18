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
      SUM(ACTION_POST_ENGAGEMENT) as total_post_engagement
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

  // ─── CAMPAIGN OBJECTIVE BREAKDOWN ──────────────────────────────────────────
  campaignObjective: ({ start, end, account }) => `
    SELECT
      CASE
        WHEN CAMPAIGN_NAME LIKE '%REACH%' THEN 'REACH'
        WHEN CAMPAIGN_NAME LIKE '%ENGAGEMENT%' THEN 'ENGAGEMENT'
        ELSE 'OTHER'
      END as objective,
      ACCOUNT_NAME,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks,
      SUM(ACTION_POST_ENGAGEMENT) as post_engagement
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ─── PRODUCT BREAKDOWN ─────────────────────────────────────────────────────
  productBreakdown: ({ start, end, account }) => `
    SELECT
      ACCOUNT_NAME,
      CASE
        WHEN CAMPAIGN_NAME LIKE '%Sunscreen%' THEN 'Sunscreen'
        WHEN CAMPAIGN_NAME LIKE '%Serum%' THEN 'Serum'
        WHEN CAMPAIGN_NAME LIKE '%Micellar%' THEN 'Micellar Water'
        WHEN CAMPAIGN_NAME LIKE '%Moisturizer%' THEN 'Moisturizer'
        WHEN CAMPAIGN_NAME LIKE '%Lipcream%' THEN 'Lipcream'
        WHEN CAMPAIGN_NAME LIKE '%Cushion%' THEN 'Cushion'
        WHEN CAMPAIGN_NAME LIKE '%Blush%' THEN 'Blush'
        WHEN CAMPAIGN_NAME LIKE '%Foundation%' THEN 'Foundation'
        WHEN CAMPAIGN_NAME LIKE '%Lipstick%' THEN 'Lipstick'
        WHEN CAMPAIGN_NAME LIKE '%Body Serum%' THEN 'Body Serum'
        WHEN CAMPAIGN_NAME LIKE '%Body Scrub%' THEN 'Body Scrub'
        WHEN CAMPAIGN_NAME LIKE '%Vita Smoothies%' THEN 'Vita Smoothies'
        WHEN CAMPAIGN_NAME LIKE '%Tint%' THEN 'Tint'
        WHEN CAMPAIGN_NAME LIKE '%Setting%' THEN 'Setting Spray'
        WHEN CAMPAIGN_NAME LIKE '%Mask%' OR CAMPAIGN_NAME LIKE '%Sheet%' THEN 'Face Sheet Mask'
        WHEN CAMPAIGN_NAME LIKE '%Eyebrow%' THEN 'Eyebrow'
        WHEN CAMPAIGN_NAME LIKE '%Glow%' THEN 'Glow Expert'
        ELSE 'Other'
      END as product,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ─── RETAIL CHANNEL BREAKDOWN ──────────────────────────────────────────────
  retailChannel: ({ start, end, account }) => `
    SELECT
      ACCOUNT_NAME,
      CASE
        WHEN CAMPAIGN_NAME LIKE '%WATSONS%' THEN 'Watsons'
        WHEN CAMPAIGN_NAME LIKE '%GUARDIAN%' THEN 'Guardian'
        WHEN CAMPAIGN_NAME LIKE '%SAT%' THEN 'SAT'
        WHEN CAMPAIGN_NAME LIKE '%IDM%' THEN 'IDM'
        ELSE 'General'
      END as channel,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ─── PLATFORM POSITION BREAKDOWN ──────────────────────────────────────────
  platformPosition: ({ start, end, account }) => `
    SELECT
      CASE
        WHEN PLATFORM_POSITION LIKE '%reels%' THEN 'Reels'
        WHEN PLATFORM_POSITION LIKE '%stories%' THEN 'Stories'
        WHEN PLATFORM_POSITION LIKE '%feed%' THEN 'Feed'
        WHEN PLATFORM_POSITION LIKE '%explore%' THEN 'Explore'
        WHEN PLATFORM_POSITION LIKE '%search%' THEN 'Search'
        WHEN PLATFORM_POSITION LIKE '%instream%' THEN 'In-Stream'
        WHEN PLATFORM_POSITION LIKE '%marketplace%' THEN 'Marketplace'
        WHEN PLATFORM_POSITION LIKE '%threads%' THEN 'Threads'
        ELSE 'Other'
      END as position,
      PUBLISHER_PLATFORM,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ─── VIDEO FUNNEL DROPOFF ──────────────────────────────────────────────────
  videoFunnelDropoff: ({ start, end, account }) => `
    SELECT
      SUM(ACTION_VIDEO_VIEW) as views,
      SUM(VIDEO_P_25_WATCHED_ACTIONS) as p25,
      SUM(VIDEO_P_50_WATCHED_ACTIONS) as p50,
      SUM(VIDEO_P_75_WATCHED_ACTIONS) as p75,
      SUM(VIDEO_P_100_WATCHED_ACTIONS) as p100,
      SUM(VIDEO_THRUPLAY_WATCHED_ACTIONS) as thruplay
    FROM \`bigdata.FBADS_VIDEO\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}`,

  // ─── FREQUENCY ANALYSIS ────────────────────────────────────────────────────
  frequency: ({ start, end, account }) => `
    SELECT
      ACCOUNT_NAME,
      ROUND(SUM(IMPRESSIONS) / SUM(REACH), 2) as frequency,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND REACH > 0
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY frequency DESC`,

  // ─── DEVICE BREAKDOWN ──────────────────────────────────────────────────────
  deviceBreakdown: ({ start, end, account }) => `
    SELECT
      CASE
        WHEN IMPRESSION_DEVICE LIKE '%iphone%' THEN 'iPhone'
        WHEN IMPRESSION_DEVICE LIKE '%android_smartphone%' THEN 'Android Phone'
        WHEN IMPRESSION_DEVICE LIKE '%ipad%' THEN 'iPad'
        WHEN IMPRESSION_DEVICE LIKE '%android_tablet%' THEN 'Android Tablet'
        WHEN IMPRESSION_DEVICE LIKE '%desktop%' THEN 'Desktop'
        ELSE 'Other'
      END as device,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND IMPRESSION_DEVICE IS NOT NULL
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY spend DESC`,

  // ─── DAY OF WEEK TREND ─────────────────────────────────────────────────────
  dayOfWeek: ({ start, end, account }) => `
    SELECT
      FORMAT_DATE('%A', PARSE_DATE('%Y-%m-%d', DATE)) as day_name,
      EXTRACT(DAYOFWEEK FROM PARSE_DATE('%Y-%m-%d', DATE)) as day_num,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(ACTION_POST_ENGAGEMENT) as post_engagement
    FROM \`bigdata.FBADS_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY day_num`,

  // ─── DEMOGRAPHICS COST EFFICIENCY ──────────────────────────────────────────
  demoEfficiency: ({ start, end, account }) => `
    SELECT
      AGE, GENDER,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(REACH) as reach,
      SUM(CLICKS) as clicks,
      ROUND(SUM(COST) / SUM(IMPRESSIONS) * 1000, 2) as cpm,
      ROUND((SUM(CLICKS) / SUM(IMPRESSIONS)) * 100, 2) as ctr
    FROM \`bigdata.FBADS_AGE_GENDER\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ACCOUNT_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ═══════════════════════════════════════════════════════════════════════════════
  // TIKTOK ADS QUERIES
  // Table: bigdata.TIK_AD, bigdata.TIK_AGE_GENDER, bigdata.TIK_GEO
  // ═══════════════════════════════════════════════════════════════════════════════

  // ─── TIKTOK KPI SUMMARY ─────────────────────────────────────────────────────
  tiktokKpiSummary: ({ start, end, account }) => `
    SELECT
      ROUND(SUM(COST)) as total_spend,
      SUM(IMPRESSIONS) as total_impressions,
      SUM(CLICKS) as total_clicks,
      SUM(VIDEO_WATCHED_2S) as total_video_2s,
      SUM(VIDEO_WATCHED_6S) as total_video_6s,
      SUM(VIDEO_VIEWS_P25) as total_p25,
      SUM(VIDEO_VIEWS_P50) as total_p50,
      SUM(VIDEO_VIEWS_P75) as total_p75,
      SUM(VIDEO_VIEWS_P100) as total_p100,
      SUM(VIDEO_PLAY_ACTIONS) as total_video_play,
      SUM(CONVERSIONS) as total_conversions
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}`,

  // ─── TIKTOK BRAND OVERVIEW ──────────────────────────────────────────────────
  tiktokBrandOverview: ({ start, end }) => `
    SELECT
      ADVERTISER_NAME as account_name,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(VIDEO_WATCHED_2S) as video_2s,
      SUM(VIDEO_WATCHED_6S) as video_6s
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1
    ORDER BY spend DESC`,

  // ─── TIKTOK BRAND TREND ─────────────────────────────────────────────────────
  tiktokBrandTrend: ({ start, end }) => `
    SELECT
      DATE,
      ADVERTISER_NAME as account_name,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(VIDEO_WATCHED_2S) as video_2s
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1, 2
    ORDER BY DATE`,

  // ─── TIKTOK CAMPAIGNS ────────────────────────────────────────────────────────
  tiktokCampaigns: ({ start, end }) => `
    SELECT
      ADVERTISER_NAME as account_name,
      CAMPAIGN_NAME,
      CAMPAIGN_OBJECTIVE_TYPE,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(VIDEO_WATCHED_2S) as video_2s,
      SUM(CONVERSIONS) as conversions
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    GROUP BY 1, 2, 3
    ORDER BY spend DESC
    LIMIT 100`,

  // ─── TIKTOK TOP CAMPAIGNS ───────────────────────────────────────────────────
  tiktokTopCampaigns: ({ start, end, account }) => `
    SELECT
      ADVERTISER_NAME as account_name,
      CAMPAIGN_NAME,
      CAMPAIGN_OBJECTIVE_TYPE,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(VIDEO_WATCHED_2S) as video_2s,
      SUM(VIDEO_WATCHED_6S) as video_6s,
      SUM(CONVERSIONS) as conversions,
      ROUND(SUM(PURCHASE_VALUE)) as purchase_value
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1, 2, 3
    ORDER BY spend DESC
    LIMIT 50`,

  // ─── TIKTOK DEMOGRAPHICS ──────────────────────────────────────────────────────
  tiktokAgeGender: ({ start, end, account }) => `
    SELECT
      AGE,
      GENDER,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks
    FROM \`bigdata.TIK_AGE_GENDER\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY spend DESC`,

  // ─── TIKTOK GEO ───────────────────────────────────────────────────────────────
  tiktokGeo: ({ start, end, account }) => `
    SELECT
      COUNTRY_NAME,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks
    FROM \`bigdata.TIK_GEO\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY spend DESC
    LIMIT 20`,

  // ─── TIKTOK VIDEO FUNNEL ────────────────────────────────────────────────────
  tiktokVideoFunnel: ({ start, end, account }) => `
    SELECT
      AD_NAME,
      ADVERTISER_NAME as account_name,
      CAMPAIGN_NAME,
      VIDEO_ID,
      SUM(VIDEO_WATCHED_2S) as video_2s,
      SUM(VIDEO_WATCHED_6S) as video_6s,
      SUM(VIDEO_VIEWS_P25) as p25,
      SUM(VIDEO_VIEWS_P50) as p50,
      SUM(VIDEO_VIEWS_P75) as p75,
      SUM(VIDEO_VIEWS_P100) as p100,
      SUM(VIDEO_PLAY_ACTIONS) as video_plays,
      ROUND(SUM(COST)) as spend
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND VIDEO_WATCHED_2S > 0
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1, 2, 3, 4
    ORDER BY video_2s DESC
    LIMIT 20`,

  // ─── TIKTOK VIDEO KPI SUMMARY ────────────────────────────────────────────────
  tiktokVideoKPISummary: ({ start, end, account }) => `
    SELECT
      SUM(VIDEO_WATCHED_2S) as total_video_2s,
      SUM(VIDEO_WATCHED_6S) as total_video_6s,
      SUM(VIDEO_VIEWS_P25) as total_p25,
      SUM(VIDEO_VIEWS_P50) as total_p50,
      SUM(VIDEO_VIEWS_P75) as total_p75,
      SUM(VIDEO_VIEWS_P100) as total_p100,
      SUM(VIDEO_PLAY_ACTIONS) as total_video_plays
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}`,

  // ─── TIKTOK PLACEMENT ────────────────────────────────────────────────────────
  tiktokPlacement: ({ start, end, account }) => `
    SELECT
      PLACEMENT_TYPE,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(VIDEO_WATCHED_2S) as video_2s,
      SUM(CONVERSIONS) as conversions
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND PLACEMENT_TYPE IS NOT NULL AND PLACEMENT_TYPE != ''
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY spend DESC`,

  // ─── TIKTOK AD OVERVIEW ─────────────────────────────────────────────────────
  tiktokAdOverview: ({ start, end, account }) => `
    SELECT
      AD_NAME,
      AD_STATUS,
      ADVERTISER_NAME as account_name,
      CAMPAIGN_NAME,
      AD_TEXT,
      VIDEO_ID,
      MAX(PLAYABLE_URL) as playable_url,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(VIDEO_WATCHED_2S) as video_2s,
      SUM(VIDEO_WATCHED_6S) as video_6s,
      SUM(CONVERSIONS) as conversions,
      ROUND(SUM(PURCHASE_VALUE)) as purchase_value
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1, 2, 3, 4, 5, 6
    ORDER BY spend DESC
    LIMIT 50`,

  // ─── TIKTOK CONVERSIONS ─────────────────────────────────────────────────────
  tiktokConversions: ({ start, end, account }) => `
    SELECT
      CAMPAIGN_OBJECTIVE_TYPE as objective,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(VIDEO_WATCHED_2S) as video_2s,
      SUM(CONVERSIONS) as conversions,
      ROUND(SUM(PURCHASE_VALUE)) as purchase_value
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY conversions DESC`,

  // ─── TIKTOK DAY OF WEEK ──────────────────────────────────────────────────────
  tiktokDayOfWeek: ({ start, end, account }) => `
    SELECT
      FORMAT_DATE('%A', PARSE_DATE('%Y-%m-%d', DATE)) as day_name,
      EXTRACT(DAYOFWEEK FROM PARSE_DATE('%Y-%m-%d', DATE)) as day_num,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(VIDEO_WATCHED_2S) as video_2s,
      SUM(CONVERSIONS) as conversions
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1, 2
    ORDER BY day_num`,

  // ─── TIKTOK DEVICE ──────────────────────────────────────────────────────────
  tiktokDevice: ({ start, end, account }) => `
    SELECT
      CASE
        WHEN TARGET_ANDROID_OSV IS NOT NULL AND TARGET_ANDROID_OSV != '' THEN 'Android'
        WHEN TARGET_IOS_OSV IS NOT NULL AND TARGET_IOS_OSV != '' THEN 'iOS'
        ELSE 'Other'
      END as device,
      ROUND(SUM(COST)) as spend,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks
    FROM \`bigdata.TIK_AD\`
    WHERE DATE BETWEEN '${start}' AND '${end}'
    AND (TARGET_ANDROID_OSV IS NOT NULL OR TARGET_IOS_OSV IS NOT NULL)
    ${account && account !== 'all' ? `AND ADVERTISER_NAME = '${account}'` : ''}
    GROUP BY 1
    ORDER BY spend DESC`,

  tikAdSchema: () => `
    SELECT column_name, data_type
    FROM \`bigdata.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = 'TIK_AD'
    ORDER BY ordinal_position`,

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
