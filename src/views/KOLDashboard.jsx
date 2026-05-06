import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from 'recharts';
import {
  Users, Eye, Heart, TrendingUp, DollarSign, Target, RefreshCw
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────

const PLATFORM_COLORS = { TT: '#4F46E5', YC: '#F59E0B', IG: '#EC4899' };
const PLATFORM_LABELS = { TT: 'TikTok', YC: 'TikTok YC', IG: 'Instagram' };
const TIER_COLORS = { mega: '#6366F1', makro: '#10B981', mikro: '#F59E0B', nano: '#94A3B8' };

// ─── Formatters ──────────────────────────────────────────────────────────────

const fmtNum = (n) => {
  if (!n && n !== 0) return '—';
  return Math.round(n).toLocaleString('id-ID');
};

const fmtRp = (n) => {
  if (!n && n !== 0) return '—';
  return `Rp${Math.round(n).toLocaleString('id-ID')}`;
};

const fmtPct = (n) => (n == null ? '—' : `${n.toFixed(1)}%`);

// ─── Sub-components ──────────────────────────────────────────────────────────

const KPICard = ({ icon, label, value, sub, color }) => (
  <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ padding: '6px', background: `${color || '#4F46E5'}20`, borderRadius: '8px', color: color || '#4F46E5', display: 'flex' }}>
        {icon}
      </div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{sub}</div>}
  </div>
);

const FilterChip = ({ label, value, options, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="glass-select"
      style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem', borderRadius: '6px' }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', fontSize: '0.78rem', minWidth: 140 }}>
      <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{fmtNum(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const KOLDashboard = () => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [sortCol, setSortCol] = useState('view');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetch('/api/kol-mastersheet')
      .then(r => r.json())
      .then(json => {
        setAllData(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const brands = useMemo(() => [...new Set(allData.map(r => r.brand))].sort(), [allData]);

  // ── Filtered Data ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allData.filter(r => {
      if (filterBrand !== 'All' && r.brand !== filterBrand) return false;
      if (filterPlatform !== 'All' && r.platform !== filterPlatform) return false;
      if (filterTier !== 'All' && r.tier !== filterTier.toLowerCase()) return false;
      return true;
    });
  }, [allData, filterBrand, filterPlatform, filterTier]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active = filtered.filter(r => r.view > 0);
    const totalView = filtered.reduce((s, r) => s + r.view, 0);
    const totalEng = filtered.reduce((s, r) => s + r.engagement, 0);
    const totalRatecard = filtered.reduce((s, r) => s + r.ratecard, 0);
    const avgER = totalView > 0 ? (totalEng / totalView) * 100 : 0;
    const avgCPV = totalView > 0 ? totalRatecard / totalView : 0;

    const ncoWithTarget = filtered.filter(r => r.brand === 'NCO' && r.targetViews > 0 && r.view > 0);
    const ncoAch = ncoWithTarget.length > 0
      ? ncoWithTarget.reduce((s, r) => s + (r.view / r.targetViews) * 100, 0) / ncoWithTarget.length
      : null;

    return { total: filtered.length, active: active.length, totalView, totalEng, avgER, avgCPV, ncoAch };
  }, [filtered]);

  // ── Views by Brand chart data ──────────────────────────────────────────────
  const brandChartData = useMemo(() => {
    return brands.map(brand => {
      const rows = filtered.filter(r => r.brand === brand);
      return {
        brand: brand === 'Next Level' ? 'NextLevel' : brand,
        TT: rows.filter(r => r.platform === 'TT').reduce((s, r) => s + r.view, 0),
        YC: rows.filter(r => r.platform === 'YC').reduce((s, r) => s + r.view, 0),
        IG: rows.filter(r => r.platform === 'IG').reduce((s, r) => s + r.view, 0),
      };
    }).filter(d => d.TT + d.YC + d.IG > 0);
  }, [filtered, brands]);

  // ── Platform donut data ────────────────────────────────────────────────────
  const platformData = useMemo(() => {
    return ['TT', 'YC', 'IG'].map(p => ({
      name: PLATFORM_LABELS[p],
      platform: p,
      count: filtered.filter(r => r.platform === p).length,
      views: filtered.filter(r => r.platform === p).reduce((s, r) => s + r.view, 0),
    })).filter(d => d.count > 0);
  }, [filtered]);

  // ── Tier stacked bar data ──────────────────────────────────────────────────
  const tierChartData = useMemo(() => {
    return brands.map(brand => {
      const rows = filtered.filter(r => r.brand === brand);
      const entry = { brand: brand === 'Next Level' ? 'NxtLvl' : brand.substring(0, 7) };
      ['mega', 'makro', 'mikro', 'nano'].forEach(tier => {
        entry[tier] = rows.filter(r => r.tier === tier).length;
      });
      const total = (entry.mega || 0) + (entry.makro || 0) + (entry.mikro || 0) + (entry.nano || 0);
      return total > 0 ? entry : null;
    }).filter(Boolean);
  }, [filtered, brands]);

  // ── NCO Target vs Achievement data ────────────────────────────────────────
  const ncoAchData = useMemo(() => {
    const showNCO = filterBrand === 'All' || filterBrand === 'NCO';
    if (!showNCO) return [];
    return filtered
      .filter(r => r.brand === 'NCO' && r.targetViews > 0)
      .sort((a, b) => b.view - a.view)
      .slice(0, 15)
      .map(r => ({
        username: r.username.length > 16 ? r.username.substring(0, 14) + '…' : r.username,
        target: r.targetViews,
        actual: r.view,
        pct: r.targetViews > 0 ? (r.view / r.targetViews) * 100 : 0,
      }));
  }, [filtered, filterBrand]);

  // ── Sorted Table Data ──────────────────────────────────────────────────────
  const sortedRows = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? 0;
      const vb = b[sortCol] ?? 0;
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [filtered, sortCol, sortDir]);

  const pageRows = sortedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(0);
  };

  const sortIndicator = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--text-secondary)' }}>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
      <span>Loading KOL data…</span>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', color: '#EF4444' }}>
      <strong>Error:</strong> {error}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>KOL Performance Dashboard</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {allData.length} KOL total · {kpis.active} aktif · TT / YC / IG
          </p>
        </div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterChip
            label="Brand"
            value={filterBrand}
            onChange={v => { setFilterBrand(v); setPage(0); }}
            options={[{ value: 'All', label: 'All Brands' }, ...brands.map(b => ({ value: b, label: b }))]}
          />
          <FilterChip
            label="Platform"
            value={filterPlatform}
            onChange={v => { setFilterPlatform(v); setPage(0); }}
            options={[
              { value: 'All', label: 'All Platforms' },
              { value: 'TT', label: 'TikTok (TT)' },
              { value: 'YC', label: 'TikTok YC (YC)' },
              { value: 'IG', label: 'Instagram (IG)' },
            ]}
          />
          <FilterChip
            label="Tier"
            value={filterTier}
            onChange={v => { setFilterTier(v); setPage(0); }}
            options={[
              { value: 'All', label: 'All Tiers' },
              { value: 'mega', label: 'Mega' },
              { value: 'makro', label: 'Makro' },
              { value: 'mikro', label: 'Mikro' },
              { value: 'nano', label: 'Nano' },
            ]}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <KPICard icon={<Users size={16} />} label="Total KOL" value={kpis.total}
          sub={`${kpis.active} aktif (punya views)`} color="#4F46E5" />
        <KPICard icon={<Eye size={16} />} label="Total Views" value={fmtNum(kpis.totalView)}
          sub="sum semua KOL" color="#4F46E5" />
        <KPICard icon={<Heart size={16} />} label="Total Engagement" value={fmtNum(kpis.totalEng)}
          sub="likes + share + comment + save" color="#EC4899" />
        <KPICard icon={<TrendingUp size={16} />} label="Avg ER%" value={fmtPct(kpis.avgER)}
          sub="engagement / views" color="#10B981" />
        <KPICard icon={<DollarSign size={16} />} label="Avg CPV" value={fmtRp(kpis.avgCPV)}
          sub="ratecard / views" color="#F59E0B" />
      </div>

      {/* Row: Views by Brand + Platform Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
        {/* Views by Brand */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Views by Brand & Platform
          </h3>
          {brandChartData.length === 0
            ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>Belum ada data views</div>
            : <ResponsiveContainer width="100%" height={240}>
                <BarChart data={brandChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="brand" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <YAxis tickFormatter={fmtNum} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={48} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="TT" name="TikTok" fill={PLATFORM_COLORS.TT} radius={[3, 3, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="YC" name="TikTok YC" fill={PLATFORM_COLORS.YC} radius={[3, 3, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="IG" name="Instagram" fill={PLATFORM_COLORS.IG} radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Platform Split */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Platform Split
          </h3>
          {platformData.length === 0
            ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>No data</div>
            : <>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>by KOL Count</div>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={platformData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={44} innerRadius={22}>
                      {platformData.map(d => <Cell key={d.platform} fill={PLATFORM_COLORS[d.platform]} />)}
                      <LabelList dataKey="count" position="inside" style={{ fontSize: 10, fill: '#fff', fontWeight: 700 }} />
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + ' KOLs', n]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>by Total Views</div>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={platformData} dataKey="views" nameKey="name" cx="50%" cy="50%" outerRadius={44} innerRadius={22}>
                      {platformData.map(d => <Cell key={d.platform} fill={PLATFORM_COLORS[d.platform]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [fmtNum(v), n]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                  {platformData.map(d => (
                    <div key={d.platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[d.platform] }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.count} · {fmtNum(d.views)}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>

      {/* Row: NCO Achievement + Tier Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* NCO Target vs Achievement */}
        {(filterBrand === 'All' || filterBrand === 'NCO') && (
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              NCO — Target vs Actual Views (Top 15)
            </h3>
            {ncoAchData.length === 0
              ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>Belum ada data target NCO</div>
              : <ResponsiveContainer width="100%" height={Math.max(200, ncoAchData.length * 28)}>
                  <BarChart data={ncoAchData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tickFormatter={fmtNum} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                    <YAxis type="category" dataKey="username" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={100} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const d = ncoAchData.find(r => r.username === label);
                        return (
                          <div className="glass-panel" style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{label}</div>
                            <div>Target: {fmtNum(d?.target)}</div>
                            <div>Actual: {fmtNum(d?.actual)}</div>
                            <div style={{ fontWeight: 700, color: d?.pct >= 100 ? '#10B981' : d?.pct >= 50 ? '#F59E0B' : '#EF4444' }}>
                              Achievement: {fmtPct(d?.pct)}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="target" name="Target" fill="rgba(148,163,184,0.25)" radius={[0, 3, 3, 0]} maxBarSize={12} />
                    <Bar dataKey="actual" name="Actual" maxBarSize={12} radius={[0, 3, 3, 0]}>
                      {ncoAchData.map((d, i) => (
                        <Cell key={i} fill={d.pct >= 100 ? '#10B981' : d.pct >= 50 ? '#F59E0B' : '#EF4444'} />
                      ))}
                      <LabelList
                        content={({ x, y, width, height, index }) => {
                          const d = ncoAchData[index];
                          return (
                            <text x={x + width + 6} y={y + height / 2 + 4} fill={d.pct >= 100 ? '#10B981' : d.pct >= 50 ? '#F59E0B' : '#EF4444'}
                              fontSize={9} fontWeight={700}>
                              {fmtPct(d.pct)}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            }
          </div>
        )}

        {/* Tier Breakdown */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            KOL Count by Tier & Brand
          </h3>
          {tierChartData.length === 0
            ? <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>No data</div>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tierChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="brand" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Bar dataKey="mega" stackId="a" fill={TIER_COLORS.mega} name="Mega" />
                  <Bar dataKey="makro" stackId="a" fill={TIER_COLORS.makro} name="Makro" />
                  <Bar dataKey="mikro" stackId="a" fill={TIER_COLORS.mikro} name="Mikro" />
                  <Bar dataKey="nano" stackId="a" fill={TIER_COLORS.nano} name="Nano" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* KOL Performance Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            KOL Performance Table
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {sortedRows.length} rows · page {page + 1}/{totalPages || 1}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {[
                  { key: 'brand', label: 'Brand' },
                  { key: 'platform', label: 'Platform' },
                  { key: 'username', label: 'Username' },
                  { key: 'tier', label: 'Tier' },
                  { key: 'view', label: 'Views' },
                  { key: 'likes', label: 'Likes' },
                  { key: 'share', label: 'Share' },
                  { key: 'comment', label: 'Comment' },
                  { key: 'save', label: 'Save' },
                  { key: 'engagement', label: 'Eng.' },
                  { key: 'ratecard', label: 'Ratecard' },
                  { key: 'targetViews', label: 'Target' },
                  { key: 'achievement', label: 'Ach%' },
                ].map(col => (
                  <th key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      padding: '0.5rem 0.75rem', textAlign: 'left', cursor: 'pointer',
                      color: sortCol === col.key ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: 600, userSelect: 'none', whiteSpace: 'nowrap',
                      fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>
                    {col.label}{sortIndicator(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => {
                const achColor = r.achievement == null ? 'var(--text-secondary)'
                  : r.achievement >= 100 ? '#10B981' : r.achievement >= 50 ? '#F59E0B' : '#EF4444';
                return (
                  <tr key={i} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: r.view === 0 ? 'rgba(239,68,68,0.04)' : r.achievement >= 100 ? 'rgba(16,185,129,0.04)' : 'transparent',
                  }}>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{r.brand}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4,
                        background: `${PLATFORM_COLORS[r.platform]}22`,
                        color: PLATFORM_COLORS[r.platform],
                        fontWeight: 700, fontSize: '0.7rem'
                      }}>{r.platform}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}>
                      {r.linkPost
                        ? <a href={r.linkPost} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                            onMouseEnter={e => e.target.style.color = PLATFORM_COLORS[r.platform]}
                            onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}>
                            @{r.username}
                          </a>
                        : `@${r.username}`}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: TIER_COLORS[r.tier] || 'var(--text-secondary)', textTransform: 'capitalize' }}>{r.tier}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: r.view > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: r.view > 0 ? 600 : 400 }}>{fmtNum(r.view)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{fmtNum(r.likes)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{fmtNum(r.share)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{fmtNum(r.comment)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{fmtNum(r.save)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{fmtNum(r.engagement)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{fmtRp(r.ratecard)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{r.targetViews > 0 ? fmtNum(r.targetViews) : '—'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: achColor, fontWeight: r.achievement != null ? 700 : 400 }}>
                      {r.achievement != null ? fmtPct(r.achievement) : '—'}
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={13} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="glass-select"
              style={{ padding: '0.3rem 0.8rem', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className="glass-select"
                  style={{
                    padding: '0.3rem 0.75rem', cursor: 'pointer',
                    background: p === page ? 'var(--accent-primary)' : undefined,
                    color: p === page ? '#fff' : undefined,
                    fontWeight: p === page ? 700 : 400
                  }}>
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="glass-select"
              style={{ padding: '0.3rem 0.8rem', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1 }}>
              ›
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
