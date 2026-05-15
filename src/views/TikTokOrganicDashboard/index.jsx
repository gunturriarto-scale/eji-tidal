import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, Calendar, ChevronDown } from 'lucide-react';

import { TK_KPICards }        from './components/TK_KPICards';
import { TK_AccountSwitcher } from './components/TK_AccountSwitcher';
import { TK_SectionTabs }     from './components/TK_SectionTabs';
import { TK_ProfileTrend }    from './components/TK_ProfileTrend';
import { TK_VideoGrid }       from './components/TK_VideoGrid';
import { TK_TopVideos }       from './components/TK_TopVideos';
import { TK_VideoFunnel }     from './components/TK_VideoFunnel';
import { TK_Demographics }    from './components/TK_Demographics';

// ─── Date helpers ────────────────────────────────────────────────────────────

function computeDateRange(dateFilter, customStart, customEnd) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  switch (dateFilter) {
    case 'last7': {
      const s = new Date(today); s.setDate(today.getDate() - 6);
      return { start: fmt(s), end: fmt(today) };
    }
    case 'last30': {
      const s = new Date(today); s.setDate(today.getDate() - 29);
      return { start: fmt(s), end: fmt(today) };
    }
    case 'thisMonth': {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: fmt(s), end: fmt(e) };
    }
    case 'lastMonth': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: fmt(s), end: fmt(e) };
    }
    case 'custom':
      return { start: customStart || null, end: customEnd || null };
    default:
      return { start: null, end: null };
  }
}

const DATE_OPTIONS = [
  { value: 'all',       label: 'All Time' },
  { value: 'last7',     label: 'Last 7 Days' },
  { value: 'last30',    label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom',    label: 'Custom Range' },
];

const DATE_LABELS = {
  all: 'All Time', last7: 'Last 7 Days', last30: 'Last 30 Days',
  thisMonth: 'This Month', lastMonth: 'Last Month', custom: 'Custom',
};

// ─── DateFilterBar ────────────────────────────────────────────────────────────

function DateFilterBar({ dateFilter, setDateFilter, customStart, setCustomStart, customEnd, setCustomEnd, onRefresh, isLoading, accounts, selectedAccount, onAccountChange }) {
  const [dateOpen, setDateOpen] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {/* Date dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDateOpen(!dateOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid rgba(255,0,80,0.3)',
            borderRadius: '8px', color: '#FF0050',
            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Calendar size={14} />
          {DATE_LABELS[dateFilter]}
          <ChevronDown size={12} style={{ transform: dateOpen ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }} />
        </button>
        {dateOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            minWidth: '180px', background: 'rgba(15,23,42,0.97)',
            border: '1px solid rgba(255,0,80,0.2)', borderRadius: '10px',
            overflow: 'hidden', backdropFilter: 'blur(20px)',
            zIndex: 200, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            {DATE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setDateFilter(opt.value); setDateOpen(false); }}
                style={{
                  width: '100%', padding: '0.6rem 1rem', textAlign: 'left',
                  background: dateFilter === opt.value ? 'rgba(255,0,80,0.12)' : 'transparent',
                  color: dateFilter === opt.value ? '#FF0050' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer', fontSize: '0.75rem',
                  fontWeight: dateFilter === opt.value ? 700 : 400, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (dateFilter !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (dateFilter !== opt.value) e.currentTarget.style.background = 'transparent'; }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom date inputs */}
      {dateFilter === 'custom' && (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="glass-input" style={{ height: '38px', fontSize: '0.72rem' }} max={customEnd || undefined} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>–</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="glass-input" style={{ height: '38px', fontSize: '0.72rem' }} min={customStart || undefined} />
        </div>
      )}

      {/* Account dropdown — next to date filter */}
      <TK_AccountSwitcher accounts={accounts} selected={selectedAccount} onChange={onAccountChange} />

      <button
        onClick={onRefresh} disabled={isLoading}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.5rem 0.9rem',
          background: 'rgba(255,0,80,0.08)', border: '1px solid rgba(255,0,80,0.2)',
          borderRadius: '8px', color: isLoading ? 'var(--text-tertiary)' : '#FF0050',
          fontSize: '0.72rem', fontWeight: 600,
          cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.6 : 1,
        }}
      >
        <RefreshCw size={12} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
        Refresh
      </button>
    </div>
  );
}

// ─── Tab content sections ────────────────────────────────────────────────────

function OverviewSection({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <TK_ProfileTrend trendData={data.trend} />
      <TK_TopVideos videos={data.topVideos} />
    </div>
  );
}

function ContentSection({ data }) {
  return <TK_VideoGrid videos={data.videoAll} />;
}

function VideoPerformanceSection({ data }) {
  return <TK_VideoFunnel funnelData={data.funnel} />;
}

function AudienceSection({ data }) {
  return <TK_Demographics genderData={data.gender} countryData={data.country} />;
}

// ─── Main export ─────────────────────────────────────────────────────────────

const API = '/api/tiktok-organic';

export function TikTokOrganicDashboard() {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [activeTab, setActiveTab]     = useState('overview');
  const [dateFilter, setDateFilter]   = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd]     = useState('');

  const [loading, setLoading]             = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError]                 = useState(null);

  const [data, setData] = useState({
    kpi: null, accounts: [], trend: [], topVideos: [],
    videoAll: [], funnel: null, gender: [], country: [],
  });

  const dateRange = computeDateRange(dateFilter, customStart, customEnd);

  const fetchData = useCallback(async (params = {}) => {
    const { start, end, username } = params;
    setFilterLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      if (start)    qs.set('start', start);
      if (end)      qs.set('end', end);
      if (username && username !== 'all') qs.set('username', username);

      const [kpiRes, accRes, trendRes, topRes, videoRes, funnelRes, genderRes, countryRes] = await Promise.all([
        fetch(`${API}?type=kpiOverview&${qs}`).then(r => r.json()),
        fetch(`${API}?type=accounts`).then(r => r.json()),
        fetch(`${API}?type=profileTrend&${qs}`).then(r => r.json()),
        fetch(`${API}?type=topVideos&${qs}`).then(r => r.json()),
        fetch(`${API}?type=videoAll&${qs}`).then(r => r.json()),
        fetch(`${API}?type=videoFunnel&${qs}`).then(r => r.json()),
        fetch(`${API}?type=gender&${new URLSearchParams(username && username !== 'all' ? { username } : {})}`).then(r => r.json()),
        fetch(`${API}?type=country&${new URLSearchParams(username && username !== 'all' ? { username } : {})}`).then(r => r.json()),
      ]);

      setData({
        kpi:       kpiRes.data?.[0]    || {},
        accounts:  accRes.data         || [],
        trend:     trendRes.data       || [],
        topVideos: topRes.data         || [],
        videoAll:  videoRes.data       || [],
        funnel:    funnelRes.data?.[0] || null,
        gender:    genderRes.data      || [],
        country:   countryRes.data     || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setFilterLoading(false);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-fetch on filter change (debounced)
  const debounceRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData({ start: dateRange.start, end: dateRange.end, username: selectedAccount });
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [dateRange.start, dateRange.end, selectedAccount, fetchData, loading]);

  const handleRefresh = () =>
    fetchData({ start: dateRange.start, end: dateRange.end, username: selectedAccount });

  // ─── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#FF0050' }} />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Loading TikTok organic analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={32} style={{ color: '#EF4444', marginBottom: '1rem' }} />
        <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={handleRefresh}
          style={{ padding: '0.5rem 1rem', background: 'rgba(255,0,80,0.1)', border: '1px solid #FF0050', borderRadius: '8px', color: '#FF0050', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', fontSize: '0.8rem', fontWeight: 600 }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const renderTab = () => {
    if (filterLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#FF0050' }} />
          <span style={{ fontSize: '0.8rem' }}>Fetching data...</span>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':  return <OverviewSection data={data} />;
      case 'content':   return <ContentSection data={data} />;
      case 'video':     return <VideoPerformanceSection data={data} />;
      case 'audience':  return <AudienceSection data={data} />;
      default:          return null;
    }
  };

  const videoCount = data.videoAll.length;
  const accountCount = data.accounts.length;

  return (
    <div className="fade-in">
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          🎵 TikTok Organic Analytics
        </h2>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>
          {accountCount} accounts · {videoCount} videos tracked
          {dateFilter !== 'all' && <span style={{ color: '#FF0050', marginLeft: '0.5rem' }}>(filtered)</span>}
        </p>
      </div>

      {/* Date Filter Bar (includes account dropdown) */}
      <DateFilterBar
        dateFilter={dateFilter} setDateFilter={setDateFilter}
        customStart={customStart} setCustomStart={setCustomStart}
        customEnd={customEnd} setCustomEnd={setCustomEnd}
        onRefresh={handleRefresh} isLoading={filterLoading}
        accounts={data.accounts} selectedAccount={selectedAccount} onAccountChange={setSelectedAccount}
      />

      {/* KPI Cards */}
      <TK_KPICards kpi={data.kpi} />

      {/* Section Tabs */}
      <TK_SectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {renderTab()}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
