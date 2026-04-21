export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const response = await fetch('https://eji-webhook-2026.loca.lt/api/status', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer EJI_KOL_NGE_SYNC_2026',
        'Bypass-Tunnel-Reminder': 'true'
      }
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Webhook Status error:', error);
    return res.status(500).json({ isSyncing: false, logs: 'Gagal menghubungi VPS Webhook.' });
  }
}
