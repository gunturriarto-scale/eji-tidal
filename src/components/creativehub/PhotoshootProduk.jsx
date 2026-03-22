import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Download, Package, User, Wand2, AlertCircle } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { ImageUpload } from './ImageUpload';
import { useUsage } from '../../hooks/useUsage';

export const PhotoshootProduk = () => {
  const [tab, setTab] = useState('product');
  const [productImg, setProductImg] = useState(null);
  const [modelImg, setModelImg] = useState(null);
  
  const [lighting, setLighting] = useState('Soft Lighting');
  const [mood, setMood] = useState('Clean & Minimalist');
  const [theme, setTheme] = useState('Marble Surface');
  const [prompt, setPrompt] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [results, setResults] = useState([]);
  const { isLimitReached } = useUsage();

  const handleMagicPrompt = async () => {
    if (!productImg) return;
    setMagicLoading(true);
    try {
      const context = tab === 'product' ? 'product photography' : 'fashion photoshoot with a model';
      const text = await geminiService.generateText(
        `Create a highly detailed professional ${context} prompt. 
         Lighting: ${lighting}. 
         Mood: ${mood}. 
         Background/Theme: ${theme}. 
         Focus on high-end commercial quality, photorealistic details, and elegant composition.`,
        { data: productImg.base64, mimeType: productImg.mimeType }
      );
      setPrompt(text.trim());
    } catch (e) {
      alert(e.message);
    } finally {
      setMagicLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!productImg) return;
    if (tab === 'model' && !modelImg) return;

    setLoading(true);
    setResults([]);
    const newResults = [];
    
    try {
      const inputImages = tab === 'product' ? [productImg] : [productImg, modelImg];
      const finalPrompt = prompt.trim() || `Professional ${tab === 'product' ? 'product photography' : 'fashion photoshoot with a model'}. Lighting: ${lighting}. Mood: ${mood}. Background/Theme: ${theme}.`;

      for (let i = 0; i < 4; i++) {
        const imageUrl = await geminiService.generateImage(
          `${finalPrompt}. Variation ${i + 1}. High quality, 4k, photorealistic.`,
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
          <ShoppingBag size={32} /> Photoshoot Produk
        </h2>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setTab('product')} style={{ flex: 1, padding: '1rem', background: tab === 'product' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: 'none', color: tab === 'product' ? 'var(--accent-primary)' : 'inherit', fontWeight: 700, cursor: 'pointer' }}>Produk Saja</button>
          <button onClick={() => setTab('model')} style={{ flex: 1, padding: '1rem', background: tab === 'model' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: 'none', color: tab === 'model' ? 'var(--accent-primary)' : 'inherit', fontWeight: 700, cursor: 'pointer' }}>Produk + Model</button>
        </div>

        <div style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="filter-label" style={{ fontSize: '0.7rem' }}>Foto Produk</label>
                <ImageUpload value={productImg} onUpload={setProductImg} onRemove={() => setProductImg(null)} style={{ height: '180px' }} icon={<Package size={32} style={{ opacity: 0.2 }} />} />
              </div>
              {tab === 'model' && (
                <div>
                  <label className="filter-label" style={{ fontSize: '0.7rem' }}>Foto Model</label>
                  <ImageUpload value={modelImg} onUpload={setModelImg} onRemove={() => setModelImg(null)} style={{ height: '180px' }} icon={<User size={32} style={{ opacity: 0.2 }} />} />
                </div>
              )}
            </div>

            <div>
              <label className="filter-label">Setting Photoshoot</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['Soft Lighting', 'Studio Lighting', 'Natural Sunlight', 'Cinematic', 'Marble Surface', 'Wooden Table', 'Podium', 'Luxury Interior'].map(opt => (
                  <button 
                    key={opt} 
                    onClick={() => {
                      if (['Soft Lighting', 'Studio Lighting', 'Natural Sunlight', 'Cinematic'].includes(opt)) setLighting(opt);
                      else setTheme(opt);
                    }} 
                    className={`tag ${lighting === opt || theme === opt ? 'active' : ''}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="filter-label" style={{ marginBottom: 0 }}>Prompt Detail</label>
                <button onClick={handleMagicPrompt} disabled={magicLoading || !productImg} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>{magicLoading ? '...' : 'Generate Prompt'}</button>
              </div>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="glass-input" style={{ width: '100%', height: '100px' }} placeholder="Detail photoshoot..." />
            </div>

            <button onClick={handleGenerate} disabled={loading || !productImg || (tab === 'model' && !modelImg) || isLimitReached} className="btn-primary" style={{ padding: '1rem' }}>
              {loading ? 'AI Is Shooting...' : 'Generate 4 Photoshoot'}
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '1rem' }}>
             {results.length > 0 ? (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 {results.map((url, idx) => (
                   <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                     <img src={url} style={{ width: '100%', aspectRatio: '1/1', objectCover: 'cover' }} />
                     <a href={url} download={`ps_${idx}.png`} style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'white', padding: '0.25rem', borderRadius: '4px' }}><Download size={16} color="black" /></a>
                   </div>
                 ))}
               </div>
             ) : (
               <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                 <ShoppingBag size={48} />
                 <span>Hasil muncul di sini</span>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
