import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ZAxis
} from 'recharts';
import { TrendingUp, Eye, DollarSign, BarChart2, Target, Zap } from 'lucide-react';

const API = '/api/bigquery';

const BRAND_LABELS = {
  'EJI // HANASUI // SKINCARE': 'Skincare',
  'EJI // HANASUI // DECORATIVE': 'Decorative',
  'EJI // HANASUI // BODYCARE': 'Bodycare',
};

const BRAND_COLORS = ['#4F46E5', '#10B981', '#F59E0B'];

const PLACEMENT_LABELS = {
  instagram_reels: 'IG Reels',
  instagram_stories: 'IG Stories',
  instagram_explore_grid_home: 'IG Explore',
  instagram_search: 'IG Search',
  feed: 'Feed',
  facebook_reels: 'FB Reels',
  facebook_stories: 'FB Stories',
  facebook_reels_overlay: 'FB Reels Overlay',
  instream_video: 'FB Instream Video',
  marketplace: 'FB Marketplace',
  search: 'FB Search',
  threads_feed: 'Threads Feed',
  rewarded_video: 'AN Rewarded Video',
  an_classic: 'AN Classic',
};

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function fmtRp(n) {
  if (!n) return 'Rp0';
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}K`;
  return `Rp${n}`;
}

function fmtDate(d) {
  if (!d) return '';
  const s = String(d);
  const parts = s.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return s;
}

const KPICard = ({ icon, label, value, sub, accent }) => (
  <div className="glass-panel kpi-card" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <div style={{ padding: '6px', background: accent ? 'rgba(16,185,129,0.12)' : 'rgba(79,70,229,0.1)', borderRadius: '6px', color: accent || 'var(--accent-primary)' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.2)' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.85rem', color: p.color || p.fill, fontWeight: 600 }}>
          {p.name}: {fmtRp(p.value)}
        </div>
      ))}
    </div>
  );
};

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.2)' }}>
      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{BRAND_LABELS[d.ACCOUNT_NAME] || d.ACCOUNT_NAME}</p>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Spend: {fmtRp(d.spend)}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CPM: {fmtRp(d.cpm)}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reach: {fmt(d.reach)}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Impressions: {fmt(d.impressions)}</div>
    </div>
  );
};

const ROASBadge = ({ roas }) => {
  if (!roas || roas <= 0) return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>;
  const color = roas >= 3 ? '#10B981' : roas >= 1 ? '#F59E0B' : '#EF4444';
  const bg = roas >= 3 ? 'rgba(16,185,129,0.1)' : roas >= 1 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color, background: bg }}>
      {roas.toFixed(1)}x
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
      color: isActive ? '#10B981' : '#94A3B8',
      background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
    }}>
      {isActive ? 'Active' : 'Paused'}
    </span>
  );
};

export const BrandCommandCenter = ({ start, end }) => {
  const [overview, setOverview] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [placementData, setPlacementData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [pacingData, setPacingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = `start=${start}&end=${end}`;
    Promise.all([
      fetch(`${API}?type=brandOverview&${params}`).then(r => r.json()),
      fetch(`${API}?type=brandPlatform&${params}`).then(r => r.json()),
      fetch(`${API}?type=campaigns&${params}`).then(r => r.json()),
      fetch(`${API}?type=placement&${params}`).then(r => r.json()),
      fetch(`${API}?type=trend&${params}`).then(r => r.json()),
      fetch(`${API}?type=pacing&${params}`).then(r => r.json()),
    ]).then(([ov, pl, cam, plc, tr, pac]) => {
      setOverview(ov.data || []);
      setPlatformData(pl.data || []);
      setCampaigns(cam.data || []);
      setPlacementData(plc.data || []);
      setTrendData(tr.data || []);
      setPacingData(pac.data || []);
      setLoading(false);
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, [start, end]);

  const kpis = useMemo(() => {
    const totalSpend = overview.reduce((s, d) => s + (d.spend || 0), 0);
    const totalReach = overview.reduce((s, d) => s + (d.reach || 0), 0);
    const totalImpr = overview.reduce((s, d) => s + (d.impressions || 0), 0);
    const avgCpm = totalImpr > 0 ? (totalSpend / totalImpr) * 1000 : 0;
    const totalPurchaseValue = overview.reduce((s, d) => s + (d.purchase_value || 0), 0);
    const roas = totalSpend > 0 && totalPurchaseValue > 0 ? totalPurchaseValue / totalSpend : 0;
    return { totalSpend, totalReach, totalImpr, avgCpm, totalPurchaseValue, roas };
  }, [overview]);

  const brandPlatformChart = useMemo(() => {
    const brands = [...new Set(platformData.map(d => d.ACCOUNT_NAME))];
    const platforms = ['instagram', 'facebook', 'audience_network'];
    return brands.map(brand => {
      const row = { brand: BRAND_LABELS[brand] || brand };
      platforms.forEach(plat => {
        const found = platformData.find(d => d.ACCOUNT_NAME === brand && d.PUBLISHER_PLATFORM === plat);
        row[plat] = found?.spend || 0;
      });
      return row;
    });
  }, [platformData]);

  const scatterData = useMemo(() => overview.map((d, i) => ({
    ...d,
    cpm: d.impressions > 0 ? Math.round((d.spend / d.impressions) * 1000) : 0,
    reachPerRp: d.spend > 0 ? Math.round((d.reach / d.spend) * 1000) : 0,
    color: BRAND_COLORS[i % BRAND_COLORS.length],
  })), [overview]);

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const av = a[sortKey] || 0; const bv = b[sortKey] || 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [campaigns, sortKey, sortDir]);

  const pagedCampaigns = sortedCampaigns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedCampaigns.length / PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Pivot trend data: [{date, Skincare, Decorative, Bodycare}]
  const trendChartData = useMemo(() => {
    const byDate = {};
    trendData.forEach(row => {
      const d = String(row.date || '');
      if (!byDate[d]) byDate[d] = { date: d };
      byDate[d][BRAND_LABELS[row.ACCOUNT_NAME] || row.ACCOUNT_NAME] = row.spend || 0;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [trendData]);

  // Placement table: enrich with ROAS and CPM
  const placementTableData = useMemo(() => placementData
    .filter(d => d.PLATFORM_POSITION)
    .map(d => ({
      ...d,
      label: PLACEMENT_LABELS[d.PLATFORM_POSITION] || d.PLATFORM_POSITION.replace(/_/g, ' '),
      roas: d.purchase_value && d.spend > 0 ? d.purchase_value / d.spend : 0,
      cpm: d.impressions > 0 ? Math.round((d.spend / d.impressions) * 1000) : 0,
    })), [placementData]);

  // Pacing: compute days in range for % calculation
  const numDays = useMemo(() => {
    const ms = new Date(end) - new Date(start);
    return Math.max(1, Math.round(ms / 86400000) + 1);
  }, [start, end]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-secondary)' }}>
      Loading BigQuery data...
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444' }}>
      Error: {error}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard icon={<DollarSign size={16} />} label="Total Spend" value={fmtRp(kpis.totalSpend)} sub="All 3 accounts" />
        <KPICard icon={<Eye size={16} />} label="Total Reach" value={fmt(kpis.totalReach)} sub="Unique people" />
        <KPICard icon={<TrendingUp size={16} />} label="Total Impressions" value={fmt(kpis.totalImpr)} sub="All placements" />
        <KPICard icon={<BarChart2 size={16} />} label="Avg CPM" value={fmtRp(Math.round(kpis.avgCpm))} sub="Cost per 1K impressions" />
        <KPICard
          icon={<Target size={16} />}
          label="Blended ROAS"
          value={kpis.roas > 0 ? `${kpis.roas.toFixed(2)}x` : '—'}
          sub={kpis.totalPurchaseValue > 0 ? `${fmtRp(kpis.totalPurchaseValue)} purchase value` : 'No pixel data'}
          accent={kpis.roas >= 1 ? '#10B981' : undefined}
        />
      </div>

      {/* Charts row */}
      <div className="charts-grid">
        {/* Grouped Bar: Spend by Brand × Platform */}
        <div className="glass-panel chart-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Spend by Brand × Platform
          </h3>
          <div style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={brandPlatformChart} barGap={4} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="brand" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={v => fmtRp(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Bar dataKey="instagram" name="Instagram" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="facebook" name="Facebook" fill="#1877F2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="audience_network" name="Audience Network" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter: Brand Efficiency Matrix */}
        <div className="glass-panel chart-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Brand Efficiency Matrix
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            X: CPM (lower = cheaper) · Y: Reach per Rp×1K · Size: Impressions
          </p>
          <div style={{ minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="cpm" name="CPM" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={v => `Rp${v}`} label={{ value: 'CPM (Rp)', position: 'insideBottom', offset: -5, fill: 'var(--text-tertiary)', fontSize: 11 }} />
                <YAxis dataKey="reachPerRp" name="Reach/Rp" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} label={{ value: 'Reach/Rp×1K', angle: -90, position: 'insideLeft', fill: 'var(--text-tertiary)', fontSize: 11 }} />
                <ZAxis dataKey="impressions" range={[400, 2000]} />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={d.color} fillOpacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {scatterData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                {BRAND_LABELS[d.ACCOUNT_NAME] || d.ACCOUNT_NAME}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spend Trend */}
      {trendChartData.length > 0 && (
        <div className="glass-panel chart-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Daily Spend Trend
          </h3>
          <div style={{ minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  {['Skincare', 'Decorative', 'Bodycare'].map((name, i) => (
                    <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND_COLORS[i]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={BRAND_COLORS[i]} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} tickFormatter={fmtDate} interval="preserveStartEnd" />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} tickFormatter={v => fmtRp(v)} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingTop: '8px' }} />
                {['Skincare', 'Decorative', 'Bodycare'].map((name, i) => (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={BRAND_COLORS[i]}
                    strokeWidth={2}
                    fill={`url(#grad-${name})`}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Placement Intelligence */}
      <div className="glass-panel chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Placement Intelligence</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>ROAS & efficiency by ad placement</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> ≥3x
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block', marginLeft: '6px' }} /> 1–3x
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', marginLeft: '6px' }} /> &lt;1x
          </div>
        </div>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Placement</th>
                <th>Platform</th>
                <th>Spend</th>
                <th>Impressions</th>
                <th>Reach</th>
                <th>Purchases</th>
                <th>Purchase Value</th>
                <th>ROAS</th>
                <th>CPM</th>
              </tr>
            </thead>
            <tbody>
              {placementTableData.map((d, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, fontSize: '0.8rem' }}>{d.label}</td>
                  <td>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                      color: d.PUBLISHER_PLATFORM === 'instagram' ? '#4F46E5' : d.PUBLISHER_PLATFORM === 'facebook' ? '#1877F2' : d.PUBLISHER_PLATFORM === 'threads' ? '#94A3B8' : '#10B981',
                      background: d.PUBLISHER_PLATFORM === 'instagram' ? 'rgba(79,70,229,0.1)' : d.PUBLISHER_PLATFORM === 'facebook' ? 'rgba(24,119,242,0.1)' : 'rgba(16,185,129,0.1)',
                    }}>
                      {d.PUBLISHER_PLATFORM}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmtRp(d.spend)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{fmt(d.impressions)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{fmt(d.reach)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{d.purchases ?? '—'}</td>
                  <td style={{ fontWeight: d.purchase_value ? 600 : 400, color: d.purchase_value ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {d.purchase_value ? fmtRp(d.purchase_value) : '—'}
                  </td>
                  <td><ROASBadge roas={d.roas} /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{fmtRp(d.cpm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Campaigns Table */}
      <div className="glass-panel chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Top Campaigns</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sortedCampaigns.length} campaigns</span>
        </div>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {[
                  { key: null, label: 'Brand' },
                  { key: null, label: 'Campaign' },
                  { key: null, label: 'Objective' },
                  { key: 'spend', label: 'Spend' },
                  { key: 'reach', label: 'Reach' },
                  { key: 'impressions', label: 'Impressions' },
                  { key: 'clicks', label: 'Clicks' },
                  { key: 'cpm', label: 'CPM' },
                ].map(col => (
                  <th
                    key={col.label}
                    onClick={col.key ? () => handleSort(col.key) : undefined}
                    style={{ cursor: col.key ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}
                  >
                    {col.label} {col.key && sortKey === col.key && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedCampaigns.map((c, i) => {
                const cpm = c.impressions > 0 ? Math.round((c.spend / c.impressions) * 1000) : 0;
                return (
                  <tr key={i}>
                    <td>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                        background: c.ACCOUNT_NAME?.includes('SKINCARE') ? 'rgba(79,70,229,0.1)' :
                          c.ACCOUNT_NAME?.includes('DECORATIVE') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: c.ACCOUNT_NAME?.includes('SKINCARE') ? '#4F46E5' :
                          c.ACCOUNT_NAME?.includes('DECORATIVE') ? '#10B981' : '#F59E0B',
                      }}>
                        {BRAND_LABELS[c.ACCOUNT_NAME] || c.ACCOUNT_NAME}
                      </span>
                    </td>
                    <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }} title={c.CAMPAIGN_NAME}>{c.CAMPAIGN_NAME}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.CAMPAIGN_OBJECTIVE?.replace('OUTCOME_', '')}</td>
                    <td style={{ fontWeight: 600 }}>{fmtRp(c.spend)}</td>
                    <td>{fmt(c.reach)}</td>
                    <td>{fmt(c.impressions)}</td>
                    <td>{fmt(c.clicks)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmtRp(cpm)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              ←
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
              →
            </button>
          </div>
        )}
      </div>

      {/* Budget Pacing */}
      {pacingData.length > 0 && (
        <div className="glass-panel chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Campaign Budget Pacing</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Spend vs. daily budget × {numDays} days</p>
            </div>
          </div>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Brand</th>
                  <th>Status</th>
                  <th>Daily Budget</th>
                  <th>Period Spend</th>
                  <th>Pacing</th>
                  <th>Budget Remaining</th>
                </tr>
              </thead>
              <tbody>
                {pacingData.map((d, i) => {
                  const budget = (d.CAMPAIGN_DAILY_BUDGET || 0) * numDays;
                  const pct = budget > 0 ? Math.min(100, Math.round((d.total_spend / budget) * 100)) : 0;
                  const pacingColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981';
                  return (
                    <tr key={i}>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }} title={d.CAMPAIGN_NAME}>
                        {d.CAMPAIGN_NAME}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                          background: d.ACCOUNT_NAME?.includes('SKINCARE') ? 'rgba(79,70,229,0.1)' :
                            d.ACCOUNT_NAME?.includes('DECORATIVE') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: d.ACCOUNT_NAME?.includes('SKINCARE') ? '#4F46E5' :
                            d.ACCOUNT_NAME?.includes('DECORATIVE') ? '#10B981' : '#F59E0B',
                        }}>
                          {BRAND_LABELS[d.ACCOUNT_NAME] || d.ACCOUNT_NAME}
                        </span>
                      </td>
                      <td><StatusBadge status={d.CAMPAIGN_STATUS} /></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{fmtRp(d.CAMPAIGN_DAILY_BUDGET)}/day</td>
                      <td style={{ fontWeight: 600 }}>{fmtRp(d.total_spend)}</td>
                      <td style={{ minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pacingColor, borderRadius: '4px', transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: pacingColor, fontWeight: 600, minWidth: '34px' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ color: d.CAMPAIGN_BUDGET_REMAINING < 10000 ? '#EF4444' : 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {fmtRp(d.CAMPAIGN_BUDGET_REMAINING)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
