const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) throw new Error("Missing APIFY_TOKEN environment variable");
const SUPABASE_URL = 'https://ysdxidfuwnweqplqkzqb.supabase.co';
const SUPABASE_KEY = 'sb_publishable__O5l9yeFqb36QOOhPjozcw_QsqMCKCd';

const client = new ApifyClient({ token: APIFY_TOKEN });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const brands = [
    { name: 'skintific', handle: 'skintificid' },
    { name: 'glad2glow', handle: 'glad2glow' }
];

async function updateInstagramOfficial() {
    console.log('--- Starting Instagram Official Account Sync ---');
    
    // As per user request: Delete ALL existing Instagram data before re-syncing to ensure clean state
    console.log('Wiping existing Instagram data from Supabase...');
    await supabase.from('social_mentions').delete().eq('platform', 'instagram');
    
    for (const brand of brands) {
        console.log(`\nFetching official posts for ${brand.name} (@${brand.handle})...`);
        
        try {
            // Instagram Scraper
            const run = await client.actor('apify/instagram-scraper').call({
                directUrls: [`https://www.instagram.com/${brand.handle}/`],
                resultsType: "posts",
                resultsLimit: 200
            });

            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            console.log(`Found ${items.length} items for ${brand.name}`);

            const formatted = items
                .filter(item => {
                    const date = new Date(item.timestamp);
                    return date >= new Date('2026-01-01');
                })
                .map(item => {
                    const postType = item.type === "Video" ? "reels" : (item.childPosts?.length > 1 ? "carousel" : "image");
                    return {
                        url: item.url,
                        platform: 'instagram',
                        brand: brand.name,
                        username: item.ownerUsername || brand.handle,
                        posted_at: item.timestamp,
                        snippet: `[TYPE:${postType}] ${item.caption || ''}`,
                        views: item.videoPlayCount || item.videoViewCount || 0,
                        likes: item.likesCount || 0,
                        comments: item.commentsCount || 0,
                        shares: item.sharesCount || 0
                    };
                });

            if (formatted.length > 0) {
                const { error } = await supabase
                    .from('social_mentions')
                    .upsert(formatted, { onConflict: 'url' });

                if (error) console.error(`Error saving ${brand.name}:`, error);
                else console.log(`Successfully synced ${formatted.length} IG posts for ${brand.name}`);
            }

        } catch (err) {
            console.error(`Failed to scrape IG ${brand.name}:`, err.message);
        }
    }
    console.log('\n--- IG Sync Complete ---');
}

updateInstagramOfficial();
