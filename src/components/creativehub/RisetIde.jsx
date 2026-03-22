import React, { useState } from 'react';
import { TrendingUp, Zap, Copy, Check } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';

export const RisetIde = () => {
  const [theme, setTheme] = useState('Bisnis & Keuangan');
  const [angle, setAngle] = useState('Analisis Keuntungan & Cuan');
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const themes = [
    'Bisnis & Keuangan', 'Umum & Lifestyle', 'Kesehatan & Wellness', 
    'Teknologi & AI', 'Kuliner & Viral Food', 'Fashion & Beauty', 
    'Edukasi & Self Growth', 'Hiburan & Pop Culture'
  ];

  const angles = [
    'Analisis Keuntungan & Cuan', 'Edukasi Lucu & Relatable', 'Tips & Trik Cepat',
    'Perbandingan & Battle', 'POV & Komedi Situasi', 'Behind The Scene & Proses'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const prompt = `Lakukan riset berita dan tren ekonomi/bisnis/lifestyle yang sedang SANGAT PANAS dan VIRAL di Indonesia hari ini. 
      Tema: "${theme}". Angle Pembahasan: "${angle}".
      
      Instruksi Khusus: 
      - Jika tema adalah Bisnis, prioritaskan topik seperti: Analisis cuan Makan Bergizi Gratis (MBG), tren Lapangan Padel, perbandingan jualan Bakso/Gorengan vs Franchise.
      - Berikan data angka perkiraan (simulasi cuan) jika relevan.
      - Struktur jawaban harus rapi dengan Markdown (### untuk Header).
      
      Permintaan User: "${request || 'Berikan topik paling viral hari ini'}".`;

      const text = await geminiService.generateText(prompt);
      setResult(text);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <TrendingUp size={32} /> Riset Ide Viral & Tren
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Temukan topik panas hari ini untuk strategi Instagram & TikTok Anda.</p>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="filter-group">
          <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Pilih Tema Topik</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
            {themes.map(t => (
              <button 
                key={t}
                onClick={() => setTheme(t)}
                className={`glass-select ${theme === t ? 'active-filter' : ''}`}
                style={{ 
                  padding: '0.75rem', 
                  fontSize: '0.8rem',
                  borderColor: theme === t ? 'var(--accent-primary)' : undefined,
                  background: theme === t ? 'rgba(99, 102, 241, 0.1)' : undefined
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>2. Pilih Angle Pembahasan</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {angles.map(a => (
              <button 
                key={a}
                onClick={() => setAngle(a)}
                className={`glass-select ${angle === a ? 'active-filter' : ''}`}
                style={{ 
                  padding: '0.75rem', 
                  fontSize: '0.8rem',
                  borderColor: angle === a ? 'var(--accent-primary)' : undefined,
                  background: angle === a ? 'rgba(99, 102, 241, 0.1)' : undefined
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>3. Permintaan Khusus (Opsional)</label>
          <textarea 
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            className="glass-input"
            style={{ minHeight: '120px', resize: 'vertical', width: '100%', padding: '1rem' }}
            placeholder="Contoh: Cari berita tentang Makan Bergizi Gratis (MBG) atau bisnis Lapangan Padel yang lagi hot..."
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading}
          style={{ 
            marginTop: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
            border: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          {loading ? (
            <><div className="loader" style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Menganalisis Tren...</>
          ) : (
            <><Zap size={20} fill="currentColor" /> Riset Ide Viral Sekarang</>
          )}
        </button>
      </div>

      {result && (
        <div className="glass-panel fade-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>📊 Strategi Konten Panas</h3>
            <button 
              onClick={handleCopy}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-tertiary)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              {copied ? 'TERSALIN' : 'SALIN SEMUA'}
            </button>
          </div>
          <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
            {result}
          </div>
        </div>
      )}

      {/* Basic spin animation for loader */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
