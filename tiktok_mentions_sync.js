const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) throw new Error("Missing APIFY_TOKEN environment variable");
const SUPABASE_URL = 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const SUPABASE_KEY = 'sb_publishable__O5l9yeFqb36QOOhPjozcw_QsqMCKCd';

const client = new ApifyClient({ token: APIFY_TOKEN });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const brands = [
    { name: 'skintific', queries: ['skintific indonesia', '#skintific'] },
    { name: 'glad2glow', queries: ['glad2glow indonesia', '#glad2glow'] }
];

async function updateTikTokMentions() {
    console.log('--- Starting TikTok Mentions Sync ---');
    
    // As per user request: Delete ALL existing TikTok data before re-syncing to ensure clean state
    console.log('Wiping existing TikTok data from Supabase...');
    await supabase.from('social_mentions').delete().eq('platform', 'tiktok');
    
    for (const brand of brands) {
        console.log(`\nSearching TikTok for ${brand.name}...`);
        
        try {
            // TikTok Scraper (apify/tiktok-scraper)
            const run = await client.actor('apify/tiktok-scraper').call({
                hashtags: brand.queries.filter(q => q.startsWith('#')).map(q => q.replace('#', '')),
                searchQueries: brand.queries.filter(q => !q.startsWith('#')),
                resultsPerPage: 200, // Enough to cover back to Jan 2026 for most brands
                shouldDownloadVideos: false,
                shouldDownloadCovers: false,
                region: 'ID' // Filter Indonesia
            });

            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`Found ${items.length} raw items for ${brand.name}`);

            const formatted = items
                .filter(item => {
                    const date = item.createTimeISO ? new Date(item.createTimeISO) : new Date(item.createTime * 1000);
                    return date >= new Date('2026-01-01');
                })
                .map(item => ({
                    url: item.webVideoUrl,
                    platform: 'tiktok',
                    brand: brand.name,
                    username: item.authorMeta.name,
                    posted_at: item.createTimeISO || new Date(item.createTime * 1000).toISOString(),
                    snippet: item.text || '',
                    views: item.playCount || 0,
                    likes: item.diggCount || 0,
                    comments: item.commentCount || 0,
                    shares: item.shareCount || 0,
                    author_id: item.authorMeta.id
                }));

            if (formatted.length > 0) {
                const { error } = await supabase
                    .from('social_mentions')
                    .insert(formatted); // Bulk insert since DB is clean

                if (error) console.error(`Error saving ${brand.name}:`, error);
                else console.log(`Successfully synced ${formatted.length} clean TikTok mentions for ${brand.name}`);
            }

        } catch (err) {
            console.error(`Failed to scrape TikTok ${brand.name}:`, err.message);
        }
    }
    
    console.log('\n--- TikTok Sync Complete ---');
}

updateTikTokMentions();
