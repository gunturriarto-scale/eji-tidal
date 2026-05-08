import React, { useState } from 'react';

const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
const fmtRp = (n) => n ? 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

// Generate TikTok thumbnail URL from VIDEO_ID
const getThumbnailUrl = (videoId) => {
  if (!videoId || videoId.length < 10) return null;
  return `https://p16-sign.tiktokcdn.com/tos-maliva-p-0068/${videoId}/coverImage~tplv-tiktokx-cropcenter:360:360.jpeg`;
};

const CreativeCard = ({ ad }) => {
  const [imgError, setImgError] = useState(false);
  const thumbUrl = getThumbnailUrl(ad.VIDEO_ID);

  return (
    <div style={{
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      background: 'rgba(255,255,255,0.02)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s',
    }}>
      {/* Thumbnail */}
      <div style={{
        height: '160px',
        background: thumbUrl && !imgError
          ? `url(${thumbUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, rgba(255,0,80,0.15), rgba(225,29,72,0.08))',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0.5rem',
        position: 'relative',
      }}>
        {/* Video play indicator */}
        {thumbUrl && !imgError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {/* Video ID badge */}
        {ad.VIDEO_ID && (
          <div style={{
            fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(0,0,0,0.4)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
          }}>
            VID: {ad.VIDEO_ID.substring(0, 12)}...
          </div>
        )}
      </div>

      {/* Ad info */}
      <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {/* Ad name */}
        <p style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {ad.AD_NAME || '—'}
        </p>

        {/* Ad text preview */}
        {ad.AD_TEXT && (
          <p style={{
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
          }}>
            {ad.AD_TEXT}
          </p>
        )}

        {/* Metrics row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <MetricBadge label="Spend" value={fmtRp(ad.spend)} color="#FF0050" />
          <MetricBadge label="Impr" value={fmt(ad.impressions)} color="var(--text-secondary)" />
          <MetricBadge label="2s" value={fmt(ad.video_2s)} color="#E11D48" />
          <MetricBadge label="6s" value={fmt(ad.video_6s)} color="#DB2777" />
        </div>
      </div>
    </div>
  );
};

const MetricBadge = ({ label, value, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span style={{ fontSize: '0.7rem', fontWeight: 700, color }}>{value}</span>
    <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
  </div>
);

export const TikTokAdCreativePreview = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '0.75rem',
    }}>
      {data.map((ad, i) => (
        <CreativeCard key={i} ad={ad} />
      ))}
    </div>
  );
};
