import React, { useState } from 'react';
import { BookOpen, PenTool, Copy, Check, Sparkles } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';

export const NarasiCerita = () => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('');
  const [format, setFormat] = useState('Script Video Pendek');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleExample = () => {
    setTopic('Perjuangan merintis usaha kopi susu dari nol yang sempat sepi berbulan-bulan, lalu akhirnya viral.');
    setStyle('Emosional, Inspiratif, Sedikit Humoris');
    setFormat('Script Video Pendek');
    setMessage('Konsistensi adalah kunci, jangan menyerah di saat paling gelap.');
    setReference('Hook: Dulu aku kira jualan kopi itu gampang...\nBody: Ternyata ekspektasi tak seindah realita...\nCTA: Buat kalian yang lagi berjuang, semangat ya!');
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const prompt = `Buatkan naskah / narasi cerita dengan detail berikut:
Topik: ${topic}
Gaya Penyampaian: ${style || 'Natural'}
Format Output: ${format}
Pesan Utama: ${message || 'Tidak ada pesan spesifik'}

${reference ? `SANGAT PENTING: Tiru gaya bahasa, struktur kalimat, dan flow dari contoh naskah berikut ini secara persis:\n"""\n${reference}\n"""\n` : ''}

Tuliskan naskahnya sekarang, langsung ke konten tanpa intro/basa-basi.`;

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
          <BookOpen size={32} /> Narasi Cerita
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Buat script atau naskah cerita yang menyentuh dan engaging.</p>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleExample}
            style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: 'var(--accent-primary)', 
              background: 'rgba(99, 102, 241, 0.05)', 
              border: '1px solid rgba(99, 102, 241, 0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Sparkles size={14} /> Isian Contoh
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem' }}>1. Topik / Ide Cerita</label>
            <textarea 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="glass-input"
              style={{ width: '100%', minHeight: '100px', padding: '1rem' }}
              placeholder="Contoh: Perjuangan barista merintis kedai kopi sendiri..."
            />
          </div>
          <div className="filter-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>2. Gaya Penyampaian</label>
            <input 
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="glass-input"
              placeholder="Contoh: Emosional, Lucu, Inspiratif"
            />
          </div>
          <div className="filter-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>3. Format Output</label>
            <select 
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="glass-select"
            >
              <option value="Script Video Pendek">Script Video Pendek (TikTok/Reels)</option>
              <option value="Thread Twitter">Thread Twitter (Kul-Twit)</option>
              <option value="Caption Instagram">Caption Instagram (Storytelling)</option>
              <option value="LinkedIn Post">LinkedIn Post (Profesional)</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem' }}>4. Pesan Utama</label>
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="glass-input"
              style={{ width: '100%' }}
              placeholder="Contoh: Jangan takut gagal, teruslah mencoba"
            />
          </div>
        </div>

        <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>5. Contoh Naskah / Referensi Gaya (Disarankan)</label>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>Tempelkan contoh naskah dengan gaya yang Anda inginkan. AI akan meniru struktur dan tone-nya.</p>
          <textarea 
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="glass-input"
            style={{ width: '100%', minHeight: '120px', background: 'var(--bg-panel)', padding: '1rem' }}
            placeholder="Paste naskah contoh di sini..."
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
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
            opacity: (loading || !topic.trim()) ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          {loading ? (
            <><div className="loader" style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Menulis Narasi...</>
          ) : (
            <><PenTool size={20} /> Buat Narasi Sesuai Gaya</>
          )}
        </button>
      </div>

      {result && (
        <div className="glass-panel fade-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Hasil Narasi</h3>
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
              {copied ? 'TERSALIN' : 'SALIN'}
            </button>
          </div>
          <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.7', fontFamily: 'Inter, sans-serif' }}>
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
