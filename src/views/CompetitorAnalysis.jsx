import React from 'react';
import GoogleTrendsWidget from '../components/GoogleTrendsWidget';

const CompetitorAnalysis = () => {
  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h1>Market Intelligence</h1>
        <p>Real-time tracking of brand demand and search interest via Google Trends.</p>
      </div>

      <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
        {/* Live Google Trends Widget Integration */}
        <GoogleTrendsWidget 
          keywords={["hanasui", "skintific", "glad2glow"]} 
          geo="ID" 
          time="today 12-m" 
        />
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center' }}>
          Data disediakan langsung oleh Google Trends Real-time API.
        </p>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
