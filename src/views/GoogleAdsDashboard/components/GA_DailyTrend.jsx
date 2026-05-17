import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const ACCENT  = '#4285F4';
const GREEN   = '#34A853';
const YELLOW  = '#FBBC04';

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
    <div className="glass-panel" style={{ padding: '0.6rem 0.9rem', fontSize: '0.72rem', minWidth: '160px' }}>
      <p style={{ color: 'var(--text-tertiary)', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke, margin: '3px 0', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{p.name}</span>
          <strong>{p.name === 'Spend' ? `IDR ${fmtIDR(p.value)}` : fmtNum(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

const METRICS = [
  { key: 'cost',        label: 'Spend',       color: ACCENT,  yFmt: v => `IDR ${fmtIDR(v)}` },
  { key: 'conversions', label: 'Conversions',  color: GREEN,   yFmt: v => fmtNum(v) },
  { key: 'clicks',      label: 'Clicks',       color: '#EA4335', yFmt: v => fmtNum(v) },
  { key: 'impressions', label: 'Impressions',  color: YELLOW,  yFmt: v => fmtNum(v) },
];

export function GA_DailyTrend({ trendData }) {
  const [primary, setPrimary] = useState('cost');
  const [secondary, setSecondary] = useState('conversions');

  const data = (trendData || []).map(row => ({
    date: String(row.DATE || row.date || ''),
    cost: Number(row.cost || 0),
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    conversions: Number(row.conversions || 0),
    roas: Number(row.roas || 0),
  }));

  const primMeta   = METRICS.find(m => m.key === primary)   || METRICS[0];
  const secMeta    = METRICS.find(m => m.key === secondary)  || METRICS[1];

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', margin: 0 }}>
          Daily Trend
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {METRICS.map(m => {
            const isPri = primary === m.key;
            const isSec = secondary === m.key;
            return (
              <button
                key={m.key}
                onClick={() => {
                  if (m.key === secondary) setSecondary(primary);
                  setPrimary(m.key);
                }}
                style={{
                  padding: '3px 10px', borderRadius: '12px', fontSize: '0.68rem', cursor: 'pointer',
                  fontWeight: isPri || isSec ? 700 : 400,
                  background: isPri ? `${m.color}25` : isSec ? `${m.color}12` : 'transparent',
                  border: `1px solid ${isPri || isSec ? m.color : 'rgba(255,255,255,0.1)'}`,
                  color: isPri || isSec ? m.color : 'var(--text-tertiary)',
                  transition: 'all 0.15s',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primMeta.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={primMeta.color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSecondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secMeta.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={secMeta.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false}
              tickFormatter={v => v ? v.substring(5) : ''} interval="preserveStartEnd" />
            <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false}
              tickFormatter={primMeta.yFmt} width={60} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false}
              tickFormatter={secMeta.yFmt} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Area yAxisId="left"  type="monotone" dataKey={primary}   name={primMeta.label}
              stroke={primMeta.color} fill="url(#gradPrimary)" strokeWidth={2} dot={false} />
            <Area yAxisId="right" type="monotone" dataKey={secondary}  name={secMeta.label}
              stroke={secMeta.color} fill="url(#gradSecondary)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '3rem 0' }}>No trend data</div>
      )}
    </div>
  );
}
