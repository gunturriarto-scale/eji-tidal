import React, { useState } from 'react';
import { FileText, Sparkles, Copy, Check, Lightbulb, Image as ImageIcon } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { ImageUpload } from './ImageUpload';

export const AdCopyGenerator = () => {
  const [tab, setTab] = useState('manual');
  const [productName, setProductName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Profesional');
  const [outputType, setOutputType] = useState('Caption Instagram');
  const [manualImg, setManualImg] = useState(null);
  const [designImg, setDesignImg] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const handleGetRecommendations = async () => {
    if (!manualImg) return;
    setRecLoading(true);
    try {
      const text = await geminiService.generateText(
        "Berdasarkan gambar produk ini, berikan 3 ide caption singkat dan 3 ide visual photoshoot yang menarik. Format: Ide 1: ..., Ide 2: ...",
        { data: manualImg.base64, mimeType: manualImg.mimeType }
      );
      setRecommendations(text.split('\n').filter(t => t.trim()));
    } catch (e) {
      alert(e.message);
    } finally {
      setRecLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      let prompt = "";
      let img = null;

      if (tab === 'manual') {
        prompt = `Buatkan ${outputType} untuk produk bernama "${productName}".
Kata Kunci: ${keywords}
Gaya Bahasa: ${tone}.
Berikan hasil yang kreatif, menarik, dan menggunakan formatting yang rapi.`;
        img = manualImg;
      } else {
        prompt = `Berdasarkan desain iklan ini, buatkan 3 opsi caption yang menarik dengan gaya bahasa ${tone}.`;
        img = designImg;
      }

      const text = await geminiService.generateText(
        prompt, 
        img ? { data: img.base64, mimeType: img.mimeType } : undefined
      );
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
          <FileText size={32} /> Bikin Caption & Ide
        </h2>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={() => setTab('manual')}
            style={{ 
              flex: 1, 
              padding: '1.25rem', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              border: 'none',
              background: tab === 'manual' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: tab === 'manual' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              borderBottom: tab === 'manual' ? '2px solid var(--accent-primary)' : 'none'
            }}
          >
            Buat Manual
          </button>
          <button 
            onClick={() => setTab('design')}
            style={{ 
              flex: 1, 
              padding: '1.25rem', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              border: 'none',
              background: tab === 'design' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: tab === 'design' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              borderBottom: tab === 'design' ? '2px solid var(--accent-primary)' : 'none'
            }}
          >
            Buat dari Desain
          </button>
        </div>

        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {tab === 'manual' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem' }}>1. Unggah Foto Produk (Opsional)</label>
                <ImageUpload 
                  value={manualImg}
                  onUpload={setManualImg}
                  onRemove={() => setManualImg(null)}
                  style={{ height: '180px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="filter-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>2. Nama Produk</label>
                  <input 
                    type="text" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="glass-input"
                    placeholder="Contoh: Kopi Susu Gula Aren"
                  />
                </div>
                <div className="filter-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>3. Kata Kunci</label>
                  <input 
                    type="text" 
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="glass-input"
                    placeholder="Contoh: Segar, Murah, Viral"
                  />
                </div>
                <div className="filter-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>4. Gaya Bahasa</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)} className="glass-select">
                    <option value="Profesional">Profesional</option>
                    <option value="Santai">Santai</option>
                    <option value="Inspiratif">Inspiratif</option>
                    <option value="Humoris">Humoris</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>5. Jenis Teks</label>
                  <select value={outputType} onChange={(e) => setOutputType(e.target.value)} className="glass-select">
                    <option value="Caption Instagram">Caption Instagram</option>
                    <option value="Deskripsi Produk">Deskripsi Produk</option>
                    <option value="Script Iklan TikTok">Script Iklan TikTok</option>
                  </select>
                </div>
              </div>
              
              {manualImg && (
                <button 
                  onClick={handleGetRecommendations}
                  disabled={recLoading}
                  style={{ 
                    padding: '0.75rem', 
                    background: 'rgba(99, 102, 241, 0.05)', 
                    color: 'var(--accent-primary)', 
                    border: '1px solid rgba(99, 102, 241, 0.2)', 
                    borderRadius: 'var(--radius-sm)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  {recLoading ? <div className="loader" style={{ width: '1rem', height: '1rem', border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Lightbulb size={16} />}
                  Dapatkan Rekomendasi AI dari Gambar
                </button>
              )}

              {recommendations.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {recommendations.map((rec, i) => (
                    <p key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>• {rec}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px', margin: '0 auto', width: '100%' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' }}>1. Unggah Desain Iklan</label>
                <ImageUpload 
                  value={designImg}
                  onUpload={setDesignImg}
                  onRemove={() => setDesignImg(null)}
                  icon={<ImageIcon size={40} style={{ color: 'var(--text-tertiary)' }} />}
                  style={{ height: '240px' }}
                />
              </div>
              <div className="filter-group">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>2. Gaya Bahasa</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="glass-select">
                  <option value="Profesional">Profesional</option>
                  <option value="Santai">Santai</option>
                  <option value="Inspiratif">Inspiratif</option>
                </select>
              </div>
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={loading || (tab === 'manual' && !productName.trim()) || (tab === 'design' && !designImg)}
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
              opacity: (loading || (tab === 'manual' && !productName.trim()) || (tab === 'design' && !designImg)) ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? <div className="loader" style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Sparkles size={20} />}
            Buat Teks Iklan
          </button>
        </div>
      </div>

      {result && (
        <div className="glass-panel fade-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Hasil Teks Iklan</h3>
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
