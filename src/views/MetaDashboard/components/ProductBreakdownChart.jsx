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

const PRODUCT_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#A855F7', '#22C55E', '#EAB308', '#64748B',
];

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

export const ProductBreakdownChart = ({ data, brandColors }) => {
  // Aggregate by product
  const chartData = {};
  data.forEach(d => {
    if (!chartData[d.product]) chartData[d.product] = { product: d.product, spend: 0, impressions: 0, clicks: 0 };
    chartData[d.product].spend += Number(d.spend);
    chartData[d.product].impressions += Number(d.impressions);
    chartData[d.product].clicks += Number(d.clicks);
  });

  const chartArr = Object.values(chartData)
    .map((d, i) => ({ ...d, cpm: d.impressions > 0 ? (d.spend / d.impressions * 1000).toFixed(2) : '0.00' }))
    .sort((a, b) => b.spend - a.spend);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Table */}
      <div style={{ overflowX: 'auto', maxHeight: 240, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-main)' }}>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Product</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Spend</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Impressions</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>CPM</th>
            </tr>
          </thead>
          <tbody>
            {chartArr.map((row, i) => (
              <tr key={row.product} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: PRODUCT_COLORS[i % PRODUCT_COLORS.length], marginRight: 8
                  }} />
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.product}</span>
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
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartArr.slice(0, 10)} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" tickFormatter={v => 'Rp ' + (v/1000000).toFixed(1) + 'M'} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <YAxis type="category" dataKey="product" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="spend" radius={[0, 4, 4, 0]} name="Spend">
            {chartArr.slice(0, 10).map((_, i) => (
              <rect key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
