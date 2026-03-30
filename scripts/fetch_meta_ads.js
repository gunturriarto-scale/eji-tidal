import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PLACEHOLDER';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'PLACEHOLDER';

const adAccountIds = [
    '917176454202722',
    '2086234315025549',
    '1352894819267337',
    '843434777940799',
    '3764874687144822',
    '1210991147385093',
    '958731122747957',
    '2124015835034852'
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Mapping Logic (Reproduced from mapping_logic.js)
function getProduct(campaignName) {
    const lowerName = campaignName.toLowerCase();
    if (lowerName.includes("body serum")) return "BBS";
    if (lowerName.includes("idm")) return "indomart";
    if (lowerName.includes("sat")) return "sat";
    if (lowerName.includes("guardian")) return "guardian";
    if (lowerName.includes("aeon")) return "aeon";

    const products = [
        "Lipcream Matte", "Sunscreen", "Renew Serum", "Serum Cushion", 
        "Liplast", "Mascara", "Lip Oil", "Power Serum", "Glow expert", 
        "Face Sheet Mask", "Micellar", "Moisturizer", "Vita Smoothies", "Body Scrub"
    ];

    for (const p of products) {
        if (lowerName.includes(p.toLowerCase())) return p;
    }

    return "others";
}

function getCategory(campaignName) {
    const lowerName = campaignName.toLowerCase();
    if (lowerName.includes("decorative")) return "decorative";
    if (lowerName.includes("skincare")) return "skincare";
    if (lowerName.includes("bodycare")) return "bodycare";
    return "others";
}

function getCategoryBrand(product) {
    const lowerProduct = product.toLowerCase();
    const mattedorable = ["lipcream matte", "mattedorable", "serum cushion"];
    const nextLevel = ["liplast", "mascara", "lip oil", "npl"];
    const sunscreen = ["sunscreen", "renew serum"];
    const faceSerum = ["power serum", "glow expert"];
    const faceCare = ["face sheet mask"];
    const othersSkincare = ["micellar"];
    const moisturizer = ["moisturizer"];
    const bodyCare = ["bbs", "vita smoothies", "body scrub"];

    if (mattedorable.some(p => lowerProduct.includes(p))) return "Decorative // Mattedorable";
    if (nextLevel.some(p => lowerProduct.includes(p))) return "Decorative // Next Level";
    if (sunscreen.some(p => lowerProduct.includes(p))) return "Skincare // Sunscreen";
    if (faceSerum.some(p => lowerProduct.includes(p))) return "Skincare // Face Serum";
    if (faceCare.some(p => lowerProduct.includes(p))) return "Skincare // Face Care";
    if (othersSkincare.some(p => lowerProduct.includes(p))) return "Skincare // Others";
    if (moisturizer.some(p => lowerProduct.includes(p))) return "Skincare // Moisturizer";
    if (bodyCare.some(p => lowerProduct.includes(p))) return "Bodycare // Body Care";
    
    return "Other";
}

function getBrand(accountName) {
    const upperName = accountName.toUpperCase();
    if (upperName.includes("HANASUI")) return "HANASUI";
    if (upperName.includes("EOMMA")) return "EOMMA";
    if (upperName.includes("FYNE")) return "FYNE";
    if (upperName.includes("N.CO") || upperName.includes("NCO")) return "NCO";
    return "others";
}

async function fetchAllData() {
    const today = new Date().toISOString().split('T')[0];
    const startDate = `${new Date().getFullYear()}-01-01`;

    for (const accountId of adAccountIds) {
        console.log(`\n--- Fetching Data for ${accountId} ---`);
        let url = `https://graph.facebook.com/v20.0/act_${accountId}/insights?` + 
                  `fields=date_start,account_id,account_name,campaign_id,campaign_name,ad_id,ad_name,spend,reach,impressions,frequency,inline_link_clicks,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions,actions,objective,buying_type,ad{effective_status,creative{thumbnail_url,preview_url}},action_values` +
                  `&level=ad&time_increment=1&time_range={"since":"${startDate}","until":"${today}"}` +
                  `&access_token=${META_ACCESS_TOKEN}&limit=500`;

        while (url) {
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error(`Error for account ${accountId}:`, data.error.message);
                break;
            }

            if (data.data && data.data.length > 0) {
                const records = data.data.map(item => {
                    const post_engagement = item.actions?.find(a => a.action_type === 'post_engagement')?.value || 0;
                    const post_comment = item.actions?.find(a => a.action_type === 'post_comment')?.value || 0;
                    const post_reaction = item.actions?.find(a => a.action_type === 'post_reaction')?.value || 0;
                    const page_like = item.actions?.find(a => a.action_type === 'page_like')?.value || 0;
                    const page_engagement = item.actions?.find(a => a.action_type === 'page_engagement')?.value || 0;
                    const video_view = item.actions?.find(a => a.action_type === 'video_view')?.value || 0;

                    const product = getProduct(item.campaign_name || '');
                    
                    return {
                        day: item.date_start,
                        account_id: item.account_id,
                        account_name: item.account_name,
                        campaign_id: item.campaign_id,
                        campaign_name: item.campaign_name,
                        ad_id: item.ad_id,
                        ad_name: item.ad_name,
                        spend: parseFloat(item.spend || 0),
                        reach: parseInt(item.reach || 0),
                        impressions: parseInt(item.impressions || 0),
                        frequency: parseFloat(item.frequency || 0),
                        link_clicks: parseInt(item.inline_link_clicks || 0),
                        video_p25: parseInt(item.video_p25_watched_actions?.[0]?.value || 0),
                        video_p50: parseInt(item.video_p50_watched_actions?.[0]?.value || 0),
                        video_p75: parseInt(item.video_p75_watched_actions?.[0]?.value || 0),
                        video_p95: parseInt(item.video_p95_watched_actions?.[0]?.value || 0),
                        video_p100: parseInt(item.video_p100_watched_actions?.[0]?.value || 0),
                        post_comments: parseInt(post_comment),
                        post_engagements: parseInt(post_engagement),
                        post_reactions: parseInt(post_reaction),
                        page_likes: parseInt(page_like),
                        page_engagements: parseInt(page_engagement),
                        views: parseInt(video_view),
                        product: product,
                        category: getCategory(item.campaign_name || ''),
                        category_group: getCategoryBrand(product),
                        brand: getBrand(item.account_name || ''),
                        objective: item.objective || null,
                        buying_type: item.buying_type || null,
                        effective_status: item.ad?.effective_status || 'UNKNOWN',
                        ad_thumbnail_url: item.ad?.creative?.thumbnail_url || null,
                        ad_preview_url: item.ad?.creative?.preview_url || null,
                        action_values: item.action_values || []
                    };
                });

                // Upsert into Supabase
                const { error } = await supabase
                    .from('meta_ads_performance')
                    .upsert(records, { onConflict: 'day,ad_id' });

                if (error) {
                    console.error('Supabase Error:', error);
                } else {
                    console.log(`Upserted ${records.length} records for ${accountId}`);
                }
            }

            url = data.paging?.next || null;
        }
    }
}

fetchAllData();
