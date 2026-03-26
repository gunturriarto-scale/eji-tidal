import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
const TIKTOK_AD_ACCOUNT_IDS = (process.env.TIKTOK_AD_ACCOUNT_IDS || '').split(','); // Array of IDs

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZHhpZGZ1d253ZXFwbHFrenFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1OTQ0MiwiZXhwIjoyMDg5NzM1NDQyfQ.Sx0zoD0riV6kQLoaNhJfXvKZzD2kWJaVYbZkRD4Q5QY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseCampaignInfo(campaignName) {
    if (!campaignName) return { brand: 'others', category: 'others', product: 'others' };
    const parts = campaignName.split('//').map(p => p.trim());
    if (parts.length >= 6) {
        return {
            brand: parts[2],
            category: parts[3],
            product: parts[5]
        };
    }
    return { brand: 'others', category: 'others', product: 'others' };
}

async function fetchTikTokData() {
    const today = new Date().toISOString().split('T')[0];
    const startDate = `${new Date().getFullYear()}-01-01`;

    for (const advertiser_id of TIKTOK_AD_ACCOUNT_IDS) {
        if (!advertiser_id) continue;
        console.log(`\n--- Fetching TikTok Data for ${advertiser_id} ---`);

        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const url = `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?` +
                `advertiser_id=${advertiser_id}&` +
                `report_type=BASIC&` +
                `data_level=AUCTION_AD&` +
                `dimensions=["stat_time_day","ad_id"]&` +
                `metrics=["spend","impressions","reach","clicks","video_views_p25","video_views_p50","video_views_p75","video_views_p100","video_watched_2s","video_watched_6s","ad_name","campaign_name","campaign_id"]&` +
                `start_date=${startDate}&` +
                `end_date=${today}&` +
                `page=${page}&` +
                `page_size=1000`;

            const response = await fetch(url, {
                headers: { 'Access-Token': TIKTOK_ACCESS_TOKEN }
            });

            const data = await response.json();

            if (data.code !== 0) {
                console.error(`Error for account ${advertiser_id}:`, data.message);
                break;
            }

            const list = data.data?.list || [];
            if (list.length > 0) {
                const records = list.map(item => {
                    const metrics = item.metrics;
                    const dims = item.dimensions;
                    const { brand, category, product } = parseCampaignInfo(metrics.campaign_name);

                    return {
                        day: dims.stat_time_day,
                        ad_id: dims.ad_id,
                        ad_name: metrics.ad_name,
                        campaign_id: metrics.campaign_id,
                        campaign_name: metrics.campaign_name,
                        spend: parseFloat(metrics.spend || 0),
                        impressions: parseInt(metrics.impressions || 0),
                        reach: parseInt(metrics.reach || 0),
                        clicks: parseInt(metrics.clicks || 0),
                        video_views: parseInt(metrics.video_views_p100 || 0), // Use full views as proxy if needed
                        video_2s_views: parseInt(metrics.video_watched_2s || 0),
                        video_6s_views: parseInt(metrics.video_watched_6s || 0),
                        product: product,
                        category: category,
                        brand: brand,
                        updated_at: new Date().toISOString()
                    };
                });

                const { error } = await supabase
                    .from('tiktok_ads_performance')
                    .upsert(records, { onConflict: 'day,ad_id' });

                if (error) {
                    console.error('Supabase Error:', error.message);
                } else {
                    console.log(`Upserted ${records.length} records for ${advertiser_id}`);
                }
            }

            hasMore = data.data?.page_info?.total_page > page;
            page++;
        }
    }
}

fetchTikTokData().catch(console.error);
