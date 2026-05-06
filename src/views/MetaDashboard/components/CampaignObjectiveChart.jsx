import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BRAND_LABELS } from '../index.jsx';

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
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.8rem', color: p.color || 'var(--accent-primary)', fontWeight: 600 }}>
          {p.name}: {p.name.toLowerCase().includes('spend') || p.name.toLowerCase().includes('cpm') ? fmtRp(p.value) : fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

export const CampaignObjectiveChart = ({ data, brandLabels, brandColors }) => {
  // Aggregate by objective + brand
  const chartData = {};
  data.forEach(d => {
    const key = d.objective;
    if (!chartData[key]) chartData[key] = { objective: key };
    const brand = BRAND_LABELS[d.ACCOUNT_NAME] || d.ACCOUNT_NAME?.split('//').pop()?.trim() || 'Unknown';
    chartData[key][brand] = (chartData[key][brand] || 0) + Number(d.spend);
  });

  const chartDataArr = Object.values(chartData);
  const brands = [...new Set(data.map(d => BRAND_LABELS[d.ACCOUNT_NAME] || d.ACCOUNT_NAME?.split('//').pop()?.trim() || 'Unknown'))];
  const colors = brands.map(b => brandColors[b] || '#4F46E5');

  // Summary by objective
  const summaryData = {};
  data.forEach(d => {
    if (!summaryData[d.objective]) summaryData[d.objective] = { spend: 0, impressions: 0, reach: 0, clicks: 0, post_engagement: 0 };
    summaryData[d.objective].spend += Number(d.spend);
    summaryData[d.objective].impressions += Number(d.impressions);
    summaryData[d.objective].reach += Number(d.reach);
    summaryData[d.objective].clicks += Number(d.clicks);
    summaryData[d.objective].post_engagement += Number(d.post_engagement);
  });

  const summaryArr = Object.entries(summaryData).map(([obj, vals]) => ({
    objective: obj,
    spend: vals.spend,
    cpm: vals.impressions > 0 ? (vals.spend / vals.impressions * 1000).toFixed(2) : '0.00',
    ctr: vals.impressions > 0 ? (vals.clicks / vals.impressions * 100).toFixed(2) : '0.00',
    cpe: vals.post_engagement > 0 ? (vals.spend / vals.post_engagement).toFixed(2) : '0.00',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Objective</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Spend</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>CPM</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>CTR</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>CPE</th>
            </tr>
          </thead>
          <tbody>
            {summaryArr.map(row => (
              <tr key={row.objective} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>{row.objective}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{fmtRp(row.spend)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Rp {Number(row.cpm).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.ctr}%</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Rp {Number(row.cpe).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked Bar by Brand */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartDataArr} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" tickFormatter={v => 'Rp ' + (v/1000000).toFixed(1) + 'M'} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <YAxis type="category" dataKey="objective" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
          {brands.map((brand, i) => (
            <Bar key={brand} dataKey={brand} stackId="a" fill={colors[i]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
