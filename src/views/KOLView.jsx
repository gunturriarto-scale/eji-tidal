import React, { useState } from 'react';
import { Zap, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export const KolView = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // 'success', 'error', null

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage('Menghubungi VPS Server...');
    setStatus(null);
    
    try {
      const res = await fetch('/api/sync-kol', {
        method: 'POST'
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 429) {
          setMessage(data.message || 'Proses sedang berjalan secara background.');
          setStatus('success');
        } else {
          setMessage(data.message || 'Gagal terhubung ke VPS Webhook.');
          setStatus('error');
        }
      } else {
        setMessage('Sukses! Proses Sync Apify sedang berjalan secara background (estimasi 2-5 menit). Cek Google Sheet nanti.');
        setStatus('success');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error internal: Tidak bisa menghubungi Vercel Serverless Function.');
      setStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ background: 'var(--bg-glass)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(225, 29, 72, 0.1)', padding: '12px', borderRadius: '12px', color: '#E11D48' }}>
            <Zap size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>KOL Management</h2>
            <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>TikTok & Apify Data Sync</p>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Tombol di bawah ini akan memerintahkan Server VPS secara jarak jauh untuk seketika menarik data metrik TikTok (Views, Likes, Share, dll) via <strong>Apify Actor</strong> lalu menuliskan hasilnya ke <strong>Kumpulan Google Spreadsheet Hanasui KOL</strong>.
        </p>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          style={{
            background: isSyncing ? 'var(--border-color)' : 'linear-gradient(135deg, #E11D48, #BE123C)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.3s'
          }}
        >
          {isSyncing ? (
            <><Loader2 size={18} className="spin" /> Sending Command...</>
          ) : (
            <><Zap size={18} /> FORCE MANUAL SYNC NOW</>
          )}
        </button>

        {message && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            borderRadius: '8px', 
            background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status === 'success' ? '#10B981' : '#EF4444',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
          }}>
            {status === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{message}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
