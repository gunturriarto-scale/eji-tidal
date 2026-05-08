import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.85rem', color: p.color || '#FF0050', fontWeight: 600 }}>
          {p.name}: {p.value ? 'Rp ' + Math.round(Number(p.value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—'}
        </div>
      ))}
    </div>
  );
};

export const TikTokSpendTrend = ({ data }) => {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="tiktokSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF0050" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FF0050" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={d => d.slice(5)} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }} />
        {Object.keys(data[0] || {}).filter(k => k !== 'date').map((key, i) => (
          <Area key={key} type="monotone" dataKey={key} stroke="#FF0050" fill="url(#tiktokSpend)" strokeWidth={i === 0 ? 2 : 1.5} dot={false} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};
