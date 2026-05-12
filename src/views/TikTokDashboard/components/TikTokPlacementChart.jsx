import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

export const PLACEMENT_LABELS = {
  PLACEMENT_TYPE_FEED:           'In-Feed',
  PLACEMENT_TYPE_NORMAL:         'In-Feed',
  PLACEMENT_TYPE_STORY:          'Story',
  PLACEMENT_TYPE_SEARCH:         'Search',
  PLACEMENT_TYPE_TOPVIEW:        'TopView',
  PLACEMENT_TYPE_BRAND_TAKEOVER: 'Brand Takeover',
  PLACEMENT_TYPE_DETAIL_PAGE:    'Detail Page',
  PLACEMENT_TYPE_LIVE:           'Live',
  PLACEMENT_TYPE_OTHERS:         'Others',
  PLACEMENT_TYPE_OTHER:          'Others',
};

export const toPlacementLabel = (raw) =>
  PLACEMENT_LABELS[raw] || raw?.replace('PLACEMENT_TYPE_', '').replace(/_/g, ' ') || raw || '—';

const PLACEMENT_COLORS = {
  'In-Feed':        '#FF0050',
  'TopView':        '#E11D48',
  'Brand Takeover': '#DB2777',
  'Search':         '#BE185D',
  'Story':          '#9D174D',
  'Detail Page':    '#7C1D6F',
  'Live':           '#6B21A8',
  'Others':         '#831843',
};

export const TikTokPlacementChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const chartData = data.map(d => ({ ...d, label: toPlacementLabel(d.PLACEMENT_TYPE) }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={PLACEMENT_COLORS[entry.label] || '#FF0050'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
