import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

// Configuration
const SUPABASE_URL = 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZHhpZGZ1d253ZXFwbHFrenFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1OTQ0MiwiZXhwIjoyMDg5NzM1NDQyfQ.Sx0zoD0riV6kQLoaNhJfXvKZzD2kWJaVYbZkRD4Q5QY';
const TABLE_NAME = 'google_ads_performance';
const SHEET_ID = '1jl0wFIfNEWYofEHN27Wb9UM1bdmoxzt5e2NUGyFijHY';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=GOOGLE%20ADS`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function parseCampaignInfo(campaignName) {
    if (!campaignName) return { brand: 'others', category: 'others', product: 'others' };
    
    // Pattern: EJI // [OBJECTIVE] // [BRAND] // [CATEGORY] // [PRODUCT]
    const parts = campaignName.split('//').map(p => p.trim());
    
    if (parts.length >= 5) {
        return {
            brand: parts[2],
            category: parts[3],
            product: parts[4]
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
    console.log('Fetching Google Sheet data...');
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch Google Sheet');
    const csvData = await response.text();
    
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    console.log(`Parsed ${parsed.data.length} rows.`);

    const records = parsed.data.map(row => {
        // Clean values
        const cleanVal = (v) => {
            if (!v) return 0;
            const s = String(v).replace(/[Rp\s%,]/g, '');
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        };

        const { brand, category, product } = parseCampaignInfo(row['Campaign'] || '');

        // Standardize date
        let day = row['Day'];
        if (day && day.includes('/')) {
            const parts = day.split('/');
            if (parts.length === 3) day = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        return {
            day: day,
            campaign_id: row['Campaign'] || 'UNKNOWN', // Google Sheet doesn't always have ID, using name as key if ID missing
            campaign_name: row['Campaign'],
            spend: cleanVal(row['Cost']),
            impressions: Math.round(cleanVal(row['Impr.'])),
            clicks: Math.round(cleanVal(row['Clicks'])),
            video_views: Math.round(cleanVal(row['TrueView views'] || 0)),
            conversions: cleanVal(row['Conversions']),
            conversion_value: cleanVal(row['Conv. value']),
            video_p50: Math.round(cleanVal(row['Video played to 50%'])),
            product: product || row['PRODUCTS'],
            category: category,
            brand: brand,
            updated_at: new Date().toISOString()
        };
    }).filter(r => r.day && r.day.length === 10); // Ensure valid date

    console.log(`Upserting ${records.length} records to Supabase...`);
    
    // Chunking to avoid large payload errors
    const chunkSize = 500;
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert(chunk, { onConflict: 'day,campaign_id' });
        
        if (error) {
            console.error(`Error upserting chunk starting at ${i}:`, error.message);
        } else {
            console.log(`Successfully upserted records ${i} to ${Math.min(i + chunkSize, records.length)}`);
        }
    }

    console.log('Migration complete.');
}

migrate().catch(console.error);
