/**
 * scripts/webhook-proxy.js
 *
 * Simple HTTP proxy that listens on port 3100 (already publicly accessible)
 * and forwards /webhook requests to localhost:9090 (webhook-processor).
 *
 * Usage:
 *   node scripts/webhook-proxy.js
 *   (starts automatically via nohup when webhook-processor.js starts)
 */

const http = require('http');

const PROXY_PORT = 3100;
const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 9090;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PROXY_PORT}`);

  if (req.method === 'POST' && url.pathname === '/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
  } else if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', proxy: true, time: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', proxy: true }));
  }
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`\n🔀 Webhook proxy listening on port ${PROXY_PORT} → localhost:${TARGET_PORT}`);
  console.log(`   Forwarding: http://20.193.224.225:${PROXY_PORT}/webhook`);
});

server.on('error', err => {
  console.error('Proxy server error:', err);
  process.exit(1);
});
