import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from 'recharts';
import {
  Users, Eye, Heart, TrendingUp, DollarSign, RefreshCw,
  AlertCircle, BarChart2, TableIcon
} from 'lucide-react';
import { useEffect } from 'react';

// ─── Error Boundary ──────────────────────────────────────────────────────────
class ChartErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: this.props.height || 200, color: 'var(--text-secondary)',
          fontSize: '0.8rem', flexDirection: 'column', gap: '0.5rem'
        }}>
          <AlertCircle size={20} style={{ opacity: 0.4 }} />
          <span>Chart temporarily unavailable</span>
          <button onClick={() => this.setState({ hasError: false })} style={{
            background: 'var(--accent-primary)', color: '#fff', border: 'none',
            borderRadius: 6, padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.72rem'
          }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PLATFORM_COLORS = { TT: '#4F46E5', YC: '#F59E0B', IG: '#EC4899' };
const PLATFORM_LABELS = { TT: 'TikTok', YC: 'TikTok YC', IG: 'Instagram' };
const TIER_COLORS = { mega: '#6366F1', makro: '#10B981', mikro: '#F59E0B', nano: '#94A3B8' };

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmtNum = (n) => (!n && n !== 0) ? '—' : Math.round(n).toLocaleString('id-ID');
const fmtRp  = (n) => (!n && n !== 0) ? '—' : `Rp${Math.round(n).toLocaleString('id-ID')}`;
const fmtPct = (n) => (n == null)     ? '—' : `${n.toFixed(1)}%`;

// ─── Section Wrapper ─────────────────────────────────────────────────────────
const Section = ({ title, subtitle, children, style = {} }) => (
  <div className="glass-panel chart-container" style={style}>
    {title && (
      <div className="chart-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h3 className="chart-title" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h3>
          {subtitle && <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0.2rem 0 0' }}>{subtitle}</p>}
        </div>
      </div>
    )}
    {children}
  </div>
);

// ─── Empty Chart State ───────────────────────────────────────────────────────
const EmptyChart = ({ height = 200, message = 'Belum ada data' }) => (
  <div style={{
    height, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '0.5rem', color: 'var(--text-tertiary)'
  }}>
    <BarChart2 size={32} style={{ opacity: 0.2 }} />
    <span style={{ fontSize: '0.8rem' }}>{message}</span>
  </div>
);

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
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
  const [allData, setAllData]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filterBrand, setFilterBrand]       = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [filterTier, setFilterTier]         = useState('All');
  const [sortCol, setSortCol]   = useState('view');
  const [sortDir, setSortDir]   = useState('desc');
  const [page, setPage]         = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const PAGE_SIZE = 20;

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/kol-mastersheet')
      .then(r => r.json())
      .then(json => { setAllData(json.data || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  const brands = useMemo(() => [...new Set(allData.map(r => r.brand))].sort(), [allData]);

  // ── Filtered Data ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => allData.filter(r => {
    if (filterBrand !== 'All' && r.brand !== filterBrand) return false;
    if (filterPlatform !== 'All' && r.platform !== filterPlatform) return false;
    if (filterTier !== 'All' && r.tier !== filterTier.toLowerCase()) return false;
    return true;
  }), [allData, filterBrand, filterPlatform, filterTier]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const active      = filtered.filter(r => r.view > 0);
    const totalView   = filtered.reduce((s, r) => s + r.view, 0);
    const totalEng    = filtered.reduce((s, r) => s + r.engagement, 0);
    const totalRC     = filtered.reduce((s, r) => s + r.ratecard, 0);
    const avgER       = totalView > 0 ? (totalEng / totalView) * 100 : 0;
    const avgCPV      = totalView > 0 ? totalRC / totalView : 0;
    return { total: filtered.length, active: active.length, totalView, totalEng, avgER, avgCPV };
  }, [filtered]);

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const brandChartData = useMemo(() => brands.map(brand => {
    const rows = filtered.filter(r => r.brand === brand);
    return {
      brand: brand === 'Next Level' ? 'NextLevel' : brand,
      TT: rows.filter(r => r.platform === 'TT').reduce((s, r) => s + r.view, 0),
      YC: rows.filter(r => r.platform === 'YC').reduce((s, r) => s + r.view, 0),
      IG: rows.filter(r => r.platform === 'IG').reduce((s, r) => s + r.view, 0),
    };
  }).filter(d => d.TT + d.YC + d.IG > 0), [filtered, brands]);

  const platformData = useMemo(() => ['TT', 'YC', 'IG'].map(p => ({
    name: PLATFORM_LABELS[p], platform: p,
    count: filtered.filter(r => r.platform === p).length,
    views: filtered.filter(r => r.platform === p).reduce((s, r) => s + r.view, 0),
  })).filter(d => d.count > 0), [filtered]);

  const tierChartData = useMemo(() => brands.map(brand => {
    const rows  = filtered.filter(r => r.brand === brand);
    const entry = { brand: brand === 'Next Level' ? 'NxtLvl' : brand.substring(0, 7) };
    ['mega', 'makro', 'mikro', 'nano'].forEach(tier => {
      entry[tier] = rows.filter(r => r.tier === tier).length;
    });
    const total = (entry.mega || 0) + (entry.makro || 0) + (entry.mikro || 0) + (entry.nano || 0);
    return total > 0 ? entry : null;
  }).filter(Boolean), [filtered, brands]);

  const tierViewChartData = useMemo(() => brands.map(brand => {
    const rows  = filtered.filter(r => r.brand === brand);
    const entry = { brand: brand === 'Next Level' ? 'NxtLvl' : brand.substring(0, 7) };
    ['mega', 'makro', 'mikro', 'nano'].forEach(tier => {
      entry[tier] = rows.filter(r => r.tier === tier).reduce((s, r) => s + r.view, 0);
    });
    const total = (entry.mega || 0) + (entry.makro || 0) + (entry.mikro || 0) + (entry.nano || 0);
    return total > 0 ? entry : null;
  }).filter(Boolean), [filtered, brands]);

  const showNCO = filterBrand === 'All' || filterBrand === 'NCO';
  const ncoAchData = useMemo(() => {
    if (!showNCO) return [];
    return filtered
      .filter(r => r.brand === 'NCO' && r.targetViews > 0)
      .sort((a, b) => b.view - a.view)
      .slice(0, 15)
      .map(r => ({
        username: r.username.length > 16 ? r.username.substring(0, 14) + '…' : r.username,
        target: r.targetViews, actual: r.view,
        pct: r.targetViews > 0 ? (r.view / r.targetViews) * 100 : 0,
      }));
  }, [filtered, showNCO]);

  // ── Table Data ──────────────────────────────────────────────────────────────
  const sortedRows = useMemo(() => [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  }), [filtered, sortCol, sortDir]);

  const pageRows   = sortedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(0);
  };
  const sortIndicator = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="fade-in" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-secondary)'
    }}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading KOL data…</span>
    </div>
  );

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="fade-in" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: '1rem'
    }}>
      <AlertCircle size={36} style={{ color: 'var(--danger)' }} />
      <p style={{ color: 'var(--danger)', fontWeight: 600, margin: 0 }}>Gagal memuat data KOL</p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', margin: 0 }}>{error}</p>
      <button onClick={loadData} style={{
        background: 'var(--accent-primary)', color: '#fff', border: 'none',
        borderRadius: 8, padding: '0.5rem 1.5rem', cursor: 'pointer', fontWeight: 600
      }}>Coba Lagi</button>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Sticky Filter Bar ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(11,14,20,0.88)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.875rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
      }}>
        {/* Left: title + summary */}
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            KOL Performance
          </h2>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {allData.length} KOL total · {kpis.active} aktif
          </p>
        </div>

        {/* Right: filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Brand', value: filterBrand, set: setFilterBrand,
              options: [{ value: 'All', label: 'All Brands' }, ...brands.map(b => ({ value: b, label: b }))] },
            { label: 'Platform', value: filterPlatform, set: setFilterPlatform,
              options: [
                { value: 'All', label: 'All Platforms' },
                { value: 'TT', label: 'TikTok' },
                { value: 'YC', label: 'TikTok YC' },
                { value: 'IG', label: 'Instagram' },
              ]},
            { label: 'Tier', value: filterTier, set: setFilterTier,
              options: [
                { value: 'All', label: 'All Tiers' },
                { value: 'mega', label: 'Mega' },
                { value: 'makro', label: 'Makro' },
                { value: 'mikro', label: 'Mikro' },
                { value: 'nano', label: 'Nano' },
              ]},
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{f.label}</span>
              <select
                value={f.value}
                onChange={e => { f.set(e.target.value); setPage(0); }}
                className="glass-select"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
              >
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}

          <button onClick={loadData} title="Refresh" style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
            borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer',
            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center'
          }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── KPI Cards ────────────────────────────────────────────────────── */}
        <div className="kpi-grid">
          {[
            { icon: <Users size={16} />,      label: 'Total KOL',        value: kpis.total,              sub: `${kpis.active} aktif`,          color: '#4F46E5' },
            { icon: <Eye size={16} />,         label: 'Total Views',      value: fmtNum(kpis.totalView),  sub: 'sum semua KOL',                 color: '#6366F1' },
            { icon: <Heart size={16} />,       label: 'Total Engagement', value: fmtNum(kpis.totalEng),   sub: 'likes + share + comment + save', color: '#EC4899' },
            { icon: <TrendingUp size={16} />,  label: 'Avg ER%',          value: fmtPct(kpis.avgER),      sub: 'engagement / views',            color: '#10B981' },
            { icon: <DollarSign size={16} />,  label: 'Avg CPV',          value: fmtRp(kpis.avgCPV),      sub: 'ratecard / views',              color: '#F59E0B' },
          ].map((card, i) => (
            <div key={i} className="kpi-card glass-panel" style={{ '--card-accent': card.color }}>
              <div className="kpi-header">
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </span>
                <div className="kpi-icon" style={{ background: `${card.color}18`, color: card.color }}>
                  {card.icon}
                </div>
              </div>
              <div className="kpi-value" style={{ fontSize: '1.6rem' }}>{card.value}</div>
              {card.sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Tab Navigation ───────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '0.25rem', padding: '0.25rem',
          background: 'rgba(255,255,255,0.03)', borderRadius: 10,
          border: '1px solid var(--border-color)', alignSelf: 'flex-start'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart2 size={14} /> },
            { id: 'table',    label: `KOL Table (${sortedRows.length})`, icon: <TableIcon size={14} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
            }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Row 1: Views by Brand + Platform Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem' }}>

              <Section title="Views by Brand & Platform">
                {brandChartData.length === 0 ? <EmptyChart /> :
                  <ChartErrorBoundary>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={brandChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="brand" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tickFormatter={fmtNum} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={48} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        <Bar dataKey="TT" name="TikTok"    fill={PLATFORM_COLORS.TT} radius={[3,3,0,0]} maxBarSize={24} />
                        <Bar dataKey="YC" name="TikTok YC" fill={PLATFORM_COLORS.YC} radius={[3,3,0,0]} maxBarSize={24} />
                        <Bar dataKey="IG" name="Instagram" fill={PLATFORM_COLORS.IG} radius={[3,3,0,0]} maxBarSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartErrorBoundary>
                }
              </Section>

              {/* Platform Split — single donut + legend */}
              <Section title="Platform Split" subtitle="by total views">
                {platformData.length === 0 ? <EmptyChart height={180} /> :
                  <ChartErrorBoundary>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={platformData} dataKey="views" nameKey="name"
                          cx="50%" cy="50%" outerRadius={64} innerRadius={32}>
                          {platformData.map(d => <Cell key={d.platform} fill={PLATFORM_COLORS[d.platform]} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [fmtNum(v) + ' views', n]}
                          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {platformData.map(d => {
                        const totalViews = platformData.reduce((s, x) => s + x.views, 0);
                        const pct = totalViews > 0 ? (d.views / totalViews * 100).toFixed(1) : 0;
                        return (
                          <div key={d.platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[d.platform], flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{pct}%</span>
                              <span style={{ color: 'var(--text-tertiary)', marginLeft: '0.4rem', fontSize: '0.68rem' }}>
                                {d.count} KOL
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ChartErrorBoundary>
                }
              </Section>
            </div>

            {/* Row 2: NCO Achievement + Tier Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: showNCO && ncoAchData.length > 0 ? '1fr 1fr' : '1fr', gap: '1rem' }}>

              {showNCO && (
                <Section title="NCO — Target vs Actual Views" subtitle="Top 15 KOL by actual views">
                  {ncoAchData.length === 0
                    ? <EmptyChart message="Belum ada data target NCO" />
                    : <ChartErrorBoundary height={Math.max(200, ncoAchData.length * 28)}>
                        <ResponsiveContainer width="100%" height={Math.max(200, ncoAchData.length * 28)}>
                          <BarChart data={ncoAchData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                            <XAxis type="number" tickFormatter={fmtNum} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                            <YAxis type="category" dataKey="username" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={100} />
                            <Tooltip content={({ active, payload, label }) => {
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
                            }} />
                            <Bar dataKey="target" name="Target" fill="rgba(148,163,184,0.2)" radius={[0,3,3,0]} maxBarSize={12} />
                            <Bar dataKey="actual" name="Actual" maxBarSize={12} radius={[0,3,3,0]}>
                              {ncoAchData.map((d, i) => (
                                <Cell key={i} fill={d.pct >= 100 ? '#10B981' : d.pct >= 50 ? '#F59E0B' : '#EF4444'} />
                              ))}
                              <LabelList dataKey="pct" formatter={v => fmtPct(v ?? 0)} style={{ fontSize: 9, fontWeight: 700 }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartErrorBoundary>
                  }
                </Section>
              )}

              <Section title="KOL Count by Tier & Brand">
                {tierChartData.length === 0 ? <EmptyChart /> :
                  <ChartErrorBoundary>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={tierChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="brand" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={28} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        <Bar dataKey="mega"  stackId="a" fill={TIER_COLORS.mega}  name="Mega" />
                        <Bar dataKey="makro" stackId="a" fill={TIER_COLORS.makro} name="Makro" />
                        <Bar dataKey="mikro" stackId="a" fill={TIER_COLORS.mikro} name="Mikro" />
                        <Bar dataKey="nano"  stackId="a" fill={TIER_COLORS.nano}  name="Nano" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartErrorBoundary>
                }
              </Section>
            </div>

            {/* Row 3: Views by Tier & Brand */}
            <Section title="KOL Views by Tier & Brand" subtitle="total views per tier per brand">
              {tierViewChartData.length === 0 ? <EmptyChart /> :
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={tierViewChartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="brand" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                      <YAxis tickFormatter={v => {
                        if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
                        if (v >= 1_000) return (v / 1_000).toFixed(0) + 'K';
                        return v;
                      }} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={52} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                      <Bar dataKey="mega"  stackId="a" fill={TIER_COLORS.mega}  name="Mega" />
                      <Bar dataKey="makro" stackId="a" fill={TIER_COLORS.makro} name="Makro" />
                      <Bar dataKey="mikro" stackId="a" fill={TIER_COLORS.mikro} name="Mikro" />
                      <Bar dataKey="nano"  stackId="a" fill={TIER_COLORS.nano}  name="Nano" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              }
            </Section>
          </div>
        )}

        {/* ── TABLE TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'table' && (
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  KOL Performance Table
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                  {sortedRows.length} rows · page {page + 1} / {totalPages || 1}
                </p>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      { key: 'brand',       label: 'Brand' },
                      { key: 'platform',    label: 'Platform' },
                      { key: 'username',    label: 'Username' },
                      { key: 'tier',        label: 'Tier' },
                      { key: 'view',        label: 'Views' },
                      { key: 'likes',       label: 'Likes' },
                      { key: 'share',       label: 'Share' },
                      { key: 'comment',     label: 'Comment' },
                      { key: 'save',        label: 'Save' },
                      { key: 'engagement',  label: 'Engagement' },
                      { key: 'ratecard',    label: 'Ratecard' },
                      { key: 'targetViews', label: 'Target' },
                      { key: 'achievement', label: 'Ach%' },
                    ].map(col => (
                      <th key={col.key} onClick={() => handleSort(col.key)} style={{
                        cursor: 'pointer', userSelect: 'none',
                        color: sortCol === col.key ? 'var(--accent-primary)' : undefined,
                        whiteSpace: 'nowrap',
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
                      <tr key={i} className="hover-row" style={{
                        background: r.view === 0 ? 'rgba(239,68,68,0.04)' : r.achievement >= 100 ? 'rgba(16,185,129,0.04)' : undefined,
                      }}>
                        <td style={{ fontWeight: 600 }}>{r.brand}</td>
                        <td>
                          <span className="status-pill" style={{
                            background: `${PLATFORM_COLORS[r.platform]}22`,
                            color: PLATFORM_COLORS[r.platform],
                            padding: '2px 8px', borderRadius: 4,
                            fontSize: '0.7rem', fontWeight: 700,
                          }}>{r.platform}</span>
                        </td>
                        <td>
                          <div className="user-cell">
                            {r.linkPost
                              ? <a href={r.linkPost} target="_blank" rel="noreferrer"
                                  style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                                  onMouseEnter={e => e.target.style.color = PLATFORM_COLORS[r.platform]}
                                  onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}>
                                  @{r.username}
                                </a>
                              : `@${r.username}`}
                          </div>
                        </td>
                        <td>
                          <span className="tier-badge" style={{
                            color: TIER_COLORS[r.tier] || 'var(--text-secondary)',
                            background: `${TIER_COLORS[r.tier] || '#94A3B8'}15`,
                          }}>{r.tier}</span>
                        </td>
                        <td style={{ fontWeight: r.view > 0 ? 600 : 400, color: r.view > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {fmtNum(r.view)}
                        </td>
                        <td>{fmtNum(r.likes)}</td>
                        <td>{fmtNum(r.share)}</td>
                        <td>{fmtNum(r.comment)}</td>
                        <td>{fmtNum(r.save)}</td>
                        <td>{fmtNum(r.engagement)}</td>
                        <td>{fmtRp(r.ratecard)}</td>
                        <td>{r.targetViews > 0 ? fmtNum(r.targetViews) : '—'}</td>
                        <td style={{ color: achColor, fontWeight: r.achievement != null ? 700 : 400 }}>
                          {r.achievement != null ? fmtPct(r.achievement) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={13} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={28} style={{ opacity: 0.2 }} />
                          <span>Tidak ada KOL yang cocok dengan filter ini</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" style={{ justifyContent: 'center' }}>
                <div className="pagination-btns">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="glass-select" style={{ padding: '0.3rem 0.75rem', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
                    ‹ Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                    return (
                      <button key={p} onClick={() => setPage(p)} className="glass-select" style={{
                        padding: '0.3rem 0.75rem', cursor: 'pointer',
                        background: p === page ? 'var(--accent-primary)' : undefined,
                        color: p === page ? '#fff' : undefined,
                        fontWeight: p === page ? 700 : 400,
                      }}>{p + 1}</button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                    className="glass-select" style={{ padding: '0.3rem 0.75rem', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1 }}>
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .kpi-card::before { opacity: 0; background: var(--card-accent, var(--accent-primary)); }
        .kpi-card:hover::before { opacity: 1; }
      `}</style>
    </div>
  );
};
