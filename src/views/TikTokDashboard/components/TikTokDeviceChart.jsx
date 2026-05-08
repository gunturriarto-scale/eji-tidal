import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '0.8rem', color: '#FF0050' }}>Spend: Rp {fmt(payload[0]?.value)}</p>
    </div>
  );
};

const DEVICE_COLORS = { iOS: '#3B82F6', Android: '#10B981', Other: '#6366F1' };

export const TikTokDeviceChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="device" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={DEVICE_COLORS[entry.device] || '#6366F1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
