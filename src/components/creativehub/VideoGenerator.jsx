import React from 'react';
import { BrandBanner } from './BrandBanner';
import { Video, ExternalLink, PlayCircle, Info } from 'lucide-react';

const platforms = [
  {
    name: 'Gemini',
    link: 'https://gemini.google.com/app',
    tutorial: 'https://youtu.be/bbsygrmRqMs?si=jSrCdPtsubSBRSkC',
    description: 'AI multimodal dari Google yang mendukung pembuatan skrip dan ide video kreatif.'
  },
  {
    name: 'Grok Ai',
    link: 'https://grok.com',
    tutorial: 'https://youtu.be/Pq4VWxd98ns?si=q7PdTB0bDjWTDhV0',
    description: 'AI dari xAI (Elon Musk) yang terintegrasi dengan data real-time dari platform X.'
  },
  {
    name: 'Gemini Flow',
    link: 'https://labs.google/fx/tools/flow',
    tutorial: 'https://youtu.be/l7PiIiPP84o?si=zrn8ZgdZ7vcv7wz9',
    description: 'Alat eksperimental dari Google Labs untuk alur kerja kreatif berbasis AI.'
  },
  {
    name: 'Pixverse AI',
    link: 'https://app.pixverse.ai/onboard',
    tutorial: 'https://youtu.be/iCeI1MX-WdQ?si=ndFOBfvVSc8pd7N-',
    description: 'Platform khusus untuk generate video sinematik berkualitas tinggi dari teks atau gambar.'
  },
  {
    name: 'Meta AI',
    link: 'https://www.meta.ai',
    tutorial: 'https://www.youtube.com/watch?v=DC3sDw8kAyo&feature=youtu.be',
    description: 'Asisten AI dari Meta yang mendukung berbagai pembuatan konten kreatif di ekosistem Facebook/Instagram.'
  }
];

export const VideoGenerator = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }} className="gradient-text">
          <Video size={32} /> Generate Video AI
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Akses platform terbaik untuk membuat video AI dan pelajari cara penggunaannya.</p>
      </div>

      <BrandBanner />

      <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '15px', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.9rem', textAlign: 'center' }}>
        Pake tools di bawah ini buat bikin video AI profesional. Udah ada link langsung & tutorialnya.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {platforms.map((platform, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '12px' }}><Video size={24} color="var(--accent-primary)" /></div>
              <span style={{ fontSize: '0.6rem', opacity: 0.3, fontWeight: 700 }}>#{idx+1}</span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{platform.name}</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.6, flex: 1 }}>{platform.description}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
               <a href={platform.link} target="_blank" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>Buka Platform</a>
               <a href={platform.tutorial} target="_blank" className="tag" style={{ textAlign: 'center', textDecoration: 'none' }}>Tutorial Video</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
