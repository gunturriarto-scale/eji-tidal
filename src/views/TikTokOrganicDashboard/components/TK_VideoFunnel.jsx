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
          {p.name}: <strong>{fmtNum(p.value)} videos</strong>
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

  // Completion rate distribution — how many videos fall in each performance tier
  const distData = [
    { label: '0–5% completion',   value: funnelData.bucket_0_5   || 0, color: '#EF4444' },
    { label: '5–25% completion',  value: funnelData.bucket_5_25  || 0, color: '#F59E0B' },
    { label: '25–50% completion', value: funnelData.bucket_25_50 || 0, color: '#10B981' },
    { label: '50%+ completion',   value: funnelData.bucket_50_plus || 0, color: '#06B6D4' },
  ];

  const pct = funnelData.avg_completion_pct || 0;
  let qualityLabel, qualityColor, qualityBg;
  if (pct >= 25)      { qualityLabel = 'Excellent — Highly engaging content'; qualityColor = '#10B981'; qualityBg = 'rgba(16,185,129,0.08)'; }
  else if (pct >= 10) { qualityLabel = 'Good — Above average retention';      qualityColor = '#F59E0B'; qualityBg = 'rgba(245,158,11,0.08)'; }
  else if (pct >= 5)  { qualityLabel = 'Average — Room for improvement';      qualityColor = '#FF6B35'; qualityBg = 'rgba(255,107,53,0.08)'; }
  else                { qualityLabel = 'Low — Consider shorter formats';       qualityColor = '#EF4444'; qualityBg = 'rgba(239,68,68,0.08)'; }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      {/* Distribution bar chart */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
          Completion Rate Distribution
        </p>
        <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
          How many videos fall in each retention tier
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={distData} layout="vertical" margin={{ left: 8, right: 24 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={120} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Videos" radius={[0, 4, 4, 0]} barSize={22}>
              {distData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* % of total per bucket */}
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {distData.map((row, idx) => {
            const pctOfTotal = total > 0 ? Math.round((row.value / total) * 100) : 0;
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-tertiary)', padding: '2px 0' }}>
                <span>{row.label}</span>
                <span style={{ color: row.color, fontWeight: 600 }}>{row.value} videos ({pctOfTotal}%)</span>
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
          color={pct >= 25 ? '#10B981' : pct >= 10 ? '#F59E0B' : pct >= 5 ? '#FF6B35' : '#EF4444'}
        />
        <StatRow
          label="Avg Video Duration"
          value={funnelData.avg_duration_min != null ? `${Number(funnelData.avg_duration_min).toFixed(1)} min` : '—'}
          color="var(--text-primary)"
        />
        <StatRow
          label="Avg Watch Time / View"
          value={funnelData.avg_sec_per_view != null ? `${Number(funnelData.avg_sec_per_view).toFixed(1)} sec` : '—'}
          color="#06B6D4"
        />
        <StatRow
          label="Total Videos Analyzed"
          value={fmtNum(funnelData.total_videos)}
          color="var(--text-primary)"
        />
        <StatRow
          label="Videos w/ 50%+ Completion"
          value={fmtNum(funnelData.bucket_50_plus)}
          color="#06B6D4"
          note={`${total > 0 ? Math.round(((funnelData.bucket_50_plus || 0) / total) * 100) : 0}% of total`}
        />

        {/* Retention quality indicator */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Retention Quality
          </p>
          <div style={{ background: qualityBg, padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: qualityColor, flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', color: qualityColor, fontWeight: 600 }}>{qualityLabel}</span>
          </div>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
            Completion rate = % of viewers who watched the full video. TikTok avg: 5–15%.
          </p>
        </div>
      </div>
    </div>
  );
}
