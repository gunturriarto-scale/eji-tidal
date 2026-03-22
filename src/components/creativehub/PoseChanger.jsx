import React, { useState } from 'react';
import { UserCog, Sparkles, Download, User, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { ImageUpload } from './ImageUpload';
import { useUsage } from '../../hooks/useUsage';

export const PoseChanger = () => {
  const [tab, setTab] = useState('text');
  const [modelImg, setModelImg] = useState(null);
  const [refImg, setRefImg] = useState(null);
  const [posePrompt, setPosePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const { isLimitReached } = useUsage();

  const handleGenerate = async () => {
    if (!modelImg) return;
    if (tab === 'image' && !refImg) return;
    if (tab === 'text' && !posePrompt.trim()) return;

    setLoading(true);
    setResults([]);
    const newResults = [];
    
    try {
      const prompt = tab === 'text'
        ? `Change the pose of the person in this image to: ${posePrompt}. Maintain identity and background.`
        : `Change the pose of the person in the first image to match the pose in the second image. Maintain identity of the first person.`;

      const inputImages = tab === 'text' ? [modelImg] : [modelImg, refImg];

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
          <UserCog size={32} /> Ubah Pose Model
        </h2>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setTab('text')} style={{ flex: 1, padding: '1rem', background: tab === 'text' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: 'none', color: tab === 'text' ? 'var(--accent-primary)' : 'inherit', fontWeight: 700, cursor: 'pointer' }}>Pose (Teks)</button>
          <button onClick={() => setTab('image')} style={{ flex: 1, padding: '1rem', background: tab === 'image' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', border: 'none', color: tab === 'image' ? 'var(--accent-primary)' : 'inherit', fontWeight: 700, cursor: 'pointer' }}>Pose (Gambar)</button>
        </div>

        <div style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: tab === 'image' ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
               <div>
                 <label className="filter-label" style={{ textAlign: 'center' }}>Foto Original</label>
                 <ImageUpload value={modelImg} onUpload={setModelImg} onRemove={() => setModelImg(null)} style={{ height: '300px' }} />
               </div>
               {tab === 'image' && (
                 <div>
                   <label className="filter-label" style={{ textAlign: 'center' }}>Referensi Pose</label>
                   <ImageUpload value={refImg} onUpload={setRefImg} onRemove={() => setRefImg(null)} style={{ height: '300px' }} icon={<ImageIcon size={32} style={{ opacity: 0.2 }} />} />
                 </div>
               )}
            </div>

            {tab === 'text' && (
              <div>
                <label className="filter-label">Instruksi Pose</label>
                <input value={posePrompt} onChange={(e) => setPosePrompt(e.target.value)} className="glass-input" placeholder="Contoh: Sedang memegang kopi, menunjuk ke kanan..." />
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading || !modelImg || (tab === 'image' && !refImg) || (tab === 'text' && !posePrompt.trim()) || isLimitReached} className="btn-primary" style={{ padding: '1.25rem' }}>
              {loading ? 'AI Re-posing...' : 'Ubah Pose'}
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '1rem' }}>
             {results.length > 0 ? (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 {results.map((url, idx) => (
                   <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                     <img src={url} style={{ width: '100%', aspectRatio: '3/4', objectCover: 'cover' }} />
                     <a href={url} download={`pose_${idx}.png`} style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'white', padding: '0.25rem', borderRadius: '4px' }}><Download size={16} color="black" /></a>
                   </div>
                 ))}
               </div>
             ) : (
               <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                 <UserCog size={48} />
                 <span>Pose baru muncul di sini</span>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
