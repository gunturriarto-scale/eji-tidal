import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, PieChart, Pie } from 'recharts';

const fmtRp = (n) => {
  if (!n && n !== 0) return '—';
  return 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const DEVICE_COLORS = {
  'iPhone': '#3B82F6',
  'Android Phone': '#10B981',
  'iPad': '#8B5CF6',
  'Android Tablet': '#F59E0B',
  'Desktop': '#6366F1',
  'Other': '#6B7280',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.25)', background: 'rgba(20,20,29,0.95)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
        Spend: {fmtRp(payload[0]?.value || 0)}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
        Impressions: {fmt(payload[0]?.payload?.impressions || 0)}
      </div>
    </div>
  );
};

export const DeviceBreakdownChart = ({ data }) => {
  const totalSpend = data.reduce((sum, d) => sum + Number(d.spend), 0);

  const chartArr = data.map(d => ({
    ...d,
    pct: totalSpend > 0 ? ((Number(d.spend) / totalSpend) * 100).toFixed(1) : '0',
    ctr: Number(d.impressions) > 0 ? ((Number(d.clicks) / Number(d.impressions)) * 100).toFixed(2) : '0.00',
  })).sort((a, b) => Number(b.spend) - Number(a.spend));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Device</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Spend</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Share</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>CTR</th>
            </tr>
          </thead>
          <tbody>
            {chartArr.map(row => (
              <tr key={row.device} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: DEVICE_COLORS[row.device] || '#6B7280', marginRight: 8
                  }} />
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.device}</span>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{fmtRp(row.spend)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.pct}%</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.ctr}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartArr}
            dataKey="spend"
            nameKey="device"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
          >
            {chartArr.map((entry, i) => (
              <Cell key={i} fill={DEVICE_COLORS[entry.device] || '#6B7280'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
