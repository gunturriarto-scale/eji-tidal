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

const AGE_ORDER = ['18-24', '19-24', '20-24', '25-29', '25-34', '30-34', '35-39', '35-44', '40-44', '45-49', '45-54', '50-54', '55-64', '65+', 'NONE', '13-17', 'unknown'];
const GENDER_COLORS = { Male: '#3B82F6', Female: '#EC4899', NONE: '#6366F1' };

export const TikTokDemographics = ({ data }) => {
  if (!data || data.length === 0) return null;

  const grouped = {};
  data.forEach(d => {
    const age = d.AGE || 'unknown';
    const gender = d.GENDER || 'NONE';
    if (!grouped[age]) grouped[age] = {};
    grouped[age][gender] = (grouped[age][gender] || 0) + (Number(d.spend) || 0);
  });

  const chartData = Object.entries(grouped)
    .sort(([a], [b]) => {
      const ai = AGE_ORDER.indexOf(a);
      const bi = AGE_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([age, genders]) => ({
      age,
      ...genders,
    }));

  const genders = [...new Set(data.map(d => d.GENDER || 'NONE'))];

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="age" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          {genders.map((g, i) => (
            <Bar key={g} dataKey={g} stackId="a" fill={GENDER_COLORS[g] || '#6366F1'} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
        {genders.map(g => (
          <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '2px', background: GENDER_COLORS[g] || '#6366F1' }} />
            {g === 'NONE' ? 'Unknown' : g}
          </div>
        ))}
      </div>
    </div>
  );
};
