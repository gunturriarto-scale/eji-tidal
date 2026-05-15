import React from 'react';
import { ExternalLink } from 'lucide-react';

function fmtNum(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function completionBadge(rate) {
  if (rate == null) return { text: '—', color: '#6B7280' };
  const pct = Math.round(rate * 100);
  let color = '#EF4444';
  if (pct >= 75) color = '#10B981';
  else if (pct >= 50) color = '#F59E0B';
  else if (pct >= 25) color = '#FF6B35';
  return { text: `${pct}%`, color };
}

export function TK_TopVideos({ videos }) {
  if (!videos || videos.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
        No video data available.
      </div>
    );
  }

  const TH = ({ children, align = 'left' }) => (
    <th style={{
      textAlign: align, padding: '8px 10px',
      color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '0.65rem',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        Top 10 Videos by Views
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              <TH>#</TH>
              <TH>Thumbnail</TH>
              <TH>Account</TH>
              <TH>Date</TH>
              <TH>Caption</TH>
              <TH align="right">Views</TH>
              <TH align="right">Likes</TH>
              <TH align="right">Comments</TH>
              <TH align="right">Shares</TH>
              <TH align="right">Reach</TH>
              <TH align="right">Completion</TH>
              <TH align="right">Watch (min)</TH>
              <TH>Link</TH>
            </tr>
          </thead>
          <tbody>
            {videos.map((v, idx) => {
              const dateStr = v.CREATE_DATE?.value
                ? new Date(v.CREATE_DATE.value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
                : v.CREATE_DATE
                  ? new Date(v.CREATE_DATE).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
                  : '—';
              const caption = v.CAPTION || '';
              const { text: compText, color: compColor } = completionBadge(v.VIDEO_COMPLETION_RATE);

              return (
                <tr key={v.VIDEO_ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,80,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '8px 10px', color: '#FF0050', fontWeight: 800, fontSize: '0.7rem' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {v.THUMBNAIL_URL ? (
                      <img
                        src={v.THUMBNAIL_URL}
                        alt=""
                        style={{ width: '28px', height: '50px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: '28px', height: '50px', borderRadius: '4px', background: 'rgba(255,0,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.55rem', color: '#FF0050' }}>No img</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#FF0050', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    @{v.USERNAME}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {dateStr}
                  </td>
                  <td style={{
                    padding: '8px 10px', color: 'var(--text-tertiary)',
                    maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontStyle: caption ? 'normal' : 'italic',
                  }}>
                    {caption || '— no caption —'}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#FF5252' }}>{fmtNum(v.VIDEO_VIEWS)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#EC4899' }}>{fmtNum(v.LIKES)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F59E0B' }}>{fmtNum(v.COMMENTS)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981' }}>{fmtNum(v.SHARES)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtNum(v.REACH)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: compColor }}>{compText}</span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {v.TOTAL_TIME_WATCHED_MIN != null ? Number(v.TOTAL_TIME_WATCHED_MIN).toFixed(1) : '—'}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {v.SHARE_URL ? (
                      <a href={v.SHARE_URL} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ExternalLink size={12} />
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
