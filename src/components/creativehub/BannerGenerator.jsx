import React, { useState } from 'react';
import { Type, Sparkles, Download, Wand2, LayoutTemplate, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { ImageUpload } from './ImageUpload';
import { useUsage } from '../../hooks/useUsage';

export const BannerGenerator = () => {
  const [productImg, setProductImg] = useState(null);
  const [refImg, setRefImg] = useState(null);
  const [text, setText] = useState('');
  const [style, setStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [magicLoading, setMagicLoading] = useState(false);
  const { isLimitReached } = useUsage();

  const handleMagicFill = async (type) => {
    if (!productImg) return;
    setMagicLoading(true);
    try {
      const prompt = type === 'text' 
        ? "Buatkan teks iklan singkat, catchy, dan persuasif untuk banner promosi produk dalam gambar ini. Hanya teks saja, tanpa tanda kutip."
        : "Sarankan gaya desain visual (warna, mood, layout) yang cocok untuk produk ini agar terlihat premium dan menarik. Singkat saja.";
      
      const res = await geminiService.generateText(prompt, { data: productImg.base64, mimeType: productImg.mimeType });
      if (type === 'text') setText(res.trim());
      else setStyle(res.trim());
    } catch (e) {
      alert(e.message);
    } finally {
      setMagicLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!productImg) return;
    setLoading(true);
    setResults([]);
    const newResults = [];
    
    try {
      let prompt = `Professional advertisement banner design. Product shown in image. Text overlay: "${text}". Style: ${style}. High quality, 4k.`;
      const inputImages = [productImg];
      
      if (refImg) {
        inputImages.push(refImg);
        prompt += " Follow the layout and composition of the second reference image provided.";
      }

      for (let i = 0; i < 4; i++) {
        const imageUrl = await geminiService.generateImage(
          `${prompt} Variation ${i + 1}`,
          inputImages.map(img => ({ data: img.base64, mimeType: img.mimeType }))
        );
        newResults.push(imageUrl);
        setResults([...newResults]);
        if (i < 3) await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <Type size={32} /> Bikin Banner Iklan
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Gabungkan foto produk dengan teks dan desain profesional.</p>
      </div>

      <BrandBanner />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
          <div>
            <label className="filter-label">1. Gambar Produk</label>
            <ImageUpload 
              value={productImg}
              onUpload={setProductImg}
              onRemove={() => setProductImg(null)}
              style={{ height: '140px' }}
            />
          </div>

          <div>
            <label className="filter-label">2. Referensi Desain (Opsional)</label>
            <ImageUpload 
              value={refImg}
              onUpload={setRefImg}
              onRemove={() => setRefImg(null)}
              icon={<LayoutTemplate size={32} style={{ opacity: 0.3 }} />}
              style={{ height: '140px' }}
              label="Upload contoh desain"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="filter-label" style={{ marginBottom: 0 }}>3. Teks Banner</label>
              <button 
                onClick={() => handleMagicFill('text')}
                disabled={!productImg || magicLoading}
                style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}
              >
                {magicLoading ? '...' : 'Auto-Isi'}
              </button>
            </div>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="glass-input"
              style={{ width: '100%', minHeight: '80px', fontSize: '0.9rem' }}
              placeholder="Tulis teks iklan..."
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="filter-label" style={{ marginBottom: 0 }}>4. Gaya Visual</label>
              <button 
                onClick={() => handleMagicFill('style')}
                disabled={!productImg || magicLoading}
                style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}
              >
                {magicLoading ? '...' : 'Auto-Style'}
              </button>
            </div>
            <textarea 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="glass-input"
              style={{ width: '100%', minHeight: '80px', fontSize: '0.9rem' }}
              placeholder="Contoh: Modern, Minimalis, Emas..."
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !productImg || isLimitReached}
            style={{ 
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: (loading || !productImg || isLimitReached) ? 0.5 : 1
            }}
          >
            {loading ? 'Generative AI...' : isLimitReached ? 'Limit Tercapai' : 'Buat 4 Banner Premium'}
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          {results.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {results.map((url, idx) => (
                <div key={idx} className="fade-in" style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <img src={url} style={{ width: '100%', aspectRatio: '4/5', objectCover: 'cover' }} alt={`Banner ${idx}`} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                    <a href={url} download={`banner_${idx+1}.png`} style={{ padding: '1rem', background: 'white', borderRadius: '50%', color: 'black' }}>
                      <Download size={24} />
                    </a>
                  </div>
                </div>
              ))}
              {loading && results.length < 4 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', aspectRatio: '4/5', borderRadius: 'var(--radius-md)' }}>
                  <div className="loader" />
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <ImageIcon size={64} style={{ marginBottom: '1rem' }} />
              <span>Hasil banner akan muncul di sini</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
