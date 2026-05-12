/**
 * Test Apify TikTok Scraper with video URL + keyword
 */
const TOKEN = process.env.APIFY_TOKEN || '';

async function startRun() {
  console.log('🚀 Starting Apify TikTok scrape...\n');

  // Test with 3 different video URLs (TikTok video posts)
  const testVideos = [
    'https://www.tiktok.com/@itstiaraannisa/video/7237491176460715329',
    'https://www.tiktok.com/@rubyra6/video/7590363677056961810',
    'https://www.tiktok.com/@kellygracia_/video/7590364533697301767',
  ];

  const startResp = await fetch(
    'https://api.apify.com/v2/acts/apidojo~tiktok-scraper/runs',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startUrls: testVideos.map(url => ({ url })),
        keywords: ['skincare', 'bodycare', 'fashion'], // keyword needed per actor docs
        maxItems: 50,
        sortType: 'MOST_LIKED',
        location: 'ID',
      }),
    }
  );

  const startData = await startResp.json();
  if (!startData.data?.id) {
    console.error('❌ Failed to start run:', startData);
    return;
  }

  const runId = startData.data.id;
  console.log('Run ID:', runId);

  // Poll
  let attempts = 0;
  while (attempts < 30) {
    await new Promise(r => setTimeout(r, 5000));

    const statusResp = await fetch(
      `https://api.apify.com/v2/acts/apidojo~tiktok-scraper/runs/${runId}`,
      { headers: { 'Authorization': `Bearer ${TOKEN}` } }
    );
    const statusData = await statusResp.json();
    const status = statusData.data?.status;
    const datasetId = statusData.data?.defaultDatasetId;

    console.log(`  [${attempts + 1}] ${status}${datasetId ? ` | dataset: ${datasetId.slice(0,8)}` : ''}`);

    if (status === 'SUCCEEDED') {
      console.log('\n✅ Done! Getting results...');

      const itemsResp = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${TOKEN}&limit=10`
      );
      const text = await itemsResp.text();
      let items;
      try { items = JSON.parse(text); } catch { items = []; }

      console.log('\n📦 Got', items.length, 'results');
      const successItems = items.filter(i => !i.noResults);

      console.log('\n✅ Success:', successItems.length);
      successItems.forEach((item, idx) => {
        console.log(`  [${idx + 1}] ${item.id || 'unknown'}`);
        console.log(`       title: ${(item.title || '').slice(0, 60)}...`);
        console.log(`       views: ${item.views?.toLocaleString()}`);
        console.log(`       likes: ${item.likes?.toLocaleString()}`);
        console.log(`       comments: ${item.comments?.toLocaleString()}`);
        console.log(`       shares: ${item.shares?.toLocaleString()}`);
        console.log(`       bookmarks: ${item.bookmarks?.toLocaleString()}`);
        console.log(`       video: ${item.video?.playAddr || item.video?.url || 'N/A'}`);
      });

      const noRes = items.filter(i => i.noResults).length;
      if (noRes > 0) console.log(`\n❌ noResults: ${noRes}`);

      // Show run cost
      const costResp = await fetch(
        `https://api.apify.com/v2/acts/apidojo~tiktok-scraper/runs/${runId}`,
        { headers: { 'Authorization': `Bearer ${TOKEN}` } }
      );
      const costData = await costResp.json();
      console.log('\n💰 Cost: $' + (costData.data?.usageTotalUsd || 0).toFixed(6));
      return;
    }

    if (status === 'FAILED' || status === 'ABORTED') {
      console.error('❌ Run failed:', status, statusData.data?.errorMessage || '');
      return;
    }

    attempts++;
  }

  console.log('⏰ Timeout');
}

startRun().catch(console.error);