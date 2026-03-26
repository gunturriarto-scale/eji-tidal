import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuration
const CRITEO_CLIENT_ID = process.env.CRITEO_CLIENT_ID;
const CRITEO_CLIENT_SECRET = process.env.CRITEO_CLIENT_SECRET;
const CRITEO_ADVERTISER_ID = process.env.CRITEO_ADVERTISER_ID;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function getAccessToken() {
    console.log('Fetching Criteo Access Token...');
    const authHeader = Buffer.from(`${CRITEO_CLIENT_ID}:${CRITEO_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://api.criteo.com/oauth2/token', {
        method: 'POST',
        headers: { 
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Auth Failed: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Logic implemented from Spreadsheet (Columns N, O, P, Q)
function getExtendedMapping(adName) {
    if (!adName) return { product: 'others', category_group: 'OTHERS', category: 'OTHERS', brand: 'others' };
    
    const name = adName.toLowerCase();
    
    // Column N: PRODUCTS
    let product = 'others';
    if (name.includes('lip cream matte')) product = 'Lipcream Matte';
    else if (name.includes('lip cream boba')) product = 'Lipcream Boba';
    else if (name.includes('lip cream matcha')) product = 'Lipcream Matcha';
    else if (name.includes('blurry tint')) product = 'Blurry Tint';
    else if (name.includes('liplast')) product = 'Liplast';
    else if (name.includes('butter balm')) product = 'Butter Balm';
    else if (name.includes('airy velvet cushion')) product = 'Airy Velvet Cushion';
    else if (name.includes('coverlock')) product = 'Coverlock Powder Foundation';
    else if (name.includes('browmatics')) product = 'Eyebrowmatics';
    else if (name.includes('bouncy blush')) product = 'Bouncy Blush';
    else if (name.includes('blush on')) product = 'Blush & Go';
    else if (name.includes('setting spray next level')) product = 'Setting Spray';
    else if (name.includes('sunscreen')) product = 'Sunscreen';
    else if (name.includes('renew serum')) product = 'Renew Serum';
    else if (name.includes('power serum')) product = 'Power Serum';
    else if (name.includes('glow expert')) product = 'Glow expert';
    else if (name.includes('face sheet mask')) product = 'Face Sheet Mask';
    else if (name.includes('micellar water')) product = 'Micellar';
    else if (name.includes('moisturizer')) product = 'Moisturizer';
    else if (name.includes('bbs')) product = 'BBS';
    else if (name.includes('vita smoothies')) product = 'Vita Smoothies';
    else if (name.includes('body scrub')) product = 'Body Scrub';

    // Column O: Category Brand (grouped into broad categories)
    let categoryGroup = 'OTHERS';
    const mattes = ["Lipcream Matte", "Lipcream Boba", "Lipcream Matcha", "Glazedorable Vinyl stain", "Tintdorable lip stain", "Mattedorable lipstick", "Blush & Go", "Eyebrowtiful & Eyedorable", "Serum Cushion & Cushion Soulmatte"];
    const nextLevel = ["Liplast", "Blurry Tint", "Butter Balm", "Airy Velvet Cushion", "Coverlock Powder Foundation", "Eyebrowmatics", "Bouncy Blush", "Setting Spray", "NPL (Mascara, Lip Oil)"];
    
    if (mattes.includes(product)) categoryGroup = "Decorative // Mattedorable";
    else if (nextLevel.includes(product)) categoryGroup = "Decorative // Next Level";
    else if (product === "Sunscreen" || product === "Renew Serum") categoryGroup = "Skincare // Sunscreen";
    else if (product === "Power Serum" || product === "Glow expert") categoryGroup = "Skincare // Face Serum";
    else if (product === "Face Sheet Mask") categoryGroup = "Skincare // Face Care";
    else if (product === "Micellar") categoryGroup = "Skincare // Others";
    else if (product === "Moisturizer") categoryGroup = "Skincare // Moisturizer";
    else if (["BBS", "Vita Smoothies", "Body Scrub"].includes(product)) categoryGroup = "Bodycare // Body Care";

    // Column P: Category
    let category = 'OTHERS';
    if (categoryGroup.includes(' // ')) {
        category = categoryGroup.split(' // ')[0];
    } else {
        category = categoryGroup;
    }

    // Column Q: BRAND
    let brand = 'others';
    if (name.includes('hanasui')) brand = 'HANASUI';
    else if (name.includes('nco')) brand = 'NCO';
    else if (name.includes('lolaane')) brand = 'LOLAANE';
    else if (name.includes('hmi')) brand = 'HMI';

    return { product, category_group: categoryGroup, category, brand };
}

async function fetchCriteoData() {
    try {
        const accessToken = await getAccessToken();
        const today = new Date().toISOString().split('T')[0];
        const startDate = `${new Date().getFullYear()}-01-01`;

        console.log(`\n--- Fetching Criteo Ad-Level Data for Advertiser ${CRITEO_ADVERTISER_ID} ---`);

        const query = {
            advertiserIds: String(CRITEO_ADVERTISER_ID),
            startDate: startDate,
            endDate: today,
            dimensions: ["Day", "CampaignId", "Campaign", "AdId", "Ad"],
            metrics: [
                "AdvertiserCost", "Displays", "Clicks", "Reach", "Audience",
                "Cpc", "ECpm", "ViewableDisplays", 
                "NonViewableDisplays", "UntrackableDisplays"
            ],
            format: "Json",
            currency: "IDR",
            timezone: "GMT"
        };

        const response = await fetch('https://api.criteo.com/2024-10/statistics/report', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            body: JSON.stringify(query)
        });

        console.log(`API Response Status: ${response.status}`);

        if (!response.ok) {
            const err = await response.text();
            console.error(`Fetch error:`, response.status, err);
            return;
        }

        const rawData = await response.json();
        const rows = rawData.Rows || rawData || []; 

        console.log(`Fetched ${rows.length} rows from Criteo.`);

        if (rows.length > 0) {
            const records = rows.map(item => {
                const { product, category_group, category, brand } = getExtendedMapping(item.Ad);
                
                const displays = parseInt(item.Displays || 0);
                const viewable = parseInt(item.ViewableDisplays || 0);
                
                return {
                    day: item.Day.split('T')[0],
                    advertiser_id: CRITEO_ADVERTISER_ID,
                    campaign_id: String(item.CampaignId),
                    campaign_name: item.Campaign,
                    ad_id: String(item.AdId),
                    ad_name: item.Ad,
                    audience: item.Audience || 'others',
                    spend: parseFloat(item.AdvertiserCost || 0),
                    impressions: displays,
                    clicks: parseInt(item.Clicks || 0),
                    exposed_users: parseInt(item.Reach || 0),
                    cpc: parseFloat(item.Cpc || 0),
                    cpm: parseFloat(item.ECpm || 0),
                    viewability: displays > 0 ? (viewable / displays) * 100 : 0,
                    viewed_displays: viewable,
                    unviewed_displays: parseInt(item.NonViewableDisplays || 0),
                    untracked_displays: parseInt(item.UntrackableDisplays || 0),
                    product: product,
                    category_group: category_group,
                    category: category,
                    brand: brand,
                    created_at: new Date().toISOString()
                };
            });

            console.log(`Upserting ${records.length} records to Supabase...`);
            const { error } = await supabase
                .from('criteo_ads_performance')
                .upsert(records, { onConflict: 'day,advertiser_id,campaign_id,ad_id,audience' });

            if (error) {
                console.error('Supabase Error:', error.message);
            } else {
                console.log(`Successfully updated Criteo data in Supabase.`);
            }
        } else {
            console.log('No data found for the selected period.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

fetchCriteoData();
