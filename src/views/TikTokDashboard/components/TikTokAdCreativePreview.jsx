import React, { useState } from 'react';

const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
const fmtRp = (n) => n ? 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

// Try multiple thumbnail sources in order:
// 1. PLAYABLE_URL proxied through our image proxy (handles CORS + signed CDN)
// 2. TikTok oEmbed proxy using VIDEO_ID as a direct video ID
// 3. Null → show gradient placeholder
function getThumbnailSources(ad) {
  const sources = [];
  if (ad.playable_url) {
    sources.push(`/api/proxy-image?url=${encodeURIComponent(ad.playable_url)}`);
  }
  if (ad.VIDEO_ID && String(ad.VIDEO_ID).length > 10) {
    const shareUrl = `https://www.tiktok.com/video/${ad.VIDEO_ID}`;
    sources.push(`/api/tiktok-thumbnail?share_url=${encodeURIComponent(shareUrl)}`);
  }
  return sources;
}

const CreativeCard = ({ ad }) => {
  const sources = getThumbnailSources(ad);
  const [srcIndex, setSrcIndex] = useState(0);
  const currentSrc = sources[srcIndex] || null;

  function handleError() {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(i => i + 1);
    } else {
      setSrcIndex(sources.length); // exhausted — show placeholder
    }
  }

  const showImage = currentSrc != null && srcIndex < sources.length;

  return (
    <div style={{
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s',
    }}>
      {/* Thumbnail — 9:16 aspect ratio */}
      <div style={{
        position: 'relative',
        aspectRatio: '9/16',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(255,0,80,0.18) 0%, rgba(30,10,20,0.95) 100%)',
      }}>
        {showImage ? (
          <img
            src={currentSrc}
            alt={ad.AD_NAME || 'Ad creative'}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          /* Gradient placeholder with TikTok logo */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M27.2 7.2C25.6 7.2 24.2 6.4 23.4 5.2C22.6 4 22.4 2.6 22.6 1.2H18.4V20.8C18.4 22.4 17.2 23.8 15.6 23.8C14 23.8 12.6 22.6 12.6 20.8C12.6 19.2 13.8 17.8 15.6 17.8C15.8 17.8 16.2 17.8 16.4 18V13.6C16.2 13.6 15.8 13.6 15.6 13.6C11.4 13.6 8 17 8 20.8C8 24.6 11.4 28 15.6 28C19.8 28 23.2 24.6 23.2 20.8V10.6C25 11.8 27 12.4 29.2 12.4V8C28.4 8 27.8 7.8 27.2 7.2Z" fill="rgba(255,255,255,0.2)"/>
            </svg>
            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              {ad.VIDEO_ID ? `VID: ${String(ad.VIDEO_ID).substring(0, 10)}…` : 'No preview'}
            </span>
          </div>
        )}

        {/* Play icon overlay on loaded images */}
        {showImage && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Spend badge — top-left */}
        <div style={{
          position: 'absolute', top: '8px', left: '8px',
          fontSize: '0.62rem', fontWeight: 800,
          color: '#FF0050', background: 'rgba(0,0,0,0.7)',
          padding: '2px 6px', borderRadius: '5px',
          backdropFilter: 'blur(4px)',
        }}>
          {fmtRp(ad.spend)}
        </div>
      </div>

      {/* Ad info */}
      <div style={{ padding: '0.65rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {/* Ad name */}
        <p style={{
          fontSize: '0.68rem', fontWeight: 600,
          color: 'var(--text-primary)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          lineHeight: 1.35,
        }}>
          {ad.AD_NAME || '—'}
        </p>

        {/* Ad text preview */}
        {ad.AD_TEXT && (
          <p style={{
            fontSize: '0.62rem', color: 'var(--text-tertiary)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.4, fontStyle: 'italic',
          }}>
            {ad.AD_TEXT}
          </p>
        )}

        {/* Metrics grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.3rem', marginTop: 'auto', paddingTop: '0.4rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <MetricBadge label="IMPR" value={fmt(ad.impressions)} color="var(--text-secondary)" />
          <MetricBadge label="2S" value={fmt(ad.video_2s)} color="#E11D48" />
          <MetricBadge label="6S" value={fmt(ad.video_6s)} color="#DB2777" />
        </div>
      </div>
    </div>
  );
};

const MetricBadge = ({ label, value, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '5px', padding: '3px 2px' }}>
    <span style={{ fontSize: '0.68rem', fontWeight: 700, color }}>{value}</span>
    <span style={{ fontSize: '0.52rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
  </div>
);

export const TikTokAdCreativePreview = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '0.75rem',
    }}>
      {data.map((ad, i) => (
        <CreativeCard key={i} ad={ad} />
      ))}
    </div>
  );
};
