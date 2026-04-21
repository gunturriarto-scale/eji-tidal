import { Client } from 'ssh2';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const conn = new Client();
    let logsData = '';
    let isBgRunning = false;

    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        // Run two commands: check if running, and read log
        conn.exec('pgrep -f "node sync.js" > /dev/null && echo "RUNNING" || echo "STOPPED"; tail -n 35 ~/eji-kol-apify-sync/logs/sync.log || echo "Waiting for logs..."', (err, stream) => {
          if (err) return reject(err);
          
          stream.on('close', (code, signal) => {
            conn.end();
            resolve();
          }).on('data', (data) => {
            logsData += data.toString();
          }).stderr.on('data', (data) => {
            // ignore stderr for now
          });
        });
      }).on('error', (err) => {
        reject(err);
      }).connect({
        host: '20.193.224.225',
        port: 22,
        username: 'digitaldecade',
        password: '30101988',
        readyTimeout: 10000
      });
    });

    const lines = logsData.trim().split('\n');
    const statusLine = lines.shift(); // First line is RUNNING or STOPPED
    isBgRunning = (statusLine === 'RUNNING');

    return res.status(200).json({ 
      isSyncing: isBgRunning,
      logs: lines.join('\n')
    });
  } catch (error) {
    console.error('SSH Status error:', error);
    return res.status(500).json({ isSyncing: false, logs: 'Gagal menghubungi VPS via SSH: ' + error.message });
  }
}
