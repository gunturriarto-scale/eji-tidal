import React from 'react';
import { ExternalLink } from 'lucide-react';

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function retentionColor(pct) {
  if (pct === null || pct === undefined) return 'var(--text-tertiary)';
  if (pct >= 80) return '#10B981';
  if (pct >= 60) return '#F59E0B';
  return '#EF4444';
}

function StoryTable({ stories = [], accountId }) {
  const filtered = stories.filter(s => !accountId || accountId === 'all' || s.ACCOUNT_ID === accountId);

  if (filtered.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        No story data available
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        Story Performance — {filtered.length} Stories
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
        <thead>
          <tr>
            {['Time', 'Account', 'Views', 'Reach', 'Taps Fwd', 'Taps Back', 'Exits', 'Replies', 'Retention'].map(h => (
              <th key={h} style={{ textAlign: h === 'Time' || h === 'Account' || h === 'Replies' ? 'left' : 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => {
            const views = s.MEDIA_STORY_VIEWS || 0;
            const tapsFwd = s.MEDIA_STORY_TAPS_FORWARD || 0;
            const retentionPct = views ? ((tapsFwd / views) * 100).toFixed(0) : null;

            const ts = s.TIMESTAMP?.value || s.TIMESTAMP;
            const timeStr = ts ? new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';

            return (
              <tr key={s.MEDIA_ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{timeStr}</td>
                <td style={{ padding: '8px', color: 'var(--text-secondary)', fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{s.USERNAME}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtNum(views)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{fmtNum(s.MEDIA_STORY_REACH)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#10B981' }}>{fmtNum(tapsFwd)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#F59E0B' }}>{fmtNum(s.MEDIA_STORY_TAPS_BACK)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#EF4444' }}>{fmtNum(s.MEDIA_STORY_EXITS)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{s.MEDIA_STORY_REPLIES || 0}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: retentionColor(retentionPct) }}>
                  {retentionPct !== null ? retentionPct + '%' : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StoryKPICards({ stories = [], accountId }) {
  const filtered = stories.filter(s => !accountId || accountId === 'all' || s.ACCOUNT_ID === accountId);
  if (filtered.length === 0) return null;

  const avgViews = Math.round(filtered.reduce((s, r) => s + (r.MEDIA_STORY_VIEWS || 0), 0) / filtered.length);
  const avgReach = Math.round(filtered.reduce((s, r) => s + (r.MEDIA_STORY_REACH || 0), 0) / filtered.length);
  const avgRetention = filtered.filter(s => s.MEDIA_STORY_VIEWS > 0).length > 0
    ? Math.round(filtered.filter(s => s.MEDIA_STORY_VIEWS > 0).reduce((s, r) => s + ((r.MEDIA_STORY_TAPS_FORWARD || 0) / r.MEDIA_STORY_VIEWS * 100), 0) / filtered.filter(s => s.MEDIA_STORY_VIEWS > 0).length)
    : 0;
  const avgExits = Math.round(filtered.reduce((s, r) => s + (r.MEDIA_STORY_EXITS || 0), 0) / filtered.length);

  const cards = [
    { label: 'Avg Views / Story', value: fmtNum(avgViews), color: '#EC4899' },
    { label: 'Avg Reach / Story', value: fmtNum(avgReach), color: '#8B5CF6' },
    { label: 'Avg Retention Rate', value: avgRetention + '%', color: '#10B981' },
    { label: 'Avg Exit Rate', value: avgExits, color: '#EF4444' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
      {cards.map(({ label, value, color }) => (
        <div key={label} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>{label}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export function IG_StoryAnalytics({ stories = [], accountId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <StoryKPICards stories={stories} accountId={accountId} />
      <StoryTable stories={stories} accountId={accountId} />
    </div>
  );
}

export { fmtNum };