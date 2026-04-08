import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('meta_ads_performance')
    .select('account_id, account_name, spend, day')
    .gte('day', '2026-03-01')
    .lte('day', '2026-03-31');

  if (error) {
    console.error('Supabase Error:', error);
    return;
  }

  const accountSpend = {};
  data.forEach(row => {
    if (!accountSpend[row.account_id]) {
        accountSpend[row.account_id] = { name: row.account_name, totalSpend: 0, march15Spend: 0, peakSpend: 0, peakDate: '' };
    }
    accountSpend[row.account_id].totalSpend += row.spend;
    if (row.day === '2026-03-15') {
        accountSpend[row.account_id].march15Spend += row.spend;
    }
    if (row.spend > accountSpend[row.account_id].peakSpend) {
        accountSpend[row.account_id].peakSpend = row.spend;
        accountSpend[row.account_id].peakDate = row.day;
    }
  });

  console.log('--- MARCH 2026 META SPEND DIAGNOSTICS ---');
  Object.keys(accountSpend).forEach(id => {
      const acc = accountSpend[id];
      console.log(`Account ID: ${id}`);
      console.log(`Name: ${acc.name}`);
      console.log(`Total March Spend: ${acc.totalSpend}`);
      console.log(`March 15th Spend: ${acc.march15Spend}`);
      console.log(`Peak Daily Spend: ${acc.peakSpend} (on ${acc.peakDate})`);
      console.log('-----------------------------------------');
  });
}

check();
