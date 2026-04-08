
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('meta_ads_performance')
        .select('account_id, ad_name')
        .ilike('ad_name', '%SUPERSTAR%')
        .limit(1);
    
    if (data && data.length > 0) {
        console.log(`Ad: ${data[0].ad_name}\nAccount ID: ${data[0].account_id}`);
    } else {
        console.log("No account found.");
    }
}

check();
