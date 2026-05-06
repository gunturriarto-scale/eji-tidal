import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const fmtRp = (n) => {
  if (!n && n !== 0) return '—';
  return 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const POSITION_COLORS = {
  Reels: '#EC4899',
  Stories: '#8B5CF6',
  Feed: '#4F46E5',
  Explore: '#06B6D4',
  Search: '#F59E0B',
  'In-Stream': '#EF4444',
  Marketplace: '#10B981',
  Threads: '#6366F1',
  Other: '#6B7280',
};

const PLAT_COLORS = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  audience_network: '#6B7280',
  threads: '#000000',
  unknown: '#6B7280',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.25)', background: 'rgba(20,20,29,0.95)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.8rem', color: p.color || 'var(--accent-primary)', fontWeight: 600 }}>
          {p.name}: {fmtRp(p.value)}
        </div>
      ))}
    </div>
  );
};

export const PlacementChart = ({ data }) => {
  // Aggregate by position
  const chartData = {};
  data.forEach(d => {
    if (!chartData[d.position]) chartData[d.position] = { position: d.position, spend: 0, impressions: 0 };
    chartData[d.position].spend += Number(d.spend);
    chartData[d.position].impressions += Number(d.impressions);
  });

  const chartArr = Object.values(chartData)
    .map(d => ({ ...d, cpm: d.impressions > 0 ? (d.spend / d.impressions * 1000).toFixed(2) : '0.00' }))
    .sort((a, b) => b.spend - a.spend);

  // Group by platform for stacked chart
  const platData = {};
  data.forEach(d => {
    const key = d.position;
    if (!platData[key]) platData[key] = { position: key };
    const plat = d.PUBLISHER_PLATFORM || 'unknown';
    platData[key][plat] = (platData[key][plat] || 0) + Number(d.spend);
  });
  const platArr = Object.values(platData).sort((a, b) => (b.Reels || b.Feed || 0) - (a.Reels || a.Feed || 0));
  const platforms = [...new Set(data.map(d => d.PUBLISHER_PLATFORM || 'unknown'))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Placement</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Spend</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Impressions</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>CPM</th>
            </tr>
          </thead>
          <tbody>
            {chartArr.map(row => (
              <tr key={row.position} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: POSITION_COLORS[row.position] || '#6B7280', marginRight: 8
                  }} />
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.position}</span>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{fmtRp(row.spend)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(row.impressions)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Rp {Number(row.cpm).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked Bar by Platform */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={platArr} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" tickFormatter={v => 'Rp ' + (v/1000000).toFixed(1) + 'M'} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <YAxis type="category" dataKey="position" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
          {platforms.map(plat => (
            <Bar key={plat} dataKey={plat} stackId="a" fill={PLAT_COLORS[plat] || '#6B7280'} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
