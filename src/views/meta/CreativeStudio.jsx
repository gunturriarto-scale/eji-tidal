import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Film, TrendingUp, ShoppingCart, Play, Clock, Zap } from 'lucide-react';

const API = '/api/bigquery';

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

const FUNNEL_COLORS = {
  p25: 'rgba(99,102,241,0.4)',
  p50: 'rgba(99,102,241,0.55)',
  p75: 'rgba(99,102,241,0.7)',
  p100: 'rgba(79,70,229,0.85)',
  thruplay: '#4F46E5',
};

const ACTION_LABELS = {
  'post_engagement': 'Post Engagement',
  'link_click': 'Link Clicks',
  'offsite_conversion.fb_pixel_add_to_cart': 'Add to Cart',
  'offsite_conversion.fb_pixel_purchase': 'Purchase',
};
const ACTION_COLORS = ['#4F46E5', '#6366F1', '#10B981', '#F59E0B'];

const CTA_LABELS = {
  SHOP_NOW: 'Shop Now',
  ORDER_NOW: 'Order Now',
  LEARN_MORE: 'Learn More',
  WHATSAPP_MESSAGE: 'WhatsApp',
  SEE_DETAILS: 'See Details',
  BUY_NOW: 'Buy Now',
};

const FORMAT_LABELS = {
  VIDEO: 'Video',
  SHARE: 'Image/Carousel',
};

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
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.2)', minWidth: '180px' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.8rem', color: p.fill || 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const ThruPlayBadge = ({ rate }) => {
  const pct = Math.round(rate * 100);
  const color = pct >= 40 ? '#10B981' : pct >= 20 ? '#F59E0B' : '#EF4444';
  const bg = pct >= 40 ? 'rgba(16,185,129,0.1)' : pct >= 20 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color, background: bg }}>
      {pct}%
    </span>
  );
};

const ROASBadge = ({ roas }) => {
  if (!roas || roas <= 0) return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>;
  const color = roas >= 5 ? '#10B981' : roas >= 1 ? '#F59E0B' : '#EF4444';
  const bg = roas >= 5 ? 'rgba(16,185,129,0.1)' : roas >= 1 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color, background: bg }}>
      {roas.toFixed(1)}x
    </span>
  );
};

function shortName(name) {
  if (!name) return '';
  const parts = name.split('//').map(s => s.trim());
  return parts.slice(-2).join(' // ').substring(0, 40);
}

export const CreativeStudio = ({ start, end, account }) => {
  const [videoData, setVideoData] = useState([]);
  const [convData, setConvData] = useState([]);
  const [ctaData, setCtaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState('video_views');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = `start=${start}&end=${end}&account=${encodeURIComponent(account)}`;
    Promise.all([
      fetch(`${API}?type=videoFunnel&${params}`).then(r => r.json()),
      fetch(`${API}?type=conversions&${params}`).then(r => r.json()),
      fetch(`${API}?type=ctaPerformance&${params}`).then(r => r.json()),
    ]).then(([v, c, cta]) => {
      setVideoData(v.data || []);
      setConvData(c.data || []);
      setCtaData(cta.data || []);
      setLoading(false);
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, [start, end, account]);

  const kpis = useMemo(() => {
    const totalViews = videoData.reduce((s, d) => s + (Number(d.video_views) || 0), 0);
    const totalThruplay = videoData.reduce((s, d) => s + (Number(d.thruplay) || 0), 0);
    const avgThruRate = totalViews > 0 ? totalThruplay / totalViews : 0;
    const topCreative = videoData[0] ? shortName(videoData[0].AD_NAME) : '-';

    const atcRow = convData.find(d => d.ACTION_TYPE === 'offsite_conversion.fb_pixel_add_to_cart');
    const atcValue = atcRow?.total_value || 0;

    const validWatchTimes = videoData.filter(d => d.avg_watch_sec > 0);
    const avgWatchSec = validWatchTimes.length > 0
      ? (validWatchTimes.reduce((s, d) => s + Number(d.avg_watch_sec), 0) / validWatchTimes.length).toFixed(1)
      : null;

    return { totalViews, avgThruRate, topCreative, atcValue, avgWatchSec };
  }, [videoData, convData]);

  const funnelChartData = videoData.map(d => ({
    name: shortName(d.AD_NAME),
    fullName: d.AD_NAME,
    account: d.ACCOUNT_NAME,
    p25: Number(d.p25) || 0,
    p50: Number(d.p50) || 0,
    p75: Number(d.p75) || 0,
    p100: Number(d.p100) || 0,
    thruplay: Number(d.thruplay) || 0,
    video_views: Number(d.video_views) || 0,
    avg_watch_sec: d.avg_watch_sec != null ? Number(d.avg_watch_sec) : null,
  }));

  const thruplayRateData = [...funnelChartData]
    .map(d => ({ ...d, thruRate: d.video_views > 0 ? d.thruplay / d.video_views : 0 }))
    .sort((a, b) => b.thruRate - a.thruRate);

  const convChartData = convData.map((d, i) => ({
    name: ACTION_LABELS[d.ACTION_TYPE] || d.ACTION_TYPE,
    Actions: Number(d.total_actions) || 0,
    Value: Number(d.total_value) || 0,
    color: ACTION_COLORS[i % ACTION_COLORS.length],
  }));

  const ctaTableData = useMemo(() => ctaData.map(d => ({
    ...d,
    ctaLabel: CTA_LABELS[d.cta] || d.cta,
    formatLabel: FORMAT_LABELS[d.format] || d.format,
    roas: d.purchase_value && d.spend > 0 ? d.purchase_value / d.spend : 0,
    cpm: d.impressions > 0 ? Math.round((d.spend / d.impressions) * 1000) : 0,
  })), [ctaData]);

  const sortedVideoAll = useMemo(() => {
    return [...funnelChartData].sort((a, b) => {
      const av = a[sortKey] ?? 0; const bv = b[sortKey] ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [funnelChartData, sortKey, sortDir]);
  const pagedVideo = sortedVideoAll.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedVideoAll.length / PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-secondary)' }}>
      Loading creative data...
    </div>
  );
  if (error) return (
    <div style={{ padding: '2rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444' }}>
      Error: {error}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard icon={<Play size={16} />} label="Total Video Views" value={fmt(kpis.totalViews)} sub="All creatives" />
        <KPICard icon={<Film size={16} />} label="Avg ThruPlay Rate" value={`${Math.round(kpis.avgThruRate * 100)}%`} sub="Completed views" />
        <KPICard icon={<Clock size={16} />} label="Avg Watch Time" value={kpis.avgWatchSec ? `${kpis.avgWatchSec}s` : '—'} sub="Per creative" accent={kpis.avgWatchSec >= 20 ? '#10B981' : undefined} />
        <KPICard icon={<ShoppingCart size={16} />} label="Add to Cart Value" value={fmtRp(kpis.atcValue)} sub="Pixel attribution" />
      </div>

      {/* Video Completion Funnel */}
      <div className="glass-panel chart-container">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Video Completion Funnel — Top 10 Creatives
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.25rem' }}>
          Stacked: 25% → 50% → 75% → 100% → ThruPlay (lightest to darkest)
        </p>
        <div style={{ minHeight: '340px' }}>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={funnelChartData} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={fmt} />
              <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="square" wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
              <Bar dataKey="p25" name="25% watched" stackId="a" fill={FUNNEL_COLORS.p25} />
              <Bar dataKey="p50" name="50% watched" stackId="a" fill={FUNNEL_COLORS.p50} />
              <Bar dataKey="p75" name="75% watched" stackId="a" fill={FUNNEL_COLORS.p75} />
              <Bar dataKey="p100" name="100% watched" stackId="a" fill={FUNNEL_COLORS.p100} />
              <Bar dataKey="thruplay" name="ThruPlay" stackId="a" fill={FUNNEL_COLORS.thruplay} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ThruPlay Rate + Conversion Funnel */}
      <div className="charts-grid">
        <div className="glass-panel chart-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            ThruPlay Rate Ranking
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.25rem' }}>
            Green ≥40% · Yellow 20–40% · Red &lt;20%
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {thruplayRateData.map((d, i) => {
              const pct = Math.round(d.thruRate * 100);
              const color = pct >= 40 ? '#10B981' : pct >= 20 ? '#F59E0B' : '#EF4444';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 'none' }} title={d.fullName}>
                    {d.name}
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s' }} />
                  </div>
                  <ThruPlayBadge rate={d.thruRate} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel chart-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Conversion Funnel
          </h3>
          <div style={{ minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={convChartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={fmt} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Actions" name="Actions" radius={[4, 4, 0, 0]}>
                  {convChartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {convChartData.filter(d => d.Value > 0).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.name} Value</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>{fmtRp(d.Value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA × Format Performance */}
      {ctaTableData.length > 0 && (
        <div className="glass-panel chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>CTA × Format Performance</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Which call-to-action + creative format drives the best ROAS</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> ≥5x
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block', marginLeft: '6px' }} /> 1–5x
            </div>
          </div>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>CTA Type</th>
                  <th>Format</th>
                  <th># Ads</th>
                  <th>Spend</th>
                  <th>Impressions</th>
                  <th>CPM</th>
                  <th>Purchases</th>
                  <th>Purchase Value</th>
                  <th>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {ctaTableData.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{d.ctaLabel}</td>
                    <td>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                        color: d.format === 'VIDEO' ? '#6366F1' : '#94A3B8',
                        background: d.format === 'VIDEO' ? 'rgba(99,102,241,0.1)' : 'rgba(148,163,184,0.1)',
                      }}>
                        {d.formatLabel}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{d.ad_count}</td>
                    <td style={{ fontWeight: 600 }}>{fmtRp(d.spend)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmt(d.impressions)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmtRp(d.cpm)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{d.purchases ?? '—'}</td>
                    <td style={{ fontWeight: d.purchase_value ? 600 : 400, color: d.purchase_value ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {d.purchase_value ? fmtRp(d.purchase_value) : '—'}
                    </td>
                    <td><ROASBadge roas={d.roas} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Ads Table */}
      <div className="glass-panel chart-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>All Video Ads</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{sortedVideoAll.length} ads</span>
        </div>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {[
                  { key: null, label: 'Ad Name' },
                  { key: null, label: 'Account' },
                  { key: 'video_views', label: 'Views' },
                  { key: 'thruplay', label: 'ThruPlay' },
                  { key: 'thruRate', label: 'ThruPlay %' },
                  { key: 'avg_watch_sec', label: 'Avg Watch (s)' },
                  { key: 'p25', label: '25%' },
                  { key: 'p50', label: '50%' },
                  { key: 'p75', label: '75%' },
                  { key: 'p100', label: '100%' },
                ].map(col => (
                  <th key={col.label}
                    onClick={col.key ? () => handleSort(col.key) : undefined}
                    style={{ cursor: col.key ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}
                  >
                    {col.label} {col.key && sortKey === col.key && (sortDir === 'desc' ? '↓' : '↑')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedVideo.map((d, i) => {
                const thruRate = d.video_views > 0 ? d.thruplay / d.video_views : 0;
                const watchColor = d.avg_watch_sec >= 20 ? '#10B981' : d.avg_watch_sec >= 10 ? '#F59E0B' : 'var(--text-secondary)';
                return (
                  <tr key={i}>
                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }} title={d.fullName}>{d.name}</td>
                    <td>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 600,
                        background: d.account?.includes('SKINCARE') ? 'rgba(79,70,229,0.1)' :
                          d.account?.includes('DECORATIVE') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: d.account?.includes('SKINCARE') ? '#4F46E5' :
                          d.account?.includes('DECORATIVE') ? '#10B981' : '#F59E0B',
                      }}>
                        {d.account?.split('// ').pop()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{fmt(d.video_views)}</td>
                    <td>{fmt(d.thruplay)}</td>
                    <td><ThruPlayBadge rate={thruRate} /></td>
                    <td style={{ fontWeight: d.avg_watch_sec ? 600 : 400, color: d.avg_watch_sec ? watchColor : 'var(--text-tertiary)' }}>
                      {d.avg_watch_sec != null ? `${d.avg_watch_sec}s` : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmt(d.p25)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmt(d.p50)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmt(d.p75)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmt(d.p100)}</td>
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
