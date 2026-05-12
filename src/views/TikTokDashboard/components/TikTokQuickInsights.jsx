import React from 'react';
import { toPlacementLabel } from './TikTokPlacementChart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer as PieResponsive } from 'recharts';
import { BarChart, Bar, Tooltip as BarTooltip } from 'recharts';

const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

const MiniTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '6px' }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ fontSize: '0.75rem', color: p.color || '#FF0050', fontWeight: 600 }}>
          {p.name}: Rp {Math.round(Number(p.value) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
        </p>
      ))}
    </div>
  );
};

const MiniPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '6px' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: d.payload.color }}>{d.name}</p>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Rp {fmt(d.value)}</p>
    </div>
  );
};

const MiniBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '6px' }}>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{label}</p>
      <p style={{ fontSize: '0.75rem', color: '#FF0050', fontWeight: 600 }}>Spend: Rp {fmt(payload[0]?.value)}</p>
    </div>
  );
};

const InsightCard = ({ title, children, style = {} }) => (
  <div className="glass-panel" style={{ padding: '1rem', ...style }}>
    <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem' }}>{title}</h4>
    {children}
  </div>
);

const PlacementMiniCard = ({ placement }) => {
  const colors = ['#FF0050', '#E11D48', '#DB2777', '#BE185D', '#9D174D', '#831843'];
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors[0] }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{toPlacementLabel(placement.PLACEMENT_TYPE)}</span>
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#FF0050' }}>Rp {fmt(placement.spend)}</span>
    </div>
  );
};

export const TikTokQuickInsights = ({ trendData, brandDonutData, placement, conversions, brandColors }) => {
  // Compute total spend from brand donut data
  const totalSpend = brandDonutData.reduce((s, d) => s + (Number(d.value) || 0), 0);

  // Top placement
  const topPlacement = placement?.[0];
  const topPlacementPct = topPlacement && totalSpend > 0 ? ((topPlacement.spend / totalSpend) * 100).toFixed(1) : '—';

  // Top objective
  const topObjective = conversions?.reduce((best, c) => (!best || Number(c.spend) > Number(best.spend)) ? c : best, null);

  // Total impressions
  const totalImpressions = brandDonutData.reduce((s, d) => s + (Number(d.impressions) || 0), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
      {/* Spend Trend Mini */}
      <InsightCard title="Spend Trend">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={trendData.slice(-14)} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="qkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF0050" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF0050" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} tickFormatter={d => d.slice(8)} hide />
              <YAxis hide />
              <Tooltip content={<MiniTrendTooltip />} />
              <Area type="monotone" dataKey={Object.keys(trendData[0] || {}).find(k => k !== 'date') || 'Skincare'} stroke="#FF0050" fill="url(#qkGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', fontStyle: 'italic' }}>No data</p>}
      </InsightCard>

      {/* Brand Split */}
      <InsightCard title="Brand Split">
        {brandDonutData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {brandDonutData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: d.color }}>
                  {totalSpend > 0 ? ((d.value / totalSpend) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        ) : <p style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', fontStyle: 'italic' }}>No data</p>}
      </InsightCard>

      {/* Top Placement */}
      <InsightCard title="Top Placement">
        {topPlacement ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FF0050' }}>{toPlacementLabel(topPlacement.PLACEMENT_TYPE)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Spend: Rp {fmt(topPlacement.spend)}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{topPlacementPct}% of total</div>
            <div style={{ fontSize: '0.65rem', color: '#10B981' }}>2s Views: {fmt(topPlacement.video_2s)}</div>
          </div>
        ) : <p style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', fontStyle: 'italic' }}>No placement data</p>}
      </InsightCard>

      {/* Top Objective */}
      <InsightCard title="Top Objective">
        {topObjective ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,0,80,0.1)', color: '#FF0050', borderRadius: '4px', fontWeight: 700, alignSelf: 'flex-start' }}>
              {topObjective.objective}
            </span>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Spend: Rp {fmt(topObjective.spend)}</div>
            <div style={{ fontSize: '0.65rem', color: '#10B981' }}>Conversions: {fmt(topObjective.conversions)}</div>
            {topObjective.purchase_value > 0 && (
              <div style={{ fontSize: '0.65rem', color: '#10B981' }}>Purchase Value: Rp {fmt(topObjective.purchase_value)}</div>
            )}
          </div>
        ) : <p style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', fontStyle: 'italic' }}>No objective data</p>}
      </InsightCard>
    </div>
  );
};
