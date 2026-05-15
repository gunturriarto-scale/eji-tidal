import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function fmtNum(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function StatRow({ label, value, color, note }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{value}</span>
        {note && <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginLeft: '6px' }}>{note}</span>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.6rem 0.8rem', fontSize: '0.72rem' }}>
      <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill, margin: '2px 0' }}>
          {p.name}: <strong>{fmtNum(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

export function TK_VideoFunnel({ funnelData }) {
  if (!funnelData) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
        No video funnel data available.
      </div>
    );
  }

  const total = funnelData.total_videos || 1;
  const funnelChartData = [
    { label: 'Started watching', value: total, color: '#FF0050' },
    { label: 'Watched 25%+',    value: funnelData.reached_25pct || 0, color: '#F59E0B' },
    { label: 'Watched 50%+',    value: funnelData.reached_50pct || 0, color: '#10B981' },
    { label: 'Watched 75%+',    value: funnelData.reached_75pct || 0, color: '#06B6D4' },
    { label: 'Watched 100%',    value: funnelData.reached_100pct || 0, color: '#8B5CF6' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      {/* Funnel bar chart */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
          Audience Retention Funnel
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={funnelChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={110} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Videos" radius={[0, 4, 4, 0]} barSize={20}>
              {funnelChartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Drop-off percentages */}
        <div style={{ marginTop: '0.75rem' }}>
          {funnelChartData.slice(1).map((row, idx) => {
            const prev = funnelChartData[idx].value;
            const dropPct = prev > 0 ? Math.round((1 - row.value / prev) * 100) : 0;
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-tertiary)', padding: '2px 0' }}>
                <span>↓ Drop at {row.label.replace('Watched ', '')}</span>
                <span style={{ color: dropPct > 50 ? '#EF4444' : '#9CA3AF', fontWeight: 600 }}>-{dropPct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats panel */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
          Watch Time Stats
        </p>
        <StatRow
          label="Avg Completion Rate"
          value={funnelData.avg_completion_pct != null ? `${funnelData.avg_completion_pct}%` : '—'}
          color={funnelData.avg_completion_pct >= 50 ? '#10B981' : funnelData.avg_completion_pct >= 25 ? '#F59E0B' : '#EF4444'}
        />
        <StatRow
          label="Avg Video Duration"
          value={funnelData.avg_duration_min != null ? `${Number(funnelData.avg_duration_min).toFixed(1)} min` : '—'}
          color="var(--text-primary)"
        />
        <StatRow
          label="Avg Watch Time"
          value={funnelData.avg_watch_time_min != null ? `${Number(funnelData.avg_watch_time_min).toFixed(1)} min` : '—'}
          color="#06B6D4"
        />
        <StatRow
          label="Total Videos Analyzed"
          value={fmtNum(funnelData.total_videos)}
          color="var(--text-primary)"
        />
        <StatRow
          label="Completed Full Video"
          value={fmtNum(funnelData.reached_100pct)}
          color="#8B5CF6"
          note={`${total > 0 ? Math.round((funnelData.reached_100pct / total) * 100) : 0}% of total`}
        />

        {/* Retention quality indicator */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Retention Quality
          </p>
          {(() => {
            const pct = funnelData.avg_completion_pct || 0;
            let label, color, bg;
            if (pct >= 60) { label = 'Excellent — Highly engaging content'; color = '#10B981'; bg = 'rgba(16,185,129,0.08)'; }
            else if (pct >= 40) { label = 'Good — Above average retention'; color = '#F59E0B'; bg = 'rgba(245,158,11,0.08)'; }
            else if (pct >= 20) { label = 'Average — Room for improvement'; color = '#FF6B35'; bg = 'rgba(255,107,53,0.08)'; }
            else { label = 'Low — Consider shorter formats'; color = '#EF4444'; bg = 'rgba(239,68,68,0.08)'; }
            return (
              <div style={{ background: bg, padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', color, fontWeight: 600 }}>{label}</span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
