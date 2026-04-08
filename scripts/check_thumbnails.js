
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('meta_ads_performance')
        .select('ad_name, ad_thumbnail_url, ad_id')
        .not('ad_thumbnail_url', 'is', null)
        .limit(3);
    
    if (error) {
        console.log("Error selecting:", error.message);
        return;
    }
    
    if (data && data.length > 0) {
        console.log("Found records with thumbnails:");
        data.forEach(d => console.log(`- ${d.ad_name}: ${d.ad_thumbnail_url}`));
    } else {
        console.log("No records found with thumbnails yet.");
    }
}

check();
