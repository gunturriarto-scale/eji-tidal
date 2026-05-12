import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, Calendar, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

import { IG_KPICards } from './components/IG_KPICards';
import { IG_AccountSwitcher } from './components/IG_AccountSwitcher';
import { IG_SectionTabs } from './components/IG_SectionTabs';
import { IG_ContentGrid } from './components/IG_ContentGrid';
import { IG_Demographics } from './components/IG_Demographics';
import { IG_GeoTable } from './components/IG_GeoTable';
import { IG_StoryAnalytics } from './components/IG_StoryAnalytics';
import { IG_TopPerformers } from './components/IG_TopPerformers';

function fmtNum(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

const ACCOUNT_COLORS = {
  'Official Hanasui': '#EC4899',
  'Next Level by Hanasui': '#8B5CF6',
  'Official Skincare Hanasui': '#06B6D4',
};

// ─── Date range utilities ─────────────────────────────────────────────────────

function computeDateRange(dateFilter, customStart, customEnd) {
  // Returns { start, end } in YYYY-MM-DD format, or null for no bound
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];

  switch (dateFilter) {
    case 'last7':
      const s7 = new Date(today); s7.setDate(today.getDate() - 6);
      return { start: fmt(s7), end: fmt(today) };
    case 'last30':
      const s30 = new Date(today); s30.setDate(today.getDate() - 29);
      return { start: fmt(s30), end: fmt(today) };
    case 'thisMonth':
      const sm = new Date(today.getFullYear(), today.getMonth(), 1);
      const em = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: fmt(sm), end: fmt(em) };
    case 'lastMonth': {
      const lmStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: fmt(lmStart), end: fmt(lmEnd) };
    }
    case 'custom':
      return { start: customStart || null, end: customEnd || null };
    case 'all':
    default:
      return { start: null, end: null };
  }
}

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' },
];

const DATE_FILTER_LABELS = {
  all: 'All Time',
  last7: 'Last 7 Days',
  last30: 'Last 30 Days',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  custom: 'Custom',
};

// ─── Date Filter Bar ───────────────────────────────────────────────────────────

function DateFilterBar({ dateFilter, setDateFilter, customStart, setCustomStart, customEnd, setCustomEnd, onRefresh, isLoading }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
    }}>
      {/* Date filter dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid rgba(236,72,153,0.3)',
            borderRadius: '8px',
            color: '#EC4899',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Calendar size={14} />
          {DATE_FILTER_LABELS[dateFilter]}
          <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'all 0.2s' }} />
        </button>

        {open && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '180px',
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(236,72,153,0.2)',
            borderRadius: '10px',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            zIndex: 100,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            {DATE_FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setDateFilter(opt.value); setOpen(false); }}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  textAlign: 'left',
                  background: dateFilter === opt.value ? 'rgba(236,72,153,0.12)' : 'transparent',
                  color: dateFilter === opt.value ? '#EC4899' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: dateFilter === opt.value ? 700 : 400,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (dateFilter !== opt.value) e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (dateFilter !== opt.value) e.target.style.background = 'transparent'; }}
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
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="glass-input"
            style={{ height: '38px', fontSize: '0.72rem' }}
            max={customEnd || undefined}
          />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>–</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="glass-input"
            style={{ height: '38px', fontSize: '0.72rem' }}
            min={customStart || undefined}
          />
        </div>
      )}

      {/* Date range summary badge */}
      {dateFilter !== 'all' && (
        <div style={{
          fontSize: '0.65rem',
          color: 'var(--text-tertiary)',
          background: 'rgba(255,255,255,0.04)',
          padding: '0.3rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {DATE_FILTER_LABELS[dateFilter]}
        </div>
      )}

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.5rem 0.9rem',
          background: 'rgba(236,72,153,0.08)',
          border: '1px solid rgba(236,72,153,0.2)',
          borderRadius: '8px',
          color: isLoading ? 'var(--text-tertiary)' : '#EC4899',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: isLoading ? 'wait' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <RefreshCw size={12} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
        Refresh
      </button>
    </div>
  );
}

// ─── Overview Section ────────────────────────────────────────────────────────

function OverviewSection({ accounts, quickInsights, topPosts, ageGenderData }) {
  const ageGroups = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const filteredAgeData = ageGenderData || [];

  const ageChartData = ageGroups.map(ag => {
    const row = { age: ag };
    accounts?.forEach(acc => {
      row[acc.ACCOUNT_NAME] = filteredAgeData
        .filter(r => r.ACCOUNT_ID === acc.ACCOUNT_ID && r.AGE === ag && r.GENDER === 'female')
        .reduce((s, r) => s + (r.FOLLOWERS_COUNT || 0), 0);
    });
    return row;
  });

  const genderMap = { female: 0, male: 0, undefined: 0 };
  filteredAgeData.forEach(r => {
    if (genderMap[r.GENDER] !== undefined) genderMap[r.GENDER] += r.FOLLOWERS_COUNT || 0;
  });
  const genderPieData = [
    { name: 'Female', value: genderMap.female },
    { name: 'Male', value: genderMap.male },
    { name: 'Undefined', value: genderMap.undefined },
  ];

  const typeMap = {};
  (quickInsights || []).forEach(q => {
    const t = q.MEDIA_PRODUCT_TYPE;
    if (!typeMap[t]) typeMap[t] = 0;
    typeMap[t] += q.post_count || 0;
  });
  const typePieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  const COLORS = ['#EC4899', '#8B5CF6', '#06B6D4'];
  const GENDER_COLORS = ['#EC4899', '#3B82F6', '#6B7280'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-panel" style={{ padding: '0.6rem 0.8rem', fontSize: '0.72rem' }}>
        <p style={{ fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill, margin: '2px 0' }}>
            {p.name}: <strong>{fmtNum(p.value)}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
            Audience — Age Split (Female)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageChartData} barSize={14}>
              <XAxis dataKey="age" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)} />
              <Tooltip content={<CustomTooltip />} />
              {accounts?.map((acc, idx) => (
                <Bar key={acc.ACCOUNT_ID} dataKey={acc.ACCOUNT_NAME} stackId="a" fill={COLORS[idx % COLORS.length]}
                  radius={idx === (accounts?.length || 0) - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
            Gender Distribution
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={genderPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" stroke="none">
                {genderPieData.map((_, idx) => (
                  <Cell key={idx} fill={GENDER_COLORS[idx % GENDER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {genderPieData.map(({ name, value }, idx) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: GENDER_COLORS[idx] }} />
                {name}: <strong style={{ color: 'var(--text-primary)' }}>{fmtNum(value)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
            Content Mix
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={typePieData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" stroke="none">
                {typePieData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {typePieData.map(({ name, value }, idx) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                {name}: <strong style={{ color: 'var(--text-primary)' }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent posts table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
          Recent Posts
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Account</th>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Date</th>
                <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Caption</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Likes</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Cmts</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Reach</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Views</th>
              </tr>
            </thead>
            <tbody>
              {(topPosts || []).slice(0, 8).map((p) => {
                const ts = p.TIMESTAMP?.value || p.TIMESTAMP;
                const dateStr = ts ? new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—';
                const color = ACCOUNT_COLORS[p.ACCOUNT_NAME] || '#EC4899';
                const captionRaw = p.MEDIA_CAPTION || '';
                const captionDisplay = captionRaw.length > 70 ? captionRaw.substring(0, 70) + '…' : captionRaw;
                return (
                  <tr key={p.MEDIA_ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px', fontWeight: 600, color, whiteSpace: 'nowrap' }}>@{p.ACCOUNT_NAME}</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{dateStr}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${color}18`, color }}>
                        {p.MEDIA_PRODUCT_TYPE}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-tertiary)', fontStyle: 'italic', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {captionDisplay || <span style={{ opacity: 0.4 }}>— no caption —</span>}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#EC4899' }}>{fmtNum(p.MEDIA_LIKE_COUNT)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtNum(p.MEDIA_COMMENTS_COUNT)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#8B5CF6' }}>{fmtNum(p.MEDIA_REACH)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtNum(p.MEDIA_VIEWS)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Audience Section ─────────────────────────────────────────────────────────

function AudienceSection({ ageGenderData, geoData, accountId }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <IG_Demographics ageGenderData={ageGenderData} accountId={accountId} />
      <IG_GeoTable geoData={geoData} accountId={accountId} limit={15} />
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function InstagramDashboard() {
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Date filter state
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false); // lighter loading for filter changes
  const [error, setError] = useState(null);

  const [data, setData] = useState({
    kpi: null, accounts: [], ageGender: [], geo: [], mediaAll: [], stories: [], topPosts: [], quickInsights: []
  });

  const dateRange = computeDateRange(dateFilter, customStart, customEnd);

  const fetchData = useCallback(async (params = {}) => {
    const { start, end, accountId } = params;
    setFilterLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (start) qs.set('start', start);
      if (end)   qs.set('end', end);
      if (accountId && accountId !== 'all') qs.set('accountId', accountId);

      const baseUrl = '/api/instagram';
      const kpiQ    = `${baseUrl}?type=kpiOverview&${qs.toString()}`;
      const accQ    = `${baseUrl}?type=accounts&${qs.toString()}`;
      const agQ    = `${baseUrl}?type=ageGender&${qs.toString()}`;
      const geoQ    = `${baseUrl}?type=geo&${qs.toString()}`;
      const mediaQ = `${baseUrl}?type=mediaAll&${qs.toString()}`;
      const storyQ = `${baseUrl}?type=mediaStories&${qs.toString()}`;
      const topQ    = `${baseUrl}?type=topPerformers&${qs.toString()}`;
      const quickQ  = `${baseUrl}?type=quickInsights&${qs.toString()}`;

      const [kpiRes, accountsRes, ageGenderRes, geoRes, mediaAllRes, storiesRes, topRes, quickRes] = await Promise.all([
        fetch(kpiQ).then(r => r.json()),
        fetch(accQ).then(r => r.json()),
        fetch(agQ).then(r => r.json()),
        fetch(geoQ).then(r => r.json()),
        fetch(mediaQ).then(r => r.json()),
        fetch(storyQ).then(r => r.json()),
        fetch(topQ).then(r => r.json()),
        fetch(quickQ).then(r => r.json()),
      ]);

      setData({
        kpi: kpiRes.data?.[0] || {},
        accounts: accountsRes.data || [],
        ageGender: ageGenderRes.data || [],
        geo: geoRes.data || [],
        mediaAll: mediaAllRes.data || [],
        stories: storiesRes.data || [],
        topPosts: topRes.data || [],
        quickInsights: quickRes.data || [],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setFilterLoading(false);
      setLoading(false);
    }
  }, []);

  // Initial load (no filters)
  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-fetch when date range or account changes — with debounce 500ms
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (loading) return; // skip during initial mount
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchData({
        start: dateRange.start,
        end: dateRange.end,
        accountId: selectedAccount,
      });
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [dateRange.start, dateRange.end, selectedAccount, fetchData, loading]);

  const handleRefresh = () => {
    fetchData({
      start: dateRange.start,
      end: dateRange.end,
      accountId: selectedAccount,
    });
  };

  // Full-page loading state (initial mount only)
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#EC4899' }} />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Loading Instagram analytics...</p>
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
          style={{ padding: '0.5rem 1rem', background: 'rgba(236,72,153,0.1)', border: '1px solid #EC4899', borderRadius: '8px', color: '#EC4899', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto', fontSize: '0.8rem', fontWeight: 600 }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const renderTabContent = () => {
    // Show subtle loading overlay when filter changes but tab content is visible
    if (filterLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#EC4899' }} />
          <span style={{ fontSize: '0.8rem' }}>Fetching data...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <OverviewSection
            accounts={data.accounts}
            quickInsights={data.quickInsights}
            topPosts={data.topPosts}
            ageGenderData={data.ageGender}
          />
        );
      case 'content':
        return <IG_ContentGrid mediaAll={data.mediaAll} />;
      case 'audience':
        return (
          <AudienceSection ageGenderData={data.ageGender} geoData={data.geo} accountId={selectedAccount} />
        );
      case 'demographics':
        return (
          <IG_Demographics ageGenderData={data.ageGender} accountId={selectedAccount} />
        );
      case 'story':
        return (
          <IG_StoryAnalytics stories={data.stories} accountId={selectedAccount} />
        );
      case 'performance':
        return (
          <IG_TopPerformers topPosts={data.topPosts} allMedia={data.mediaAll} />
        );
      default:
        return null;
    }
  };

  const accountCount = data.accounts.length;
  const postCount = data.mediaAll.length;

  return (
    <div className="fade-in">
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              📷 Instagram Analytics
            </h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>
              {accountCount} accounts · {postCount} posts tracked
              {dateFilter !== 'all' && <span style={{ color: '#EC4899', marginLeft: '0.5rem' }}>(filtered)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <DateFilterBar
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        onRefresh={handleRefresh}
        isLoading={filterLoading}
      />

      {/* KPI Cards */}
      <IG_KPICards kpi={data.kpi} accountCount={accountCount} />

      {/* Account Switcher */}
      <IG_AccountSwitcher
        accounts={data.accounts}
        selected={selectedAccount}
        onChange={setSelectedAccount}
      />

      {/* Section Tabs */}
      <IG_SectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {renderTabContent()}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}