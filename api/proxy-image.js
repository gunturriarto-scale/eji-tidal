export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let decoded;
  try {
    decoded = decodeURIComponent(url);
    new URL(decoded); // validate it's a real URL
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  // Only allow TikTok CDN domains
  const allowed = ['tiktokcdn.com', 'tiktokcdn-us.com', 'tiktokv.com', 'p16-common-sign.tiktokcdn.com'];
  const hostname = new URL(decoded).hostname;
  if (!allowed.some(d => hostname.endsWith(d))) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  try {
    const upstream = await fetch(decoded, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error: ${upstream.status}` });
    }

    const contentType = upstream.headers.get('content-type') || 'image/webp';
    const buffer = await upstream.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('[proxy-image]', err.message);
    return res.status(502).json({ error: 'Failed to fetch image' });
  }
}
