
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('meta_ads_performance')
        .select('ad_name, views, video_p50, impressions, ad_id, account_id')
        .ilike('ad_name', '%1602%')
        .limit(1);
    
    if (data && data.length > 0) {
        console.log(`Ad: ${data[0].ad_name}\nViews: ${data[0].views}\nP50: ${data[0].video_p50}\nImpressions: ${data[0].impressions}`);
    } else {
        console.log("Ad 1602 not found in DB.");
    }
}

check();
