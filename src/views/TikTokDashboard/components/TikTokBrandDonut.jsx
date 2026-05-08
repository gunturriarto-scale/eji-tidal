import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(255,0,80,0.25)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: d.payload.color || '#FF0050' }}>{d.name}</p>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Spend: Rp {Math.round(Number(d.value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        {((d.value / d.payload.total) * 100).toFixed(1)}% of total
      </p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const RenderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  return (
    <text x={cx + (innerRadius + (outerRadius - innerRadius) * 0.5) * Math.cos(-midAngle * RADIAN)}
          y={cy + (innerRadius + (outerRadius - innerRadius) * 0.5) * Math.sin(-midAngle * RADIAN)}
          fill="white" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: '0.7rem', fontWeight: 700 }}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export const TikTokBrandDonut = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const enriched = data.map(d => ({ ...d, total }));

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={enriched}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            labelLine={false}
            label={<RenderCustomizedLabel />}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {enriched.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={activeIndex === null || activeIndex === i ? 1 : 0.5} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
        {enriched.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
            <span>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
