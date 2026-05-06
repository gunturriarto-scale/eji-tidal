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

const CHANNEL_COLORS = {
  Watsons: '#4F46E5',
  Guardian: '#10B981',
  SAT: '#F59E0B',
  IDM: '#EF4444',
  General: '#6B7280',
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

export const RetailChannelChart = ({ data }) => {
  // Aggregate by channel
  const chartData = {};
  data.forEach(d => {
    if (!chartData[d.channel]) chartData[d.channel] = { channel: d.channel, spend: 0, impressions: 0 };
    chartData[d.channel].spend += Number(d.spend);
    chartData[d.channel].impressions += Number(d.impressions);
  });

  const chartArr = Object.values(chartData).map(d => ({
    ...d,
    cpm: d.impressions > 0 ? (d.spend / d.impressions * 1000).toFixed(2) : '0.00',
  })).sort((a, b) => b.spend - a.spend);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Channel</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Spend</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Impressions</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>CPM</th>
            </tr>
          </thead>
          <tbody>
            {chartArr.map(row => (
              <tr key={row.channel} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: CHANNEL_COLORS[row.channel] || '#6B7280', marginRight: 8
                  }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.channel}</span>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{fmtRp(row.spend)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(row.impressions)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Rp {Number(row.cpm).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartArr}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="channel" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <YAxis tickFormatter={v => 'Rp ' + (v/1000000).toFixed(1) + 'M'} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="spend" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Spend" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
