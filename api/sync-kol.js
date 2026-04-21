export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const response = await fetch('http://20.193.224.225:5050/api/trigger-sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer EJI_KOL_NGE_SYNC_2026',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ message: 'Pengambilan data sedang berjalan di background, harap tunggu.' });
      }
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ message: 'Gagal terhubung ke VPS Webhook', error: error.message });
  }
}
