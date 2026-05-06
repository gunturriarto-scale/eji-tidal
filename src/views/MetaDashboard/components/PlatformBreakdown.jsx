import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const fmtRp = (n) => {
  if (!n && n !== 0) return 'Rp 0';
  return 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmt = (n) => {
  if (!n && n !== 0) return '0';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const PLAT_COLORS = {
  instagram: '#4F46E5',
  facebook: '#1877F2',
  audience_network: '#10B981',
  threads: '#94A3B8',
};

const PLAT_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  audience_network: 'Audience Network',
  threads: 'Threads',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{
      padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.25)',
      background: 'rgba(20,20,29,0.95)', borderRadius: '8px'
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.8rem', color: p.fill, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>
            {p.name === 'Spend' ? fmtRp(p.value) : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const PlatformBreakdown = ({ data, trendData }) => {
  const chartData = data
    .filter(d => d.PUBLISHER_PLATFORM !== 'unknown')
    .map(d => ({
      name: PLAT_LABELS[d.PUBLISHER_PLATFORM] || d.PUBLISHER_PLATFORM,
      Spend: Number(d.spend) || 0,
      Impressions: Number(d.impressions) || 0,
      key: d.PUBLISHER_PLATFORM,
    }));

  const total = data.reduce((s, d) => s + (Number(d.spend) || 0), 0);

  if (!data || data.length === 0) return null;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Bar chart */}
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} tickFormatter={v => fmtRp(v)} />
              <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
              <Bar dataKey="Spend" name="Spend" radius={[0, 4, 4, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={PLAT_COLORS[d.key] || '#4F46E5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
          {chartData.map((d) => {
            const orig = data.find(r => r.PUBLISHER_PLATFORM === d.key) || {};
            const cpm = Number(orig.impressions) > 0 ? ((Number(orig.spend) || 0) / Number(orig.impressions) * 1000).toFixed(0) : 0;
            const share = total > 0 ? (((Number(orig.spend) || 0) / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={d.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.6rem 1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: `1px solid ${PLAT_COLORS[d.key] || '#4F46E5'}20`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PLAT_COLORS[d.key] || '#4F46E5', flex: 'none' }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>CPM: {fmtRp(Number(cpm))}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{fmtRp(Number(orig.spend) || 0)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{share}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};