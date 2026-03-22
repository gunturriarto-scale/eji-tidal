import React, { useState } from 'react';
import { Twitter, Video, Youtube, ExternalLink, ChevronLeft, ChevronRight, TrendingUp, Eye, Heart, MessageCircle, Share2, Instagram } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SOCIAL_TABS = [
  { id: 'tiktok', label: 'TikTok', icon: <Video size={16} /> },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={16} /> },
  { id: 'x', label: 'X (Twitter)', icon: <Twitter size={16} /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube size={16} /> }
];

const SocialListening = ({ mentionsData = [], trendData = [] }) => {
  const [activeTab, setActiveTab] = useState('tiktok');
  const [pageSkintific, setPageSkintific] = useState(1);
  const [pageGlad2Glow, setPageGlad2Glow] = useState(1);
  const itemsPerPage = 10;

  // Filter data by platform
  const currentData = mentionsData.filter(d => d.platform.toLowerCase() === activeTab);
  const skintificData = currentData.filter(d => d.brand.toLowerCase() === 'skintific');
  const glad2glowData = currentData.filter(d => d.brand.toLowerCase() === 'glad2glow');

  // Filter trend data by platform
  const currentTrendData = trendData.filter(d => d.platform.toLowerCase() === activeTab);

  // Pagination logic
  const paginate = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(20, 20, 29, 0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></div>
              <span style={{ fontWeight: 500 }}>{entry.name}:</span>
              <span>{entry.value} mentions</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderTable = (brand, data, currentPage, setPage) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = paginate(data, currentPage);

    return (
      <div style={{ flex: 1, minWidth: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
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
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500', width: '35%' }}>Content Snippet</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500', textAlign: 'center' }}><div style={{display:'flex', justifyContent:'center', gap:'4px'}}><Eye size={14}/> Views</div></th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500', textAlign: 'center' }}><div style={{display:'flex', justifyContent:'center', gap:'4px'}}><Heart size={14}/> Likes</div></th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500', textAlign: 'center' }}><div style={{display:'flex', justifyContent:'center', gap:'4px'}}><MessageCircle size={14}/> Comms</div></th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500', textAlign: 'center' }}><div style={{display:'flex', justifyContent:'center', gap:'4px'}}><Share2 size={14}/> Shares</div></th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '500', textAlign: 'center' }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No mentions found.</td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)', ':hover': {background: 'rgba(255,255,255,0.01)'} }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{item.date}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>@{item.username}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.snippet}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-primary)' }}>{formatNumber(item.views)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--accent-tertiary)' }}>{formatNumber(item.likes)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--accent-primary)' }}>{formatNumber(item.comments)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--success)' }}>{formatNumber(item.shares)}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px' }}>
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
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
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
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trend Chart Area */}
      <div style={{ width: '100%', height: '280px', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Daily Mentions Trend ({activeTab.toUpperCase()})
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} tickMargin={10} />
            <YAxis stroke="var(--text-tertiary)" fontSize={11} tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="skintific" name="Skintific" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="glad2glow" name="Glad2Glow" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tables Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {renderTable('Skintific', skintificData, pageSkintific, setPageSkintific)}
        {renderTable('Glad2Glow', glad2glowData, pageGlad2Glow, setPageGlad2Glow)}
      </div>
    </div>
  );
};

export default SocialListening;
