export default async function handler(req, res) {
  const { share_url } = req.query;

  if (!share_url) {
    return res.status(400).json({ error: 'Missing share_url' });
  }

  let decoded;
  try {
    decoded = decodeURIComponent(share_url);
    const u = new URL(decoded);
    if (!u.hostname.endsWith('tiktok.com')) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid share_url' });
  }

  try {
    // Step 1: get fresh thumbnail URL from oEmbed
    const oembedRes = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(decoded)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; oEmbed/1.0)' } }
    );
    if (!oembedRes.ok) {
      return res.status(502).json({ error: `oEmbed error: ${oembedRes.status}` });
    }
    const { thumbnail_url } = await oembedRes.json();
    if (!thumbnail_url) {
      return res.status(404).json({ error: 'No thumbnail in oEmbed response' });
    }

    // Step 2: fetch the CDN image server-side with proper Referer
    const imgRes = await fetch(thumbnail_url, {
      headers: {
        'Referer': 'https://www.tiktok.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    if (!imgRes.ok) {
      return res.status(imgRes.status).json({ error: `CDN error: ${imgRes.status}` });
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buffer = await imgRes.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('[tiktok-thumbnail]', err.message);
    return res.status(502).json({ error: 'Failed to fetch thumbnail' });
  }
}
