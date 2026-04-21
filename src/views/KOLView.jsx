import React, { useState, useEffect, useRef } from 'react';
import { Zap, Loader2, CheckCircle, AlertTriangle, Terminal } from 'lucide-react';

export const KOLView = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); 
  const [logs, setLogs] = useState('');
  
  const logsEndRef = useRef(null);

  // Auto scroll logs down
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Polling logs if syncing
  useEffect(() => {
    let interval;
    if (isSyncing) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/status-kol');
          const data = await res.json();
          if (data.logs) {
            setLogs(data.logs);
          }
          if (data.isSyncing === false) {
            // Processing done
            setIsSyncing(false);
            setMessage('Proses Sync Selesai! Data berhasil ditulis ke Spreadsheets.');
            setStatus('success');
          }
        } catch (e) {
          console.error("Error polling logs", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSyncing]);

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage('Menghubungi Server Eksekutor...');
    setStatus(null);
    setLogs('Menyiapkan instance bot...');
    
    try {
      const res = await fetch('/api/sync-kol', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 429) {
          setMessage('Melanjutkan pemantauan log proses yang sedang berjalan.');
          setStatus('success');
        } else {
          setMessage(data.message || 'Gagal terhubung ke VPS Webhook.');
          setStatus('error');
          setIsSyncing(false);
        }
      } else {
        setMessage('Proses penarikan data Apify dimulai.');
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
            <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>TikTok & Apify Live Runner</p>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Tombol di bawah ini akan memerintahkan Server VPS secara jarak jauh untuk menarik data metrik TikTok (Views, Likes, Share, dll) via <strong>Apify Actor</strong> lalu menuliskan hasilnya ke <strong>Kumpulan Google Spreadsheet Hanasui KOL</strong>. Proses memakan waktu 2-5 menit berdasarkan log Terminal di bawah.
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
            <><Loader2 size={18} className="spin" /> Executing Background Process...</>
          ) : (
            <><Zap size={18} /> RUN MANUAL SYNC NOW</>
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

        <div style={{ 
          marginTop: '2rem', 
          background: '#0F172A', 
          borderRadius: '8px', 
          border: '1px solid #1E293B',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '8px 12px', background: '#1E293B', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} color="#94A3B8" />
            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'monospace', fontWeight: 600 }}>VPS TERMINAL LOGS</span>
            {isSyncing && <Loader2 size={12} color="#10B981" className="spin" style={{ marginLeft: 'auto' }} />}
          </div>
          <div style={{ 
            padding: '12px', 
            fontFamily: 'monospace', 
            fontSize: '0.8rem', 
            color: '#A7F3D0', 
            height: '250px', 
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6
          }}>
            {logs || 'Terminal is silent. Click RUN MANUAL SYNC to awake.'}
            <div ref={logsEndRef} />
          </div>
        </div>
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
