import React, { useState } from 'react';
import { Zap, Loader2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export const KolView = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); 

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage('Mengontak Apify Cloud Pipeline...');
    setStatus(null);
    
    try {
      const res = await fetch('/api/start-apify', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        setMessage((data.message || 'Gagal memulai Apify.') + (data.error ? ' Detail: ' + data.error : ''));
        setStatus('error');
        setIsSyncing(false);
      } else {
        setMessage('✅ Sinyal dilesatkan! Robot Apify sedang berlari di background. Silahkan cek link Spreadsheet di bawah secara berkala ya, proses ini biasanya memakan waktu sekitar 3-5 menit.');
        setStatus('success');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error internal: Tidak bisa menghubungi Vercel Serverless Function.');
      setStatus('error');
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
            <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Full Vercel Serverless Sync</p>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Berhubung proses ini sudah dipindahkan ke Vercel 100% tanpa batas waktu (Serverless), tombol ini hanya akan men-trigger Cloud API Apify dan menyelesaikannya secara asinkron.
          <br /><br />
          Data akan otomatis ditulis ke <strong>Kumpulan Google Spreadsheet Hanasui KOL</strong> saat robot selesai.
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            {isSyncing && status !== 'success' ? (
              <><Loader2 size={18} className="spin" /> Triggering Background Process...</>
            ) : (
              <><Zap size={18} /> RUN MANUAL SYNC NOW</>
            )}
          </button>

          <a 
            href="https://docs.google.com/spreadsheets/d/1o3Xt5Dv0cxHxdG2C8vja29X7Co8Lmpm2DsVYC8ldcx8" 
            target="_blank" 
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', 
              color: '#34D399', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
              padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)',
              background: 'rgba(52, 211, 153, 0.05)'
            }}
          >
            Buka Spreadsheet <ExternalLink size={16} />
          </a>
        </div>

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
            {status === 'success' ? <CheckCircle size={20} style={{ flexShrink: 0 }} /> : <AlertTriangle size={20} style={{ flexShrink: 0 }} />}
            <span style={{ fontSize: '0.95rem', lineHeight: 1.5, fontWeight: 500 }}>{message}</span>
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
