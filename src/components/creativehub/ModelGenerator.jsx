import React, { useState } from 'react';
import { UserPlus, Sparkles, Download, Wand2, AlertCircle } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { useUsage } from '../../hooks/useUsage';

export const ModelGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [setting, setSetting] = useState('flat_bg');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [magicLoading, setMagicLoading] = useState(false);
  const { isLimitReached } = useUsage();

  const handleRandom = async () => {
    setMagicLoading(true);
    try {
      const text = await geminiService.generateText(
        "Buatkan deskripsi fisik model fashion wanita/pria Indonesia secara acak dan detail (rambut, pakaian, pose, background). Gunakan Bahasa Indonesia yang natural dan deskriptif."
      );
      setPrompt(text.trim());
    } catch (e) {
      alert(e.message);
    } finally {
      setMagicLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResults([]);
    const newResults = [];
    
    try {
      const settingText = setting === 'flat_bg' ? "Solid flat background" : setting === 'scenic_bg' ? "Scenic outdoor background" : "Holding a generic product";
      const fullPrompt = `Professional fashion model photography. ${prompt}. ${settingText}. High quality, 4k, photorealistic.`;

      for (let i = 0; i < 4; i++) {
        const imageUrl = await geminiService.generateImage(`${fullPrompt} Variation ${i + 1}`);
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <UserPlus size={32} /> Buat Model AI
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Jelaskan model yang lo mau, atau biar AI yang berkreasi.</p>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
           <div>
             <label className="filter-label">Pengaturan Background</label>
             <select value={setting} onChange={(e) => setSetting(e.target.value)} className="glass-select">
               <option value="flat_bg">Background Flat (Studio)</option>
               <option value="scenic_bg">Background Pemandangan</option>
               <option value="with_product">Sambil megang produk</option>
             </select>
           </div>
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
               <label className="filter-label" style={{ marginBottom: 0 }}>Deskripsi Model</label>
               <button onClick={handleRandom} disabled={magicLoading} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>{magicLoading ? '...' : 'Ide Acak'}</button>
             </div>
             <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="glass-input" style={{ width: '100%', height: '120px' }} placeholder="Contoh: Model pria Indonesia tinggi, rambut rapi, kemeja putih..." />
           </div>
         </div>

         <button onClick={handleGenerate} disabled={loading || !prompt.trim() || isLimitReached} className="btn-primary" style={{ padding: '1.25rem' }}>
           {loading ? 'AI Creating Model...' : 'Buat 4 Model (Variasi Pose)'}
         </button>
      </div>

      {results.length > 0 && (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
           {results.map((url, idx) => (
             <div key={idx} className="glass-panel fade-in" style={{ padding: '0', position: 'relative', overflow: 'hidden' }}>
               <img src={url} style={{ width: '100%', aspectRatio: '3/4', objectCover: 'cover' }} />
               <a href={url} download={`model_${idx}.png`} style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'white', padding: '0.25rem', borderRadius: '4px' }}><Download size={16} color="black" /></a>
             </div>
           ))}
         </div>
      )}
    </div>
  );
};
