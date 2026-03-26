import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const GOOGLE_ADS_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || 'PLACEHOLDER';
const GOOGLE_ADS_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || 'PLACEHOLDER';
const GOOGLE_ADS_REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN || 'PLACEHOLDER';
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'PLACEHOLDER';
const GOOGLE_ADS_CUSTOMER_IDS = [
    '2309244207', 
    '4107340576', 
    '8456361791', 
    '8572810701', 
    '7104791294'
];
const GOOGLE_ADS_MANAGER_ID = process.env.GOOGLE_ADS_MANAGER_ID || '5558823317';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PLACEHOLDER';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getAccessToken() {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: GOOGLE_ADS_CLIENT_ID,
            client_secret: GOOGLE_ADS_CLIENT_SECRET,
            refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });
    
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to refresh token: ${response.status} ${err}`);
    }
    
    const data = await response.json();
    return data.access_token;
}

function parseCampaignInfo(campaignName) {
    if (!campaignName) return { brand: 'others', category: 'others', product: 'others' };
    const parts = campaignName.split('//').map(p => p.trim());
    if (parts.length >= 5) {
        return {
            brand: parts[2],
            category: parts[3],
            product: parts[4]
        };
    }
    return { brand: 'others', category: 'others', product: 'others' };
}

async function fetchGoogleAdsData() {
    console.log('Refreshing Access Token...');
    const accessToken = await getAccessToken();
    
    const today = new Date().toISOString().split('T')[0];
    const startDate = `${new Date().getFullYear()}-01-01`;

    for (const customer_id of GOOGLE_ADS_CUSTOMER_IDS) {
        console.log(`\n--- Fetching Google Ads data for ${customer_id} ---`);

        const query = {
            query: `
                SELECT 
                    segments.date, 
                    campaign.id, 
                    campaign.name, 
                    metrics.cost_micros, 
                    metrics.impressions, 
                    metrics.clicks,
                    metrics.conversions,
                    metrics.conversions_value,
                    metrics.video_quartile_p25_rate,
                    metrics.video_quartile_p50_rate,
                    metrics.video_quartile_p75_rate,
                    metrics.video_quartile_p100_rate
                FROM campaign 
                WHERE segments.date BETWEEN '${startDate}' AND '${today}'
            `
        };

        const response = await fetch(`https://googleads.googleapis.com/v23/customers/${customer_id}/googleAds:search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
                'login-customer-id': GOOGLE_ADS_MANAGER_ID,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Fetch error for ${customer_id}:`, response.status, errText);
            continue;
        }

        const data = await response.json();
        if (data.error) {
            console.error(`Google Ads API Error for ${customer_id}:`, data.error.message);
            continue;
        }

        if (data.results && data.results.length > 0) {
            const records = data.results.map(item => {
                const campaign = item.campaign;
                const metrics = item.metrics;
                const segments = item.segments;

                const { brand, category, product } = parseCampaignInfo(campaign.name);

                return {
                    day: segments.date,
                    campaign_id: campaign.id,
                    campaign_name: campaign.name,
                    spend: parseFloat(metrics.costMicros || 0) / 1000000,
                    impressions: parseInt(metrics.impressions || 0),
                    clicks: parseInt(metrics.clicks || 0),
                    video_views: 0,
                    conversions: parseFloat(metrics.conversions || 0),
                    conversion_value: parseFloat(metrics.conversionsValue || 0),
                    video_p25: Math.round(parseFloat(metrics.videoQuartileP25Rate || 0) * parseInt(metrics.impressions || 0)),
                    video_p50: Math.round(parseFloat(metrics.videoQuartileP50Rate || 0) * parseInt(metrics.impressions || 0)),
                    video_p75: Math.round(parseFloat(metrics.videoQuartileP75Rate || 0) * parseInt(metrics.impressions || 0)),
                    video_p100: Math.round(parseFloat(metrics.videoQuartileP100Rate || 0) * parseInt(metrics.impressions || 0)),
                    product: product,
                    category: category,
                    brand: brand,
                    customer_id: customer_id,
                    updated_at: new Date().toISOString()
                };
            });

            console.log(`Upserting ${records.length} records to Supabase for ${customer_id}...`);
            const { error } = await supabase
                .from('google_ads_performance')
                .upsert(records, { onConflict: 'day,campaign_id' });

            if (error) {
                console.error(`Supabase Error for ${customer_id}:`, error.message);
            } else {
                console.log(`Successfully updated ${customer_id} in Supabase.`);
            }
        } else {
            console.log(`No data found for ${customer_id} in the selected period.`);
        }
    }
}

fetchGoogleAdsData().catch(console.error);
