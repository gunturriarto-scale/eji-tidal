import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, Calendar, ChevronDown } from 'lucide-react';

import { GA_KPICards }         from './components/GA_KPICards';
import { GA_AccountSwitcher }  from './components/GA_AccountSwitcher';
import { GA_SectionTabs }      from './components/GA_SectionTabs';
import { GA_DailyTrend }       from './components/GA_DailyTrend';
import { GA_ChannelBreakdown } from './components/GA_ChannelBreakdown';
import { GA_CampaignTable }    from './components/GA_CampaignTable';
import { GA_AdTable }          from './components/GA_AdTable';
import { GA_ShoppingTable }    from './components/GA_ShoppingTable';
import { GA_ConversionPanel }  from './components/GA_ConversionPanel';
import { GA_PlacementTable }   from './components/GA_PlacementTable';

const ACCENT = '#4285F4';
const API    = '/api/google-ads';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function computeDateRange(filter, customStart, customEnd) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  switch (filter) {
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

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  dateFilter, setDateFilter,
  customStart, setCustomStart,
  customEnd, setCustomEnd,
  accounts, selectedAccount, onAccountChange,
  onRefresh, isLoading,
}) {
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
            border: `1.5px solid ${ACCENT}50`,
            borderRadius: '8px', color: ACCENT,
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
            border: `1px solid ${ACCENT}30`, borderRadius: '10px',
            overflow: 'hidden', backdropFilter: 'blur(20px)',
            zIndex: 200, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            {DATE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setDateFilter(opt.value); setDateOpen(false); }}
                style={{
                  width: '100%', padding: '0.6rem 1rem', textAlign: 'left',
                  background: dateFilter === opt.value ? `${ACCENT}18` : 'transparent',
                  color: dateFilter === opt.value ? ACCENT : 'var(--text-secondary)',
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

      {dateFilter === 'custom' && (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="glass-input" style={{ height: '38px', fontSize: '0.72rem' }} max={customEnd || undefined} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>–</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="glass-input" style={{ height: '38px', fontSize: '0.72rem' }} min={customStart || undefined} />
        </div>
      )}

      <GA_AccountSwitcher accounts={accounts} selected={selectedAccount} onChange={onAccountChange} />

      <button
        onClick={onRefresh} disabled={isLoading}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.5rem 0.9rem',
          background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`,
          borderRadius: '8px', color: isLoading ? 'var(--text-tertiary)' : ACCENT,
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

// ─── Top campaigns (overview) ──────────────────────────────────────────────────

function TopCampaigns({ campaigns }) {
  const top = (campaigns || []).slice(0, 5);
  if (!top.length) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
        Top 5 Campaigns by Spend
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              {['Campaign', 'Channel', 'Spend', 'CTR', 'Conv.', 'ROAS'].map(h => (
                <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: h === 'Campaign' ? 'left' : 'right', color: 'var(--text-tertiary)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((row, idx) => {
              const ch = row.channel_type || row.ADVERTISING_CHANNEL_TYPE || '';
              const chLabels = { PERFORMANCE_MAX: 'PMax', DISPLAY: 'Display', VIDEO: 'Video', DEMAND_GEN: 'DemGen' };
              const chColors = { PERFORMANCE_MAX: '#4285F4', DISPLAY: '#FBBC04', VIDEO: '#EA4335', DEMAND_GEN: '#34A853' };
              const color = chColors[ch] || '#6B7280';
              return (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.5rem 0.6rem', color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.CAMPAIGN_NAME || '—'}</td>
                  <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.6rem', padding: '2px 5px', background: `${color}18`, color, borderRadius: '3px', fontWeight: 700 }}>{chLabels[ch] || ch}</span>
                  </td>
                  <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: ACCENT, fontWeight: 600 }}>
                    IDR {row.cost >= 1e6 ? (row.cost / 1e6).toFixed(1) + 'M' : row.cost >= 1e3 ? (row.cost / 1e3).toFixed(1) + 'K' : String(row.cost || 0)}
                  </td>
                  <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.ctr != null ? row.ctr + '%' : '—'}</td>
                  <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#34A853' }}>{row.conversions != null ? Number(row.conversions).toFixed(1) : '—'}</td>
                  <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right', color: '#10B981', fontWeight: 600 }}>{row.roas != null ? row.roas + 'x' : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab sections ──────────────────────────────────────────────────────────────

function OverviewSection({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <GA_DailyTrend trendData={data.trend} />
      <GA_ChannelBreakdown channelData={data.channel} />
      <TopCampaigns campaigns={data.campaigns} />
    </div>
  );
}

function CampaignsSection({ data, channelFilter, setChannelFilter }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <GA_CampaignTable
        campaigns={data.campaigns}
        channelFilter={channelFilter}
        onChannelFilterChange={setChannelFilter}
      />
    </div>
  );
}

function AdsSection({ data }) {
  return <GA_AdTable adsData={data.ads} deviceBreakdown={data.deviceBreakdown} />;
}

function ShoppingSection({ data }) {
  return <GA_ShoppingTable shoppingData={data.shopping} brandData={data.shoppingBrand} />;
}

function ConversionsSection({ data }) {
  return <GA_ConversionPanel convData={data.conversions} />;
}

function PlacementsSection({ data }) {
  return <GA_PlacementTable placementData={data.placements} />;
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function GoogleAdsDashboard() {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [activeTab, setActiveTab]     = useState('overview');
  const [dateFilter, setDateFilter]   = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd]     = useState('');
  const [channelFilter, setChannelFilter] = useState('all');

  const [loading, setLoading]             = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError]                 = useState(null);

  const [data, setData] = useState({
    kpi: null, accounts: [], trend: [], channel: [],
    campaigns: [], ads: [], deviceBreakdown: [],
    shopping: [], shoppingBrand: [], conversions: [], placements: [],
  });

  const dateRange = computeDateRange(dateFilter, customStart, customEnd);

  const fetchData = useCallback(async (params = {}) => {
    const { start, end, account } = params;
    setFilterLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      if (start)   qs.set('start', start);
      if (end)     qs.set('end', end);
      if (account && account !== 'all') qs.set('account', account);

      const [kpiRes, accRes, trendRes, channelRes, campRes, adsRes, devRes, shopRes, brandRes, convRes, placRes] = await Promise.all([
        fetch(`${API}?type=kpiOverview&${qs}`).then(r => r.json()),
        fetch(`${API}?type=accounts`).then(r => r.json()),
        fetch(`${API}?type=dailyTrend&${qs}`).then(r => r.json()),
        fetch(`${API}?type=channelBreakdown&${qs}`).then(r => r.json()),
        fetch(`${API}?type=campaigns&${qs}`).then(r => r.json()),
        fetch(`${API}?type=ads&${qs}`).then(r => r.json()),
        fetch(`${API}?type=deviceBreakdown&${qs}`).then(r => r.json()),
        fetch(`${API}?type=shopping&${qs}`).then(r => r.json()),
        fetch(`${API}?type=shoppingBrand&${qs}`).then(r => r.json()),
        fetch(`${API}?type=conversions&${qs}`).then(r => r.json()),
        fetch(`${API}?type=placements&${qs}`).then(r => r.json()),
      ]);

      setData({
        kpi:            kpiRes.data?.[0]   || {},
        accounts:       accRes.data        || [],
        trend:          trendRes.data      || [],
        channel:        channelRes.data    || [],
        campaigns:      campRes.data       || [],
        ads:            adsRes.data        || [],
        deviceBreakdown: devRes.data       || [],
        shopping:       shopRes.data       || [],
        shoppingBrand:  brandRes.data      || [],
        conversions:    convRes.data       || [],
        placements:     placRes.data       || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setFilterLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const debounceRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData({ start: dateRange.start, end: dateRange.end, account: selectedAccount });
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [dateRange.start, dateRange.end, selectedAccount, fetchData, loading]);

  const handleRefresh = () =>
    fetchData({ start: dateRange.start, end: dateRange.end, account: selectedAccount });

  // ─── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: ACCENT }} />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Loading Google Ads analytics...</p>
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
          style={{ padding: '0.5rem 1rem', background: `${ACCENT}18`, border: `1px solid ${ACCENT}`, borderRadius: '8px', color: ACCENT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', fontSize: '0.8rem', fontWeight: 600 }}
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
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: ACCENT }} />
          <span style={{ fontSize: '0.8rem' }}>Fetching data...</span>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':    return <OverviewSection data={data} />;
      case 'campaigns':   return <CampaignsSection data={data} channelFilter={channelFilter} setChannelFilter={setChannelFilter} />;
      case 'ads':         return <AdsSection data={data} />;
      case 'shopping':    return <ShoppingSection data={data} />;
      case 'conversions': return <ConversionsSection data={data} />;
      case 'placements':  return <PlacementsSection data={data} />;
      default:            return null;
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          📊 Google Ads Analytics
        </h2>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>
          {data.accounts.length} accounts · {data.campaigns.length} campaigns
          {dateFilter !== 'all' && <span style={{ color: ACCENT, marginLeft: '0.5rem' }}>(filtered)</span>}
        </p>
      </div>

      <FilterBar
        dateFilter={dateFilter} setDateFilter={setDateFilter}
        customStart={customStart} setCustomStart={setCustomStart}
        customEnd={customEnd} setCustomEnd={setCustomEnd}
        accounts={data.accounts} selectedAccount={selectedAccount} onAccountChange={setSelectedAccount}
        onRefresh={handleRefresh} isLoading={filterLoading}
      />

      <GA_KPICards kpi={data.kpi} />

      <GA_SectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {renderTab()}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
