import React, { useState } from 'react';
import { Twitter, Video, Youtube, ExternalLink, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

const SOCIAL_TABS = [
  { id: 'tiktok', label: 'TikTok', icon: <Video size={16} /> },
  { id: 'x', label: 'X (Twitter)', icon: <Twitter size={16} /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube size={16} /> }
];

const SocialListening = ({ mentionsData = [] }) => {
  const [activeTab, setActiveTab] = useState('tiktok');
  const [pageSkintific, setPageSkintific] = useState(1);
  const [pageGlad2Glow, setPageGlad2Glow] = useState(1);
  const itemsPerPage = 10;

  // Filter data by platform
  const currentData = mentionsData.filter(d => d.platform.toLowerCase() === activeTab);
  
  // Separate by brand
  const skintificData = currentData.filter(d => d.brand.toLowerCase() === 'skintific');
  const glad2glowData = currentData.filter(d => d.brand.toLowerCase() === 'glad2glow');

  // Pagination logic
  const paginate = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const renderTable = (brand, data, currentPage, setPage) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = paginate(data, currentPage);

    return (
      <div style={{ flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.03)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{brand} Mentions</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Total: {data.length} posts</p>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>User</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Snippet</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500', textAlign: 'center' }}>Eng.</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500', textAlign: 'center' }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No mentions found.</td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{item.date}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>@{item.username}</td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                      {item.snippet}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--accent-primary)' }}>{item.engagement}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <TrendingUp size={20} color="var(--accent-secondary)" />
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Social Listening (UGC & Mentions)</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        {SOCIAL_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPageSkintific(1);
              setPageGlad2Glow(1);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-secondary)' : 'var(--text-tertiary)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-secondary)' : '2px solid transparent',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '600' : '400',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tables Container */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        {renderTable('Skintific', skintificData, pageSkintific, setPageSkintific)}
        {renderTable('Glad2Glow', glad2glowData, pageGlad2Glow, setPageGlad2Glow)}
      </div>
    </div>
  );
};

export default SocialListening;
