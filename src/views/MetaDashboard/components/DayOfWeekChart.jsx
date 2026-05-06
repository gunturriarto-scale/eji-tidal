import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmtRp = (n) => {
  if (!n && n !== 0) return '—';
  return 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.25)', background: 'rgba(20,20,29,0.95)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
        Spend: {fmtRp(payload[0]?.value || 0)}
      </div>
    </div>
  );
};

export const DayOfWeekChart = ({ data }) => {
  // Already sorted by day_num from query
  const chartArr = data.map(d => ({
    ...d,
    spend: Number(d.spend) || 0,
    impressions: Number(d.impressions) || 0,
    post_engagement: Number(d.post_engagement) || 0,
  }));

  const maxSpend = Math.max(...chartArr.map(d => d.spend));
  const totalSpend = chartArr.reduce((sum, d) => sum + d.spend, 0);

  const DAY_COLORS = {
    'Monday': '#4F46E5', 'Tuesday': '#6366F1', 'Wednesday': '#7C3AED',
    'Thursday': '#8B5CF6', 'Friday': '#A855F7', 'Saturday': '#EC4899',
    'Sunday': '#EF4444',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Day</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Spend</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Share</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Impressions</th>
            </tr>
          </thead>
          <tbody>
            {chartArr.map(row => (
              <tr key={row.day_name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: DAY_COLORS[row.day_name] || '#6B7280', marginRight: 8
                  }} />
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.day_name}</span>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{fmtRp(row.spend)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {totalSpend > 0 ? ((row.spend / totalSpend) * 100).toFixed(1) : '0'}%
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(row.impressions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartArr}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day_name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <YAxis tickFormatter={v => 'Rp ' + (v/1000000).toFixed(1) + 'M'} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="spend" radius={[4, 4, 0, 0]} name="Spend">
            {chartArr.map((row, i) => (
              <rect key={i} fill={DAY_COLORS[row.day_name] || '#4F46E5'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
