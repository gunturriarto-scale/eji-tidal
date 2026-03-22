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
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.03)' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{brand} Mentions</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>User</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>Content</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '500', textAlign: 'center' }}>Views</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '500', textAlign: 'center' }}>Likes</th>
                <th style={{ padding: '0.5rem 0.75rem', fontWeight: '500', textAlign: 'center' }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No data.</td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{item.date.split(' ').slice(0,2).join(' ')}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: '500' }}>@{item.username.length > 8 ? item.username.substring(0,8)+'..' : item.username}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.snippet}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{formatNumber(item.views)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: 'var(--accent-tertiary)' }}>{formatNumber(item.likes)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)' }}>
                        <ExternalLink size={12} />
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
    <div className="glass-panel" style={{ marginTop: '2rem', padding: '2.5rem', borderRadius: 'var(--radius-xl)', background: 'rgba(15, 15, 25, 0.75)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
      {/* Header & Global Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.85rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', borderRadius: '14px', boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)' }}>
            <TrendingUp size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800', letterSpacing: '-0.03em', color: '#fff' }}>Social Intelligence</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>Real-time voice of the community</p>
          </div>
        </div>

        {/* Unified Filter UI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.85rem 1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {['7d', '30d', 'all', 'custom'].map(p => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                style={{
                  padding: '0.55rem 1.1rem', fontSize: '0.8rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: datePreset === p ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: datePreset === p ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: datePreset === p ? '700' : '500',
                  transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {p === 'all' ? 'All Time' : p.toUpperCase()}
              </button>
            ))}
          </div>
          {datePreset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8rem', padding: '0.45rem', borderRadius: '8px' }} />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.8rem', padding: '0.45rem', borderRadius: '8px' }} />
            </div>
          )}
        </div>
      </div>

      {/* Hero Section: Trend Visualization */}
      <div style={{ width: '100%', height: '380px', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)', borderRadius: '24px', padding: '2.5rem', marginBottom: '3rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '700' }}>Daily Mentions Trend</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Volume analysis across tracked platforms</p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.6rem', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '12px' }}>
            {SOCIAL_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.5rem 1rem', fontSize: '0.8rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--accent-secondary)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: '0.3s', fontWeight: activeTab === tab.id ? '600' : '400'
                }}
              >
                {tab.icon} {tab.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height="75%">
          <LineChart data={dynamicTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} tickMargin={15} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '25px', fontSize: '12px' }} />
            <Line type="monotone" dataKey="skintific" name="Skintific" stroke="#6366f1" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="glad2glow" name="Glad2Glow" stroke="#ec4899" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Comparative Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Skintific Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                 <Video size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#fff' }}>Skintific</h3>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
               {[
                 { label: 'Views', val: skintificData.reduce((acc, m) => acc + (m.views || 0), 0), col: '#fff' },
                 { label: 'Engagements', val: skintificData.reduce((acc, m) => acc + (m.likes || 0) + (m.comments || 0), 0), col: '#6366f1' }
               ].map((s, i) => (
                 <div key={i} style={{ textAlign: 'right' }}>
                   <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                   <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: s.col }}>{formatNumber(s.val)}</p>
                 </div>
               ))}
            </div>
          </div>
          {renderTable('Skintific', skintificData, pageSkintific, setPageSkintific)}
        </div>

        {/* Glad2Glow Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                 <Video size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#fff' }}>Glad2Glow</h3>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
               {[
                 { label: 'Views', val: glad2glowData.reduce((acc, m) => acc + (m.views || 0), 0), col: '#fff' },
                 { label: 'Engagements', val: glad2glowData.reduce((acc, m) => acc + (m.likes || 0) + (m.comments || 0), 0), col: '#ec4899' }
               ].map((s, i) => (
                 <div key={i} style={{ textAlign: 'right' }}>
                   <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                   <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: s.col }}>{formatNumber(s.val)}</p>
                 </div>
               ))}
            </div>
          </div>
          {renderTable('Glad2Glow', glad2glowData, pageGlad2Glow, setPageGlad2Glow)}
        </div>

      </div>
    </div>
  );
};

export default SocialListening;
