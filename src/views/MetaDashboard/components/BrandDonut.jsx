import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

const fmtRp = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const fmt = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="var(--text-primary)" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
        {fmtRp(payload.value)}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-tertiary)" style={{ fontSize: '0.75rem' }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={fill} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
        {fmt(payload.impressions)} impr
      </text>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const BrandDonut = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        No brand data available
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        {data.map((d, i) => {
          const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
          return (
            <div
              key={i}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.4rem 0.75rem',
                background: activeIndex === i ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                border: activeIndex === i ? `1px solid ${d.color}33` : '1px solid transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{d.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{pct}%</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtRp(d.value)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Total</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fmtRp(total)}</span>
      </div>
    </div>
  );
};