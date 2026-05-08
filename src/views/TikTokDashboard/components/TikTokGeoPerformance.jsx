import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '0.8rem', color: '#FF0050' }}>Spend: Rp {fmt(payload[0]?.value)}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Impressions: {fmt(payload[0]?.payload?.impressions)}</p>
    </div>
  );
};

export const TikTokGeoPerformance = ({ data }) => {
  if (!data || data.length === 0) return null;

  const top10 = data.slice(0, 10);

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 80, left: 60, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
          <YAxis type="category" dataKey="COUNTRY_NAME" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} width={55} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="spend" fill="#FF0050" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {/* Table below chart */}
      <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              {['Region', 'Spend', 'Impressions', 'Clicks'].map(h => (
                <th key={h} style={{ padding: '0.4rem 0.5rem', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-secondary)' }}>{row.COUNTRY_NAME || '—'}</td>
                <td style={{ padding: '0.4rem 0.5rem', color: '#FF0050', fontWeight: 700 }}>Rp {fmt(row.spend)}</td>
                <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-primary)' }}>{fmt(row.impressions)}</td>
                <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-primary)' }}>{fmt(row.clicks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
