import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const fmtRp = (n) => {
  if (!n && n !== 0) return 'Rp 0';
  return 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmtDate = (d) => {
  if (!d) return '';
  const parts = String(d).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return String(d);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{
      padding: '0.75rem 1rem',
      border: '1px solid rgba(79,70,229,0.25)',
      background: 'rgba(20,20,29,0.95)',
      borderRadius: '8px', minWidth: '180px'
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
        {fmtDate(label)}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8rem', color: p.color, marginBottom: '2px' }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{fmtRp(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const SpendTrendChart = ({ data, brandColors }) => {
  const [metric, setMetric] = useState('spend');

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        No trend data available for selected period
      </div>
    );
  }

  const brands = ['Skincare', 'Decorative', 'Bodycare'].filter(b => data.some(d => d[b] > 0));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {brands.map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: brandColors[b] }} />
              {b}
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {brands.map((b, i) => (
              <linearGradient key={b} id={`grad-meta-${b}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={brandColors[b]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={brandColors[b]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--text-tertiary)"
            fontSize={10}
            tickLine={false}
            tickFormatter={fmtDate}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="var(--text-tertiary)"
            fontSize={10}
            tickLine={false}
            tickFormatter={v => fmtRp(v)}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          {brands.map(b => (
            <Area
              key={b}
              type="monotone"
              dataKey={b}
              stroke={brandColors[b]}
              strokeWidth={2}
              fill={`url(#grad-meta-${b})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};