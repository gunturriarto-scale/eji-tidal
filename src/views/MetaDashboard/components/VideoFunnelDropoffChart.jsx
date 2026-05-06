import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const VideoFunnelDropoffChart = ({ data }) => {
  if (!data || !data.views) return null;

  const funnel = [
    { stage: 'Video Views', value: Number(data.views) || 0, pct: 100 },
    { stage: '25% Watched', value: Number(data.p25) || 0, pct: 0 },
    { stage: '50% Watched', value: Number(data.p50) || 0, pct: 0 },
    { stage: '75% Watched', value: Number(data.p75) || 0, pct: 0 },
    { stage: '100% Watched', value: Number(data.p100) || 0, pct: 0 },
    { stage: 'ThruPlay', value: Number(data.thruplay) || 0, pct: 0 },
  ];

  // Calculate drop-off percentages from video views
  const views = funnel[0].value;
  funnel.forEach((f, i) => {
    if (i > 0 && views > 0) {
      f.pct = ((f.value / views) * 100).toFixed(1);
    }
  });

  const colors = ['#4F46E5', '#7C3AED', '#2563EB', '#10B981', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.25)', background: 'rgba(20,20,29,0.95)', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {fmt(payload[0].value)} ({payload[0].payload.pct}%)
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Funnel Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={funnel} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {funnel.map((entry, index) => (
              <Cell key={index} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Drop-off Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
        {funnel.slice(1).map((f, i) => (
          <div key={f.stage} style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: colors[i+1] }}>{f.pct}%</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>{f.stage}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
