import React from 'react';
import { Clock, Tag, ShoppingBag, Instagram, Video, AlertTriangle, Info } from 'lucide-react';

const CompetitorWatch = ({ data = [] }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'var(--danger, #ef4444)';
      case 'major': return 'var(--warning, #f59e0b)';
      case 'minor': return 'var(--accent-primary, #6366f1)';
      default: return 'var(--text-tertiary, #6b7280)';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'shopee': return <ShoppingBag size={16} color="#f59e0b" />;
      case 'instagram': return <Instagram size={16} color="#ec4899" />;
      case 'tiktok': return <Video size={16} color="#f8f9fa" />;
      default: return <Info size={16} color="#9da3af" />;
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <AlertTriangle size={20} color="var(--accent-primary)" />
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Competitor Activity Feed</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
            Belum ada pergerakan kompetitor terbaru.
          </div>
        ) : (
          data.map((item, idx) => (
            <div key={idx} className="glass-panel" style={{ 
              padding: '1.25rem', 
              display: 'flex', 
              gap: '1.25rem', 
              alignItems: 'flex-start',
              borderLeft: `4px solid ${getSeverityColor(item.severity)}`
            }}>
              <div style={{ 
                width: '40px', height: '40px', 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.05)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                {getPlatformIcon(item.platform)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{item.brand}</h3>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '1rem',
                      background: 'rgba(255,255,255,0.05)',
                      color: getSeverityColor(item.severity),
                      border: `1px solid ${getSeverityColor(item.severity)}`
                    }}>
                      {item.severity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    <Clock size={12} />
                    {item.timestamp}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.75rem', color: 'var(--accent-secondary)',
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '0.2rem 0.5rem', borderRadius: '4px'
                  }}>
                    <Tag size={12} />
                    {item.updateType}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompetitorWatch;
