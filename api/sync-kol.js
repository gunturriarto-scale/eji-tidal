import { Client } from 'ssh2';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const conn = new Client();
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        // Run sync in detached background mode and immediately resolve
        conn.exec('cd ~/eji-kol-apify-sync && npm install && echo "--- SYNC STARTED VIA SSH ---" > logs/sync.log && nohup node sync.js >> logs/sync.log 2>&1 &', (err, stream) => {
          if (err) return reject(err);
          // Don't wait for execution to finish, just resolve
          resolve();
          conn.end();
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

    return res.status(200).json({ message: 'Proses penarikan data Apify dimulai di background VPS.' });
  } catch (error) {
    console.error('SSH Webhook error:', error);
    return res.status(500).json({ message: 'Gagal menghubungi VPS via SSH', error: error.message });
  }
}
