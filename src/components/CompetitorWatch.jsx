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

  // Group by brand
  const groupedData = data.reduce((acc, item) => {
    const brand = item.brand || 'Unknown';
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(item);
    return acc;
  }, {});

  // For each brand, get the top 3 latest updates
  const brands = Object.keys(groupedData).sort();

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <AlertTriangle size={20} color="var(--accent-primary)" />
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Competitor Activity Feed</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {brands.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)', gridColumn: '1 / -1' }}>
            Belum ada pergerakan kompetitor terbaru.
          </div>
        ) : (
          brands.map(brand => {
            // Sort by timestamp descending and take top 3
            const top3 = groupedData[brand]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 3);

            return (
              <div key={brand} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                  {brand} <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(Last 3 Updates)</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {top3.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      alignItems: 'flex-start',
                      borderLeft: `3px solid ${getSeverityColor(item.severity)}`,
                      paddingLeft: '0.75rem'
                    }}>
                      <div style={{ 
                        width: '32px', height: '32px', 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.05)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {getPlatformIcon(item.platform)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '1rem',
                            background: 'rgba(255,255,255,0.05)',
                            color: getSeverityColor(item.severity),
                            border: `1px solid ${getSeverityColor(item.severity)}`
                          }}>
                            {item.severity}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                            <Clock size={10} />
                            {new Date(item.timestamp).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <span style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            fontSize: '0.7rem', color: 'var(--accent-secondary)',
                            background: 'rgba(139, 92, 246, 0.1)',
                            padding: '0.15rem 0.4rem', borderRadius: '4px'
                          }}>
                            <Tag size={10} />
                            {item.updateType}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {item.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CompetitorWatch;
