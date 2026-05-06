import { BigQuery } from '@google-cloud/bigquery';
const bq = new BigQuery({ keyFilename: '/Users/mgrmediaads/Downloads/big-data-494007-f6751e5fec47.json' });

async function run() {
  const query = `
    SELECT 
      CAMPAIGN_NAME,
      ROUND(SUM(COST)) as spent,
      SUM(IMPRESSIONS) as impressions,
      SUM(CLICKS) as clicks,
      SUM(REACH) as reach,
      SUM(ACTION_VIDEO_VIEW) as video_views,
      SUM(ACTION_POST_ENGAGEMENT) as engagement
    FROM \`bigdata.FBADS_AD\`
    WHERE ACCOUNT_NAME = 'EJI // HANASUI // SKINCARE'
    AND DATE >= DATE_SUB(DATE('2026-04-22'), INTERVAL 7 DAY)
    GROUP BY 1
    ORDER BY spent DESC
    LIMIT 10
  `;
  
  try {
    const [rows] = await bq.query({ query });
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
