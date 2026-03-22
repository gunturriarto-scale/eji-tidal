import React, { useState } from 'react';
import { SmilePlus, Sparkles, Download, Smile, Frown, Angry, Laugh, Meh, AlertCircle as AlertIcon } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { ImageUpload } from './ImageUpload';
import { useUsage } from '../../hooks/useUsage';

export const ExpressionChanger = () => {
  const [modelImg, setModelImg] = useState(null);
  const [expression, setExpression] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const { isLimitReached } = useUsage();

  const expressions = [
    { id: 'Senang', name: 'Senang', icon: Smile },
    { id: 'Sedih', name: 'Sedih', icon: Frown },
    { id: 'Marah', name: 'Marah', icon: Angry },
    { id: 'Terkejut', name: 'Kaget', icon: AlertIcon },
    { id: 'Tertawa', name: 'Tawa', icon: Laugh },
    { id: 'Menangis', name: 'Nangis', icon: Meh },
  ];

  const handleGenerate = async () => {
    if (!modelImg || !expression.trim()) return;
    setLoading(true);
    setResults([]);
    const newResults = [];
    
    try {
      const prompt = `Change the facial expression of the person in this image to: ${expression}. Maintain identity, lighting, and background.`;
      for (let i = 0; i < 3; i++) {
        const imageUrl = await geminiService.generateImage(
          `${prompt} Variation ${i + 1}`,
          [{ data: modelImg.base64, mimeType: modelImg.mimeType }]
        );
        newResults.push(imageUrl);
        setResults([...newResults]);
        if (i < 2) await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <SmilePlus size={32} /> Ubah Ekspresi Wajah
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Ubah ekspresi wajah model Anda dengan instan.</p>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="filter-label">1. Unggah Foto Wajah</label>
            <ImageUpload value={modelImg} onUpload={setModelImg} onRemove={() => setModelImg(null)} style={{ height: '300px' }} />
          </div>

          <div>
             <label className="filter-label">2. Pilih Ekspresi</label>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
               {expressions.map(e => (
                 <button 
                   key={e.id} 
                   onClick={() => setExpression(e.id)} 
                   className={`tag ${expression === e.id ? 'active' : ''}`}
                   style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                 >
                   <e.icon size={12} /> {e.name}
                 </button>
               ))}
             </div>
             <input value={expression} onChange={(e) => setExpression(e.target.value)} className="glass-input" style={{ marginTop: '1rem' }} placeholder="Ekspresi kustom..." />
          </div>

          <button onClick={handleGenerate} disabled={loading || !modelImg || !expression.trim() || isLimitReached} className="btn-primary">
            {loading ? 'AI Changing Faces...' : 'Ubah Ekspresi'}
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '1rem' }}>
           {results.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {results.map((url, idx) => (
                 <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                   <img src={url} style={{ width: '100%', aspectRatio: '1/1', objectCover: 'cover' }} />
                   <a href={url} download={`face_${idx}.png`} style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'white', padding: '0.25rem', borderRadius: '4px' }}><Download size={16} color="black" /></a>
                 </div>
               ))}
             </div>
           ) : (
             <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
               <SmilePlus size={48} />
               <span>Hasil muncul di sini</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
