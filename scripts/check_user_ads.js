
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Searching for specific ad names from user screenshot...");
    const { data, error } = await supabase
        .from('meta_ads_performance')
        .select('ad_name, ad_thumbnail_url, ad_id, effective_status')
        .ilike('ad_name', '%SUPERSTAR%')
        .limit(5);
    
    if (error) {
        console.log("Error selecting:", error.message);
        return;
    }
    
    if (data && data.length > 0) {
        data.forEach(d => console.log(`- ${d.ad_name}\n  > ID: ${d.ad_id}\n  > Thumbnail: ${d.ad_thumbnail_url || 'NULL'}\n  > Status: ${d.effective_status || 'UNKNOWN'}`));
    } else {
        console.log("No matching ads found.");
    }
}

check();
