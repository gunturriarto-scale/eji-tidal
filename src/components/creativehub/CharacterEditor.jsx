import React, { useState } from 'react';
import { Palette, Sparkles, Download, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { ImageUpload } from './ImageUpload';
import { useUsage } from '../../hooks/useUsage';

export const CharacterEditor = () => {
  const [charImg, setCharImg] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [bgOption, setBgOption] = useState('custom');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const { isLimitReached } = useUsage();

  const handleGenerate = async () => {
    if (!charImg || !prompt.trim()) return;

    setLoading(true);
    setResults([]);
    const newResults = [];
    
    try {
      const bg = bgOption === 'white' ? "Solid white background" : "Contextual background";
      const fullPrompt = `Edit character: ${prompt}. Maintain identity and consistent features. ${bg}. High quality, 4k, digital art style.`;

      for (let i = 0; i < 4; i++) {
        const imageUrl = await geminiService.generateImage(
          `${fullPrompt} Variation ${i + 1}`,
          [{ data: charImg.base64, mimeType: charImg.mimeType }]
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <Palette size={32} /> Edit Karakter AI
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Unggah karaktermu dan ubah gayanya atau posenya dengan konsisten.</p>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="filter-label">1. Unggah Karakter Asli</label>
            <ImageUpload value={charImg} onUpload={setCharImg} onRemove={() => setCharImg(null)} style={{ height: '250px' }} />
          </div>

          <div>
            <label className="filter-label">2. Instruksi Edit</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="glass-input" style={{ width: '100%', height: '100px' }} placeholder="Contoh: Buat karakter ini sedang memegang kamera..." />
          </div>

          <div>
             <label className="filter-label">3. Background</label>
             <select value={bgOption} onChange={(e) => setBgOption(e.target.value)} className="glass-select">
               <option value="custom">Sesuai Instruksi (Natural)</option>
               <option value="white">Putih Polos (PNG style)</option>
             </select>
          </div>

          <button onClick={handleGenerate} disabled={loading || !charImg || !prompt.trim() || isLimitReached} className="btn-primary">
            {loading ? 'AI Editing Character...' : 'Buat 4 Variasi Edit'}
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '1rem' }}>
           {results.length > 0 ? (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               {results.map((url, idx) => (
                 <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                   <img src={url} style={{ width: '100%', aspectRatio: '1/1', objectCover: 'cover' }} />
                   <a href={url} download={`char_${idx}.png`} style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'white', padding: '0.25rem', borderRadius: '4px' }}><Download size={16} color="black" /></a>
                 </div>
               ))}
             </div>
           ) : (
             <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
               <Palette size={48} />
               <span>Hasil muncul di sini</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
