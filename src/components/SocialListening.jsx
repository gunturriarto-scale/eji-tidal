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

  // Date Filter States
  const [datePreset, setDatePreset] = useState('30d');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle Preset Changes
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    setEndDate(end);

    if (preset === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('2026-01-01');
    }
  };

  // Filter Data based on Date & Platform
  const filterByDate = (items) => {
    return items.filter(item => {
      const dateToCompare = item.posted_at || item.raw_date;
      if (!dateToCompare) return true;
      const itemDate = new Date(dateToCompare).toISOString().split('T')[0];
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const filteredMentions = filterByDate(mentionsData).filter(d => d.platform.toLowerCase() === activeTab);
  const skintificData = filteredMentions.filter(d => d.brand.toLowerCase() === 'skintific');
  const glad2glowData = filteredMentions.filter(d => d.brand.toLowerCase() === 'glad2glow');

  // Trend Data dynamic calculation based on filtered mentions
  const calculateTrends = () => {
    const trends = {};
    filteredMentions.forEach(m => {
      const dateStr = new Date(m.posted_at || m.raw_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const key = dateStr;
      if (!trends[key]) {
        trends[key] = { date: dateStr, skintific: 0, glad2glow: 0, raw_date: new Date(m.posted_at || m.raw_date) };
      }
      if (m.brand.toLowerCase() === 'skintific') trends[key].skintific += 1;
      if (m.brand.toLowerCase() === 'glad2glow') trends[key].glad2glow += 1;
    });
    return Object.values(trends).sort((a, b) => a.raw_date - b.raw_date);
  };

  const dynamicTrendData = calculateTrends();

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
                  <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No mentions found in selected range.</td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)', hover: {background: 'rgba(255,255,255,0.01)'} }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={20} color="var(--accent-secondary)" />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Social Listening (UGC & Mentions)</h2>
        </div>

        {/* Date Filter UI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {['7d', '30d', 'all', 'custom'].map(p => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                style={{
                  padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: datePreset === p ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.05)',
                  color: datePreset === p ? '#fff' : 'var(--text-secondary)',
                  transition: '0.2s'
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          {datePreset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px' }} />
              <span style={{ color: 'var(--text-tertiary)' }}>to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px' }} />
            </div>
          )}
        </div>
      </div>

      {/* Metrics Scorecard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Views', value: filteredMentions.reduce((acc, m) => acc + (m.views || 0), 0), icon: <Eye size={18} />, color: 'var(--text-primary)' },
          { label: 'Total Likes', value: filteredMentions.reduce((acc, m) => acc + (m.likes || 0), 0), icon: <Heart size={18} />, color: 'var(--accent-tertiary)' },
          { label: 'Total Comments', value: filteredMentions.reduce((acc, m) => acc + (m.comments || 0), 0), icon: <MessageCircle size={18} />, color: 'var(--accent-primary)' },
          { label: 'Total Shares', value: filteredMentions.reduce((acc, m) => acc + (m.shares || 0), 0), icon: <Share2 size={18} />, color: 'var(--success)' }
        ].map((metric, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: metric.color }}>
              {metric.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>{metric.label}</p>
              <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '700' }}>{formatNumber(metric.value)}</h4>
            </div>
          </div>
        ))}
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
      <div style={{ width: '100%', height: '320px', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Daily Mentions Trend ({activeTab.toUpperCase()})
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dynamicTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
