import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ZAxis
} from 'recharts';
import { TrendingUp, Eye, DollarSign, BarChart2 } from 'lucide-react';

const API = '/api/bigquery';

const BRAND_LABELS = {
  'EJI // HANASUI // SKINCARE': 'Skincare',
  'EJI // HANASUI // DECORATIVE': 'Decorative',
  'EJI // HANASUI // BODYCARE': 'Bodycare',
};

const BRAND_COLORS = ['#4F46E5', '#10B981', '#F59E0B'];

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

const KPICard = ({ icon, label, value, sub }) => (
  <div className="glass-panel kpi-card" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <div style={{ padding: '6px', background: 'rgba(79,70,229,0.1)', borderRadius: '6px', color: 'var(--accent-primary)' }}>{icon}</div>
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
        <div key={i} style={{ fontSize: '0.85rem', color: p.color, fontWeight: 600 }}>
          {p.name}: {p.name.toLowerCase().includes('spend') ? fmtRp(p.value) : fmt(p.value)}
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

export const BrandCommandCenter = ({ start, end }) => {
  const [overview, setOverview] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
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
    ]).then(([ov, pl, cam]) => {
      setOverview(ov.data || []);
      setPlatformData(pl.data || []);
      setCampaigns(cam.data || []);
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
    return { totalSpend, totalReach, totalImpr, avgCpm };
  }, [overview]);

  // Group platform data by brand for grouped bar chart
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

  // Scatter data: CPM vs Reach/spend, bubble = impressions
  const scatterData = useMemo(() => overview.map((d, i) => ({
    ...d,
    cpm: d.impressions > 0 ? Math.round((d.spend / d.impressions) * 1000) : 0,
    reachPerRp: d.spend > 0 ? Math.round((d.reach / d.spend) * 1000) : 0,
    color: BRAND_COLORS[i % BRAND_COLORS.length],
  })), [overview]);

  // Sorted + paginated campaigns table
  const sortedCampaigns = useMemo(() => {
    const sorted = [...campaigns].sort((a, b) => {
      const av = a[sortKey] || 0; const bv = b[sortKey] || 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return sorted;
  }, [campaigns, sortKey, sortDir]);

  const pagedCampaigns = sortedCampaigns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedCampaigns.length / PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

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
          {/* Legend */}
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
    </div>
  );
};
