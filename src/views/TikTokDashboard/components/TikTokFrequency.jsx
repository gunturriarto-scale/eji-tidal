import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload || {};
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '0.8rem', color: '#FF0050' }}>Spend: Rp {fmt(payload[0]?.value)}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Frequency: {d.frequency}x</p>
    </div>
  );
};

export const TikTokFrequency = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="ACCOUNT_NAME" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} tickFormatter={v => v?.split('//').pop()?.trim() || v} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="frequency" fill="#FF0050" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
