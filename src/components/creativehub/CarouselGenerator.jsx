import React, { useState } from 'react';
import { LayoutGrid, Sparkles, Download, Wand2, Info, RefreshCw, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';
import { ImageUpload } from './ImageUpload';
import { useUsage } from '../../hooks/useUsage';

export const CarouselGenerator = () => {
  const [productImg, setProductImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const [refImg, setRefImg] = useState(null);
  
  const [desc, setDesc] = useState('');
  const [style, setStyle] = useState('Modern Minimalist');
  const [slideCount, setSlideCount] = useState(4);
  const [focus, setFocus] = useState('Hardselling');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState([]);
  const [magicLoading, setMagicLoading] = useState(false);
  const { isLimitReached } = useUsage();

  const handleMagicDesc = async () => {
    if (!productImg) return;
    setMagicLoading(true);
    try {
      const text = await geminiService.generateText(
        "Buatkan deskripsi produk singkat dan menarik untuk caption Instagram berdasarkan gambar ini.",
        { data: productImg.base64, mimeType: productImg.mimeType }
      );
      setDesc(text.trim());
    } catch (e) {
      alert(e.message);
    } finally {
      setMagicLoading(false);
    }
  };

  const handleGenerateConcept = async () => {
    if (!productImg || !desc.trim()) return;
    setLoading(true);
    try {
      const planPrompt = `Buatkan rencana konten carousel Instagram (${slideCount} slide) untuk produk ini.
      Deskripsi: ${desc}
      Gaya: ${style}
      Fokus: ${focus}
      Output format JSON array yang valid: [{"slide": 1, "text_overlay": "Headline singkat", "visual_prompt": "deskripsi gambar detail untuk AI image generator"}]`;
      
      const planTextRaw = await geminiService.generateText(
        planPrompt,
        { data: productImg.base64, mimeType: productImg.mimeType }
      );
      
      const jsonMatch = planTextRaw.match(/\[.*\]/s);
      if (jsonMatch) {
        const parsedSlides = JSON.parse(jsonMatch[0]);
        setSlides(parsedSlides);
      } else {
        throw new Error("Gagal membuat konsep. Format tidak valid.");
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSingleSlide = async (idx) => {
    const slide = slides[idx];
    const newSlides = [...slides];
    newSlides[idx] = { ...slide, loading: true };
    setSlides(newSlides);

    try {
      let fullPrompt = `Instagram carousel slide. Style: ${style}. ${slide.visual_prompt}. IMPORTANT: Image MUST contain text: "${slide.text_overlay}". High quality.`;
      const inputImages = [productImg];
      if (logoImg) inputImages.push(logoImg);
      if (refImg) inputImages.push(refImg);

      const imageUrl = await geminiService.generateImage(fullPrompt, inputImages.map(img => ({ data: img.base64, mimeType: img.mimeType })));
      
      const updatedSlides = [...slides];
      updatedSlides[idx] = { ...slide, imageUrl, loading: false };
      setSlides(updatedSlides);
    } catch (e) {
      alert(e.message);
      const updatedSlides = [...slides];
      updatedSlides[idx] = { ...slide, loading: false };
      setSlides(updatedSlides);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <LayoutGrid size={32} /> Generator Feed Carousel
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Buat konsep dan desain carousel Instagram dalam hitungan detik.</p>
      </div>

      <BrandBanner />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="filter-label" style={{ fontSize: '0.7rem' }}>1. Foto Produk</label>
              <ImageUpload 
                value={productImg}
                onUpload={setProductImg}
                onRemove={() => setProductImg(null)}
                style={{ height: '100px' }}
                label="+"
              />
            </div>
            <div>
              <label className="filter-label" style={{ fontSize: '0.7rem' }}>2. Logo</label>
              <ImageUpload 
                value={logoImg}
                onUpload={setLogoImg}
                onRemove={() => setLogoImg(null)}
                style={{ height: '100px' }}
                label="+"
              />
            </div>
            <div>
              <label className="filter-label" style={{ fontSize: '0.7rem' }}>3. Ref. Desain</label>
              <ImageUpload 
                value={refImg}
                onUpload={setRefImg}
                onRemove={() => setRefImg(null)}
                style={{ height: '100px' }}
                label="+"
              />
            </div>
          </div>

          <div>
            <label className="filter-label">4. Deskripsi Produk/Tema</label>
            <div style={{ position: 'relative' }}>
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="glass-input"
                style={{ width: '100%', minHeight: '100px', paddingRight: '3rem' }}
                placeholder="Tema carousel lo..."
              />
              <button 
                onClick={handleMagicDesc}
                disabled={!productImg || magicLoading}
                style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' }}
              >
                {magicLoading ? '...' : <Wand2 size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="filter-label" style={{ fontSize: '0.7rem' }}>5. Gaya</label>
              <input type="text" value={style} onChange={(e) => setStyle(e.target.value)} className="glass-input" />
            </div>
            <div>
              <label className="filter-label" style={{ fontSize: '0.7rem' }}>6. Slide</label>
              <input type="number" value={slideCount} onChange={(e) => setSlideCount(parseInt(e.target.value))} className="glass-input" min="2" max="10" />
            </div>
          </div>

          <button 
            onClick={handleGenerateConcept}
            disabled={loading || !productImg || !desc.trim()}
            className="btn-primary"
            style={{ padding: '1.25rem' }}
          >
            {loading ? 'Thinking...' : 'Buat Konsep Carousel'}
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem', maxHeight: '800px', overflowY: 'auto' }}>
          {slides.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                Pro Tip: Klik "Generate Slide Ini" buat dapetin desain per slide.
              </div>
              {slides.map((slide, idx) => (
                <div key={idx} style={{ paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 700, opacity: 0.5 }}>SLIDE {slide.slide}</span>
                    <button 
                      onClick={() => handleGenerateSingleSlide(idx)}
                      disabled={slide.loading}
                      style={{ color: 'var(--accent-primary)', background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {slide.loading ? 'Designing...' : 'Generate Slide Ini'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input value={slide.text_overlay} className="glass-input" style={{ fontSize: '0.8rem' }} />
                      <textarea value={slide.visual_prompt} className="glass-input" style={{ fontSize: '0.7rem', minHeight: '60px' }} />
                    </div>
                    <div style={{ background: '#000', borderRadius: '12px', aspectRatio: '1/1', overflow: 'hidden' }}>
                      {slide.imageUrl ? <img src={slide.imageUrl} style={{ width: '100%' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}><ImageIcon /></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <LayoutGrid size={64} style={{ marginBottom: '1rem' }} />
              <span>Konsep carousel muncul di sini</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
