import React, { useState } from 'react';
import { Image, Sparkles, Download, Wand2, AlertCircle } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { ImageUpload } from './ImageUpload';
import { useUsage } from '../../hooks/useUsage';

export const ProductPhotography = () => {
  const [images, setImages] = useState([null, null]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [magicLoading, setMagicLoading] = useState(false);
  const { isLimitReached } = useUsage();

  const handleUpload = (index, data) => {
    const newImages = [...images];
    newImages[index] = data;
    if (newImages.length < 5 && newImages.every(img => img !== null)) {
      newImages.push(null);
    }
    setImages(newImages);
  };

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    while (newImages.length < 2) newImages.push(null);
    if (newImages[newImages.length - 1] !== null && newImages.length < 5) {
      newImages.push(null);
    }
    setImages(newImages);
  };

  const handleMagicPrompt = async () => {
    const validImages = images.filter(img => img !== null);
    if (validImages.length === 0) return;
    
    setMagicLoading(true);
    try {
      const text = await geminiService.generateText(
        "Buatkan instruksi singkat untuk menggabungkan gambar-gambar ini menjadi satu komposisi yang menarik untuk iklan produk premium.",
        { data: validImages[0].base64, mimeType: validImages[0].mimeType }
      );
      setPrompt(text.trim());
    } catch (e) {
      alert(e.message);
    } finally {
      setMagicLoading(false);
    }
  };

  const handleGenerate = async () => {
    const validImages = images.filter(img => img !== null);
    if (validImages.length < 2) return;

    setLoading(true);
    setResults([]);
    const newResults = [];
    
    try {
      for (let i = 0; i < 4; i++) {
        const imageUrl = await geminiService.generateImage(
          `${prompt}. Variation ${i + 1}. High quality, professional product photography.`,
          validImages.map(img => ({ data: img.base64, mimeType: img.mimeType }))
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <Image size={32} /> Gabungkan Gambar
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Unggah 2-5 gambar, tulis instruksi, dan biarkan AI menggabungkannya.</p>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <label className="filter-label">1. Unggah Gambar (min 2, maks 5)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            {images.map((img, idx) => (
              <ImageUpload 
                key={idx}
                value={img}
                onUpload={(data) => handleUpload(idx, data)}
                onRemove={() => handleRemove(idx)}
                style={{ height: '120px' }}
                label="+"
              />
            ))}
          </div>
        </div>

        <div>
          <label className="filter-label">2. Instruksi Penggabungan</label>
          <div style={{ position: 'relative' }}>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="glass-input"
              style={{ width: '100%', minHeight: '120px' }}
              placeholder="Contoh: Gabungkan kopi dan es batu di dalam gelas dengan cipratan air..."
            />
            <button 
              onClick={handleMagicPrompt}
              disabled={magicLoading || images.filter(i => i).length === 0}
              style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }}
            >
              {magicLoading ? '...' : <Wand2 size={18} />}
            </button>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || images.filter(i => i).length < 2 || !prompt.trim() || isLimitReached}
          className="btn-primary"
          style={{ padding: '1.25rem' }}
        >
          {loading ? 'AI is Processing...' : isLimitReached ? 'Limit Tercapai' : 'Buat 4 Variasi Gabungan'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {results.map((url, idx) => (
            <div key={idx} className="glass-panel fade-in" style={{ position: 'relative', overflow: 'hidden', padding: '0' }}>
              <img src={url} style={{ width: '100%', aspectRatio: '1/1', objectCover: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}>
                <a href={url} download={`gabungan_${idx+1}.png`} className="icon-btn" style={{ background: 'white', color: 'black' }}>
                  <Download size={20} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
