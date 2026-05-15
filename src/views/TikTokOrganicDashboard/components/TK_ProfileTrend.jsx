import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

function fmtNum(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

const METRICS = [
  { key: 'video_views',   label: 'Video Views',   color: '#FF0050' },
  { key: 'likes',         label: 'Likes',         color: '#EC4899' },
  { key: 'comments',      label: 'Comments',      color: '#F59E0B' },
  { key: 'shares',        label: 'Shares',        color: '#10B981' },
  { key: 'profile_views', label: 'Profile Views', color: '#8B5CF6' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.6rem 0.9rem', fontSize: '0.72rem', minWidth: '140px' }}>
      <p style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.stroke, margin: '2px 0' }}>
          {p.name}: <strong>{fmtNum(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

export function TK_ProfileTrend({ trendData }) {
  const [activeMetrics, setActiveMetrics] = useState(['video_views', 'likes']);

  const toggleMetric = (key) => {
    setActiveMetrics(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  };

  if (!trendData || trendData.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
        No trend data available for this period.
      </div>
    );
  }

  const chartData = trendData.map(row => ({
    ...row,
    date: row.DATE?.value ? row.DATE.value.split('T')[0] : row.DATE,
  }));

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', margin: 0 }}>
          Performance Trend
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '12px',
                border: '1.5px solid',
                borderColor: activeMetrics.includes(m.key) ? m.color : 'rgba(255,255,255,0.1)',
                background: activeMetrics.includes(m.key) ? `${m.color}18` : 'transparent',
                color: activeMetrics.includes(m.key) ? m.color : 'var(--text-tertiary)',
                fontSize: '0.65rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            {METRICS.filter(m => activeMetrics.includes(m.key)).map(m => (
              <linearGradient key={m.key} id={`grad_${m.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={m.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={m.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false} tickLine={false}
            tickFormatter={v => v?.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6B7280' }}
            axisLine={false} tickLine={false}
            tickFormatter={v => fmtNum(v)}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} />
          {METRICS.filter(m => activeMetrics.includes(m.key)).map(m => (
            <Area
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              strokeWidth={2}
              fill={`url(#grad_${m.key})`}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
