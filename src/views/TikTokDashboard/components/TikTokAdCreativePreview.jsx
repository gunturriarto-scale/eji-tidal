import React, { useState } from 'react';

const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
const fmtRp = (n) => n ? 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

// Try to load a thumbnail from available sources
function getThumbnailSources(ad) {
  const sources = [];
  // playable_url from TikTok Ads (usually empty from Supermetrics)
  if (ad.playable_url) {
    sources.push(`/api/proxy-image?url=${encodeURIComponent(ad.playable_url)}`);
  }
  // organic_thumbnail_url — joined from TIKBA_VIDEO for brand accounts
  if (ad.organic_thumbnail_url) {
    sources.push(`/api/proxy-image?url=${encodeURIComponent(ad.organic_thumbnail_url)}`);
  }
  if (ad.VIDEO_ID && String(ad.VIDEO_ID).length > 8) {
    const shareUrl = `https://www.tiktok.com/video/${ad.VIDEO_ID}`;
    sources.push(`/api/tiktok-thumbnail?share_url=${encodeURIComponent(shareUrl)}`);
  }
  return sources;
}

// Derive a gradient color per advertiser
const ACCOUNT_GRADIENTS = {
  'EJI // Hanasui // SKINCARE':     ['#FF0050', '#7C1034'],
  'EJI // Hanasui // DECORATIVE':   ['#10B981', '#065F46'],
  'EJI // Hanasui // BODYCARE':     ['#F59E0B', '#92400E'],
};

function getGradient(accountName) {
  const entry = ACCOUNT_GRADIENTS[accountName];
  if (entry) return `linear-gradient(160deg, ${entry[0]}30 0%, ${entry[1]}60 100%)`;
  return 'linear-gradient(160deg, rgba(255,0,80,0.25) 0%, rgba(30,5,15,0.95) 100%)';
}

function getAccentColor(accountName) {
  const entry = ACCOUNT_GRADIENTS[accountName];
  return entry ? entry[0] : '#FF0050';
}

const CreativeCard = ({ ad }) => {
  const sources = getThumbnailSources(ad);
  const [srcIndex, setSrcIndex] = useState(0);

  const hasThumb = sources.length > 0 && srcIndex < sources.length;
  const currentSrc = hasThumb ? sources[srcIndex] : null;
  const accent = getAccentColor(ad.account_name);
  const gradient = getGradient(ad.account_name);

  function handleError() {
    setSrcIndex(i => i + 1);
  }

  // Parse ad name to extract key info (format: CODE // TYPE // CREATOR // PRODUCT)
  const nameParts = (ad.AD_NAME || '').split('//').map(p => p.trim());
  const adType = nameParts[1] || '';
  const product = nameParts.slice(3).join(' // ') || nameParts[nameParts.length - 1] || '';

  return (
    <div style={{
      borderRadius: '12px', overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
      display: 'flex', flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${accent}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Thumbnail area — 9:16 aspect ratio */}
      <div style={{
        position: 'relative', aspectRatio: '9/16', overflow: 'hidden',
        background: gradient,
      }}>
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={ad.AD_NAME}
            onError={handleError}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          /* Styled placeholder — looks intentional, not broken */
          <div style={{
            width: '100%', height: '100%', padding: '1rem',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            {/* Top: account badge */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: `${accent}22`, border: `1px solid ${accent}40`,
                borderRadius: '20px', padding: '3px 8px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent }} />
                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: accent, letterSpacing: '0.04em' }}>
                  {(ad.account_name || '').replace('EJI // Hanasui // ', '')}
                </span>
              </div>
            </div>

            {/* Middle: TikTok logo watermark */}
            <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.12 }}>
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                <path d="M27.2 7.2C25.6 7.2 24.2 6.4 23.4 5.2C22.6 4 22.4 2.6 22.6 1.2H18.4V20.8C18.4 22.4 17.2 23.8 15.6 23.8C14 23.8 12.6 22.6 12.6 20.8C12.6 19.2 13.8 17.8 15.6 17.8C15.8 17.8 16.2 17.8 16.4 18V13.6C16.2 13.6 15.8 13.6 15.6 13.6C11.4 13.6 8 17 8 20.8C8 24.6 11.4 28 15.6 28C19.8 28 23.2 24.6 23.2 20.8V10.6C25 11.8 27 12.4 29.2 12.4V8C28.4 8 27.8 7.8 27.2 7.2Z" fill="white"/>
              </svg>
            </div>

            {/* Bottom: ad type + product name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {adType && (
                <span style={{
                  fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em',
                  color: accent, background: `${accent}18`, padding: '2px 6px',
                  borderRadius: '4px', alignSelf: 'flex-start',
                  textTransform: 'uppercase',
                }}>
                  {adType}
                </span>
              )}
              {product && (
                <p style={{
                  fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                  margin: 0, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                }}>
                  {product}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Spend badge — always on top-right */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          fontSize: '0.6rem', fontWeight: 800,
          color: accent, background: 'rgba(0,0,0,0.75)',
          padding: '2px 6px', borderRadius: '5px',
          backdropFilter: 'blur(4px)',
        }}>
          {fmtRp(ad.spend)}
        </div>

        {/* Play button for loaded images */}
        {currentSrc && srcIndex < sources.length && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
          </div>
        )}
      </div>

      {/* Ad info below thumbnail */}
      <div style={{ padding: '0.6rem 0.7rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <p style={{
          fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          lineHeight: 1.35,
        }}>
          {ad.AD_NAME || '—'}
        </p>

        {ad.AD_TEXT && (
          <p style={{
            fontSize: '0.6rem', color: 'var(--text-tertiary)', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.4, fontStyle: 'italic',
          }}>
            {ad.AD_TEXT}
          </p>
        )}

        {/* Metrics */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.25rem', marginTop: '0.25rem', paddingTop: '0.4rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Metric label="IMPR" value={fmt(ad.impressions)} color="var(--text-secondary)" />
          <Metric label="2S" value={fmt(ad.video_2s)} color="#E11D48" />
          <Metric label="6S" value={fmt(ad.video_6s)} color="#DB2777" />
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '5px', padding: '3px 2px' }}>
    <div style={{ fontSize: '0.65rem', fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: '0.5rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
  </div>
);

export const TikTokAdCreativePreview = ({ data }) => {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '0.75rem' }}>
      {data.map((ad, i) => <CreativeCard key={i} ad={ad} />)}
    </div>
  );
};
