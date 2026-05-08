import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '0.85rem', color: '#FF0050', fontWeight: 700 }}>
        {fmt(payload[0]?.value)} views
      </p>
    </div>
  );
};

export const TikTokVideoFunnel = ({ data }) => {
  if (!data || data.length === 0 || !data.some(d => d.value > 0)) return null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} width={70} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fontSize: '0.7rem', fill: 'var(--text-secondary)', fontWeight: 600 }}
              formatter={v => fmt(v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Funnel drop-off rates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0 0.5rem' }}>
        {data.slice(1).map((d, i) => {
          const prev = data[i];
          const rate = prev?.value > 0 ? ((d.value / prev.value) * 100).toFixed(1) : '—';
          return (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Drop</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: parseFloat(rate) > 50 ? '#10B981' : parseFloat(rate) > 30 ? '#F59E0B' : '#EF4444' }}>
                {rate}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
