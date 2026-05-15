import React, { useState } from 'react';
import { Eye, Heart, MessageCircle, Share2, Play, ExternalLink } from 'lucide-react';

function fmtNum(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function completionColor(rate) {
  if (rate == null) return '#6B7280';
  const pct = rate * 100;
  if (pct >= 75) return '#10B981';
  if (pct >= 50) return '#F59E0B';
  if (pct >= 25) return '#FF6B35';
  return '#EF4444';
}

function VideoCard({ video }) {
  const [imgError, setImgError] = useState(false);
  const completionPct = video.VIDEO_COMPLETION_RATE != null
    ? Math.round(video.VIDEO_COMPLETION_RATE * 100)
    : null;
  const caption = video.CAPTION || '';
  const dateStr = video.CREATE_DATE?.value
    ? new Date(video.CREATE_DATE.value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
    : video.CREATE_DATE
      ? new Date(video.CREATE_DATE).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
      : '—';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '9 / 16',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      flexShrink: 0,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Thumbnail */}
      {video.THUMBNAIL_URL && !imgError ? (
        <img
          src={video.THUMBNAIL_URL}
          alt={caption.slice(0, 40)}
          onError={() => setImgError(true)}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,0,80,0.15) 0%, rgba(0,0,0,0.6) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Play size={32} style={{ color: '#FF0050', opacity: 0.6 }} />
        </div>
      )}

      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
      }} />

      {/* Top badges */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px',
          background: 'rgba(255,0,80,0.85)', color: '#fff',
          borderRadius: '4px', backdropFilter: 'blur(4px)',
          letterSpacing: '0.04em',
        }}>
          @{video.USERNAME}
        </span>
        <span style={{
          fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)',
          background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px',
          backdropFilter: 'blur(4px)',
        }}>
          {dateStr}
        </span>
      </div>

      {/* Bottom content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px' }}>
        {/* Caption */}
        <p style={{
          fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)',
          margin: '0 0 8px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          lineHeight: 1.35,
        }}>
          {caption || <span style={{ opacity: 0.4 }}>No caption</span>}
        </p>

        {/* Metrics row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#FF5252', fontWeight: 700 }}>
            <Eye size={10} /> {fmtNum(video.VIDEO_VIEWS)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#EC4899', fontWeight: 600 }}>
            <Heart size={10} /> {fmtNum(video.LIKES)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#F59E0B', fontWeight: 600 }}>
            <MessageCircle size={10} /> {fmtNum(video.COMMENTS)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>
            <Share2 size={10} /> {fmtNum(video.SHARES)}
          </span>
        </div>

        {/* Completion rate bar */}
        {completionPct != null && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)' }}>Completion</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: completionColor(video.VIDEO_COMPLETION_RATE) }}>
                {completionPct}%
              </span>
            </div>
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(completionPct, 100)}%`,
                background: completionColor(video.VIDEO_COMPLETION_RATE),
                borderRadius: '2px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Open link */}
        {video.SHARE_URL && (
          <a
            href={video.SHARE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              marginTop: '6px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={10} /> Open on TikTok
          </a>
        )}
      </div>
    </div>
  );
}

export function TK_VideoGrid({ videos }) {
  const [sortBy, setSortBy] = useState('CREATE_DATE');

  if (!videos || videos.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
        No videos found for this period.
      </div>
    );
  }

  const SORT_OPTIONS = [
    { value: 'CREATE_DATE', label: 'Newest First' },
    { value: 'VIDEO_VIEWS',  label: 'Most Viewed' },
    { value: 'LIKES',        label: 'Most Liked' },
    { value: 'VIDEO_COMPLETION_RATE', label: 'Best Completion' },
  ];

  const sorted = [...videos].sort((a, b) => {
    if (sortBy === 'CREATE_DATE') {
      const da = a.CREATE_DATE?.value || a.CREATE_DATE || '';
      const db = b.CREATE_DATE?.value || b.CREATE_DATE || '';
      return db.localeCompare(da);
    }
    return (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0);
  });

  return (
    <div>
      {/* Sort controls */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Sort by:</span>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: sortBy === opt.value ? '#FF0050' : 'rgba(255,255,255,0.1)',
              background: sortBy === opt.value ? 'rgba(255,0,80,0.1)' : 'transparent',
              color: sortBy === opt.value ? '#FF0050' : 'var(--text-tertiary)',
              fontSize: '0.65rem', fontWeight: sortBy === opt.value ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {opt.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
          {sorted.length} videos
        </span>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '0.75rem',
      }}>
        {sorted.map(v => (
          <VideoCard key={v.VIDEO_ID} video={v} />
        ))}
      </div>
    </div>
  );
}
