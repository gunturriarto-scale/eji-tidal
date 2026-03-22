import React from 'react';

export const BrandBanner = () => {
  return (
    <div className="w-full flex justify-center py-4 px-2 overflow-hidden">
      <div className="max-w-3xl w-full glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '2rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)' }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.05em', opacity: 0.6 }}>#FYNE</span>
        <span style={{ color: 'white', fontFamily: 'serif', fontSize: '1.1rem', letterSpacing: '0.2em', opacity: 0.6 }}>HANASUI</span>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '1.25rem', opacity: 0.6 }}>Eomma</span>
        <span style={{ color: 'white', fontSize: '1.5rem', letterSpacing: '-0.05em', opacity: 0.6 }}>N°CO</span>
      </div>
    </div>
  );
};
