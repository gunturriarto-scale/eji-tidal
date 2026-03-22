import React, { useState } from 'react';
import { Mic, Play, Download, Volume2 } from 'lucide-react';
import { geminiService } from '../../services/gemini';
import { BrandBanner } from './BrandBanner';

export const VoiceOverGenerator = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const voices = [
    { id: 'Kore', name: 'Kore (Wanita, Tenang)' },
    { id: 'Puck', name: 'Puck (Pria, Energik)' },
    { id: 'Charon', name: 'Charon (Pria, Berat)' },
    { id: 'Fenrir', name: 'Fenrir (Pria, Cepat)' },
    { id: 'Leda', name: 'Leda (Wanita, Lembut)' },
    { id: 'Zephyr', name: 'Zephyr (Wanita, Jernih)' },
    { id: 'Aoede', name: 'Aoede (Wanita, Elegan)' },
    { id: 'Orus', name: 'Orus (Pria, Berwibawa)' },
  ];

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setAudioUrl(null);
    try {
      const url = await geminiService.generateSpeech(text, voice, instruction);
      setAudioUrl(url);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <Mic size={32} /> Buat Voice Over
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Ubah teks menjadi suara profesional dengan AI.</p>
      </div>

      <BrandBanner />

      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <label className="filter-label">1. Naskah Voice Over</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="glass-input"
            style={{ width: '100%', minHeight: '150px' }}
            placeholder="Tulis naskah iklannya di sini..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <label className="filter-label">2. Pilih Suara</label>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="glass-select">
              {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="filter-label">3. Gaya Bicara</label>
            <input value={instruction} onChange={(e) => setInstruction(e.target.value)} className="glass-input" placeholder="Contoh: Semangat, berbisik..." />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || !text.trim()} className="btn-primary" style={{ padding: '1.25rem' }}>
          {loading ? 'Generating Audio...' : 'Generate Audio'}
        </button>

        {audioUrl && (
          <div className="fade-in" style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Hasil Audio</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <audio src={audioUrl} controls style={{ width: '100%', maxWidth: '400px' }} />
              <a href={audioUrl} download="vo.wav" className="tag" style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '20px' }}><Download size={14} style={{ marginRight: '0.5rem' }} /> Download Audio</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
