
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking columns for meta_ads_performance...");
    const { data, error } = await supabase
        .from('meta_ads_performance')
        .select('*')
        .limit(1);
    
    if (error) {
        console.log("Error selecting:", error.message);
        return;
    }
    
    if (data && data.length > 0) {
        console.log("Columns found in first record:", Object.keys(data[0]));
    } else {
        console.log("No data in table.");
    }
}

check();
