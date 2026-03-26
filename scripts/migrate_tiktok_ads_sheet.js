import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

// Configuration
const SUPABASE_URL = 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZHhpZGZ1d253ZXFwbHFrenFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1OTQ0MiwiZXhwIjoyMDg5NzM1NDQyfQ.Sx0zoD0riV6kQLoaNhJfXvKZzD2kWJaVYbZkRD4Q5QY';
const TABLE_NAME = 'tiktok_ads_performance';
const SHEET_ID = '1jl0wFIfNEWYofEHN27Wb9UM1bdmoxzt5e2NUGyFijHY';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=TIKTOK`;

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
    } else if (parts.length >= 3) {
        return {
            brand: parts[2],
            category: 'others',
            product: 'others'
        };
    }
    return { brand: 'others', category: 'others', product: 'others' };
}

async function migrate() {
    console.log('Fetching TikTok Sheet data...');
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch TikTok Sheet');
    const csvData = await response.text();
    
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    console.log(`Parsed ${parsed.data.length} rows.`);

    // Deduplicate and aggregate
    const aggregatedMap = new Map();
    parsed.data.forEach(row => {
        const cleanVal = (v) => {
            if (!v) return 0;
            const s = String(v).replace(/[Rp\s%,]/g, '');
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        };

        const day = row['By Day'];
        const ad_id = row['Ad name'] || 'UNKNOWN';
        if (!day || day.length !== 10) return;

        const key = `${day}_${ad_id}`;
        const { brand, category, product } = parseCampaignInfo(row['Campaign name'] || '');

        if (aggregatedMap.has(key)) {
            const existing = aggregatedMap.get(key);
            existing.spend += cleanVal(row['Cost']);
            existing.reach += Math.round(cleanVal(row['Reach']));
            existing.impressions += Math.round(cleanVal(row['Impressions']));
            existing.clicks += Math.round(cleanVal(row['Clicks (all)']));
            existing.video_views += Math.round(cleanVal(row['Video views']));
            existing.video_2s_views += Math.round(cleanVal(row['2-second video views']));
            existing.video_6s_views += Math.round(cleanVal(row['6-second video views']));
        } else {
            aggregatedMap.set(key, {
                day: day,
                ad_id: ad_id,
                ad_name: row['Ad name'],
                campaign_id: row['Campaign name'] || 'UNKNOWN',
                campaign_name: row['Campaign name'],
                account_name: row['Account name'],
                advertising_objective: row['Advertising objective'],
                spend: cleanVal(row['Cost']),
                reach: Math.round(cleanVal(row['Reach'])),
                impressions: Math.round(cleanVal(row['Impressions'])),
                clicks: Math.round(cleanVal(row['Clicks (all)'])),
                video_views: Math.round(cleanVal(row['Video views'])),
                video_2s_views: Math.round(cleanVal(row['2-second video views'])),
                video_6s_views: Math.round(cleanVal(row['6-second video views'])),
                product: product || row['PRODUCTS'],
                category: category,
                brand: brand,
                updated_at: new Date().toISOString()
            });
        }
    });

    const records = Array.from(aggregatedMap.values());

    console.log(`Upserting ${records.length} records to Supabase...`);
    
    const chunkSize = 500;
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert(chunk, { onConflict: 'day,ad_id' });
        
        if (error) {
            console.error(`Error upserting chunk:`, error.message);
        } else {
            console.log(`Upserted ${i + chunk.length} records`);
        }
    }

    console.log('Migration complete.');
}

migrate().catch(console.error);
