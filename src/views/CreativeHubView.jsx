import React from 'react';
import { Zap } from 'lucide-react';

export const CreativeHubView = () => {
  return (
    <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', maxWidth: '500px' }}>
        <Zap size={56} style={{ color: '#14B8A6', marginBottom: '1.5rem', opacity: 0.8 }} />
        <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>AI Creative Hub</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Fitur sedang dalam pengembangan.<br />Segera hadir dengan kemampuan AI generatif terbaru.
        </p>
        <div style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)', borderRadius: 'var(--radius-md)', display: 'inline-block', color: '#14B8A6', fontSize: '0.85rem', fontWeight: 600 }}>
          🚧 Coming Soon
        </div>
      </div>
    </div>
  );
};
