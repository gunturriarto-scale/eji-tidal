import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const fmt = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const ThruPlayBadge = ({ rate }) => {
  const pct = Math.round(rate * 100);
  const color = pct >= 40 ? '#10B981' : pct >= 20 ? '#F59E0B' : '#EF4444';
  const bg = pct >= 40 ? 'rgba(16,185,129,0.1)' : pct >= 20 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color, background: bg }}>
      {pct}%
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{
      padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.25)',
      background: 'rgba(20,20,29,0.95)', borderRadius: '8px', minWidth: '180px'
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
        {label?.substring(0, 35)}{label?.length > 35 ? '...' : ''}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.8rem', color: p.fill || p.color, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

function shortName(name) {
  if (!name) return '';
  return name.split('//').map(s => s.trim()).slice(-2).join(' // ').substring(0, 38);
}

const FUNNEL_COLORS = {
  p25: 'rgba(99,102,241,0.35)',
  p50: 'rgba(99,102,241,0.5)',
  p75: 'rgba(99,102,241,0.65)',
  p100: 'rgba(79,70,229,0.8)',
  thruplay: '#4F46E5',
};

export const VideoPerformance = ({ data, brandLabels, brandColors }) => {
  const [view, setView] = useState('funnel'); // 'funnel' | 'ranking'
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  // Funnel chart data — top 8 by views
  const topByViews = [...data].sort((a, b) => (Number(b.video_views) || 0) - (Number(a.video_views) || 0)).slice(0, 8);
  const funnelData = topByViews.map(d => ({
    name: shortName(d.AD_NAME),
    fullName: d.AD_NAME,
    brand: brandLabels[d.ACCOUNT_NAME] || d.ACCOUNT_NAME?.split('//').pop()?.trim() || '—',
    p25: Number(d.p25) || 0,
    p50: Number(d.p50) || 0,
    p75: Number(d.p75) || 0,
    p100: Number(d.p100) || 0,
    thruplay: Number(d.thruplay) || 0,
    video_views: Number(d.video_views) || 0,
    avg_watch_sec: d.avg_watch_sec != null ? Number(d.avg_watch_sec) : null,
    color: brandColors[brandLabels[d.ACCOUNT_NAME]] || '#4F46E5',
  }));

  // Ranking by thruplay rate
  const rankingData = [...data]
    .map(d => ({
      ...d,
      thruRate: d.video_views > 0 ? d.thruplay / d.video_views : 0,
      name: shortName(d.AD_NAME),
      fullName: d.AD_NAME,
      brand: brandLabels[d.ACCOUNT_NAME] || d.ACCOUNT_NAME?.split('//').pop()?.trim() || '—',
    }))
    .sort((a, b) => b.thruRate - a.thruRate)
    .slice(0, 10);

  const pagedRank = rankingData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(rankingData.length / PAGE_SIZE);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        No video data available
      </div>
    );
  }

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { id: 'funnel', label: 'Completion Funnel' },
          { id: 'ranking', label: 'ThruPlay Ranking' },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => { setView(v.id); setPage(0); }}
            style={{
              padding: '5px 12px',
              background: view === v.id ? 'rgba(79,70,229,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${view === v.id ? 'rgba(79,70,229,0.3)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              color: view === v.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '0.75rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'funnel' ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} tickFormatter={fmt} />
            <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} width={110} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="square" wrapperStyle={{ fontSize: '0.72rem', paddingTop: '8px' }} />
            <Bar dataKey="p25" name="25%" stackId="a" fill={FUNNEL_COLORS.p25} />
            <Bar dataKey="p50" name="50%" stackId="a" fill={FUNNEL_COLORS.p50} />
            <Bar dataKey="p75" name="75%" stackId="a" fill={FUNNEL_COLORS.p75} />
            <Bar dataKey="p100" name="100%" stackId="a" fill={FUNNEL_COLORS.p100} />
            <Bar dataKey="thruplay" name="ThruPlay" stackId="a" fill={FUNNEL_COLORS.thruplay} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div>
          {pagedRank.map((d, i) => {
            const pct = Math.round(d.thruRate * 100);
            const color = pct >= 40 ? '#10B981' : pct >= 20 ? '#F59E0B' : '#EF4444';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                <div style={{ width: '20px', fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'right', flex: 'none' }}>
                  {page * PAGE_SIZE + i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.fullName}>
                    {d.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s' }} />
                    </div>
                    <ThruPlayBadge rate={d.thruRate} />
                  </div>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}>
                ←
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>{page + 1}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}>
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};