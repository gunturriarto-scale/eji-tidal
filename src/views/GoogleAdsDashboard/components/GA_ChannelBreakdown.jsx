import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHANNEL_COLORS = {
  PERFORMANCE_MAX: '#4285F4',
  DISPLAY:         '#FBBC04',
  VIDEO:           '#EA4335',
  DEMAND_GEN:      '#34A853',
};

const CHANNEL_LABELS = {
  PERFORMANCE_MAX: 'PMax',
  DISPLAY:         'Display',
  VIDEO:           'Video',
  DEMAND_GEN:      'Demand Gen',
};

function fmtIDR(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function fmtNum(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.6rem 0.8rem', fontSize: '0.72rem' }}>
      <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{CHANNEL_LABELS[label] || label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill, margin: '2px 0' }}>
          {p.name}: <strong>{p.name === 'Spend' ? `IDR ${fmtIDR(p.value)}` : fmtNum(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

const METRICS = [
  { key: 'cost',        label: 'Spend' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks',      label: 'Clicks' },
  { key: 'conversions', label: 'Conversions' },
];

export function GA_ChannelBreakdown({ channelData }) {
  const [metric, setMetric] = useState('cost');

  const data = (channelData || []).map(row => ({
    channel: row.channel_type || row.ADVERTISING_CHANNEL_TYPE || '',
    cost:        Number(row.cost || 0),
    impressions: Number(row.impressions || 0),
    clicks:      Number(row.clicks || 0),
    conversions: Number(row.conversions || 0),
    roas:        Number(row.roas || 0),
  }));

  const metaLabel = METRICS.find(m => m.key === metric)?.label || metric;
  const total = data.reduce((s, r) => s + r[metric], 0);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', margin: 0 }}>
          Channel Type Breakdown
        </p>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              style={{
                padding: '3px 9px', borderRadius: '12px', fontSize: '0.65rem', cursor: 'pointer',
                fontWeight: metric === m.key ? 700 : 400,
                background: metric === m.key ? 'rgba(66,133,244,0.15)' : 'transparent',
                border: `1px solid ${metric === m.key ? '#4285F4' : 'rgba(255,255,255,0.1)'}`,
                color: metric === m.key ? '#4285F4' : 'var(--text-tertiary)',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis dataKey="channel" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
            tickFormatter={v => CHANNEL_LABELS[v] || v} />
          <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false}
            tickFormatter={v => metric === 'cost' ? `${fmtIDR(v)}` : fmtNum(v)} width={55} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={metric} name={metaLabel} radius={[4, 4, 0, 0]} barSize={36}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={CHANNEL_COLORS[entry.channel] || '#4285F4'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* % of total per channel */}
      <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {data.map(row => {
          const pct = total > 0 ? Math.round((row[metric] / total) * 100) : 0;
          const color = CHANNEL_COLORS[row.channel] || '#4285F4';
          const label = CHANNEL_LABELS[row.channel] || row.channel;
          return (
            <div key={row.channel} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ color, fontWeight: 700 }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
