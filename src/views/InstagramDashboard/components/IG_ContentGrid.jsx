import React from 'react';
import { ExternalLink, Heart, MessageCircle, Eye, Bookmark } from 'lucide-react';

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function typeColor(type) {
  const map = { FEED: '#EC4899', REELS: '#F97316', STORY: '#8B5CF6' };
  return map[type] || '#6B7280';
}

function typeLabel(type) {
  const map = { FEED: 'IMAGE', REELS: 'REELS', STORY: 'STORY' };
  return map[type] || type;
}

function truncateCaption(caption, max = 80) {
  if (!caption) return '';
  return caption.length > max ? caption.substring(0, max) + '…' : caption;
}

const ACCOUNT_GRADIENTS = {
  'Official Hanasui': 'linear-gradient(135deg, #EC489920, #DB277710)',
  'Next Level by Hanasui': 'linear-gradient(135deg, #8B5CF620, #7C3AED10)',
  'Official Skincare Hanasui': 'linear-gradient(135deg, #06B6D420, #0891B210)',
};

// Score = weighted sum of views + reach + likes + comments + saved
function engagementScore(post) {
  return (post.MEDIA_VIEWS || 0) * 1
    + (post.MEDIA_REACH || 0) * 2
    + (post.MEDIA_LIKE_COUNT || 0) * 5
    + (post.MEDIA_COMMENTS_COUNT || 0) * 5
    + (post.MEDIA_SAVED || 0) * 8;
}

function PostCard({ post, rank }) {
  const type = post.MEDIA_PRODUCT_TYPE;
  const color = typeColor(type);
  const ts = post.TIMESTAMP?.value || post.TIMESTAMP;
  const dateStr = ts ? new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';
  const caption = truncateCaption(post.MEDIA_CAPTION);
  const permalink = post.MEDIA_PERMALINK || `https://www.instagram.com/p/${post.MEDIA_SHORTCODE}/`;
  const gradient = ACCOUNT_GRADIENTS[post.ACCOUNT_NAME] || ACCOUNT_GRADIENTS['Official Hanasui'];

  return (
    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', transition: 'all 0.2s ease' }}>
      {/* Top row: rank + account + type badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 0.75rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '24px', height: '24px',
            borderRadius: '6px',
            background: rank <= 3 ? color : 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 800,
            color: rank <= 3 ? 'white' : 'var(--text-tertiary)',
          }}>
            {rank}
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {post.ACCOUNT_NAME}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>@{post.USERNAME}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 700,
            padding: '3px 8px', borderRadius: '6px',
            background: `${color}18`, color,
            border: `1px solid ${color}30`,
            letterSpacing: '0.05em',
          }}>{typeLabel(type)}</span>
        </div>
      </div>

      {/* Thumbnail */}
      {type === 'STORY' ? (
        <div style={{
          aspectRatio: '9/16',
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 80% 20%, ${color}20, transparent 60%)` }} />
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <div style={{ fontSize: '2rem' }}>📱</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>STORY · Expired</div>
          </div>
          <a href={permalink} target="_blank" rel="noopener noreferrer"
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '5px', color: 'white', display: 'flex' }}>
            <ExternalLink size={12} />
          </a>
        </div>
      ) : (
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderTop: `1px solid rgba(255,255,255,0.04)`,
          aspectRatio: '9/16',
        }}>
          <iframe
            src={type === 'REELS'
              ? `https://www.instagram.com/reel/${post.MEDIA_SHORTCODE}/embed/captioned/`
              : `https://www.instagram.com/p/${post.MEDIA_SHORTCODE}/embed/captioned/`}
            title={`Instagram post by @${post.USERNAME}`}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            scrolling="no"
            frameBorder="0"
            allowTransparency="true"
            loading="lazy"
          />
          <a href={permalink} target="_blank" rel="noopener noreferrer"
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '5px', color: 'white', display: 'flex', zIndex: 10 }}>
            <ExternalLink size={12} />
          </a>
          <span style={{
            position: 'absolute', top: '8px', left: '8px',
            fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
            background: `${color}90`, color: 'white', letterSpacing: '0.05em', zIndex: 10,
          }}>{typeLabel(type)}</span>
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <p style={{
            fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5,
            fontStyle: 'italic', borderLeft: `2px solid ${color}40`, paddingLeft: '0.5rem',
          }}>
            "{caption}"
          </p>
        </div>
      )}

      {/* Date */}
      <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.62rem', color: 'var(--text-tertiary)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        📅 {dateStr}
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '0.6rem 0.75rem', gap: '0.25rem',
      }}>
        {[
          { icon: <Eye size={11} />, value: post.MEDIA_REACH || post.MEDIA_STORY_REACH, label: 'reach', color: '#8B5CF6' },
          { icon: <Heart size={11} />, value: post.MEDIA_LIKE_COUNT, label: 'likes', color: '#EC4899' },
          { icon: <MessageCircle size={11} />, value: post.MEDIA_COMMENTS_COUNT, label: 'cmts', color: '#60A5FA' },
          { icon: <Eye size={11} />, value: post.MEDIA_VIEWS || post.MEDIA_STORY_VIEWS, label: 'views', color: '#F59E0B' },
          { icon: <Bookmark size={11} />, value: post.MEDIA_SAVED, label: 'saved', color: '#10B981' },
        ].map(({ icon, value, label, color: c }) => (
          <div key={label} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', padding: '0.4rem 0.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px', color: c }}>{icon}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtNum(value)}</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Content Section (replaces ContentTab) ─────────────────────────────────

export function IG_ContentGrid({ mediaAll = [] }) {
  // Feed posts (non-story)
  const feedPosts = mediaAll.filter(m => m.MEDIA_PRODUCT_TYPE === 'FEED');
  const reelsPosts = mediaAll.filter(m => m.MEDIA_PRODUCT_TYPE === 'REELS');
  // Story posts sorted by story views
  const storyPosts = [...mediaAll.filter(m => m.MEDIA_PRODUCT_TYPE === 'STORY')]
    .sort((a, b) => (b.MEDIA_STORY_VIEWS || 0) - (a.MEDIA_STORY_VIEWS || 0))
    .slice(0, 5);

  // Top 5 by engagement score for feed & reels
  const top5 = (posts) =>
    [...posts]
      .sort((a, b) => engagementScore(b) - engagementScore(a))
      .slice(0, 5);

  const section = (title, subtitle, color, posts) => (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: '3px', height: '20px', background: color, borderRadius: '2px' }} />
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
          {posts.length} posts
        </div>
      </div>
      {posts.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
          {posts.map((p, i) => <PostCard key={p.MEDIA_ID} post={p} rank={i + 1} />)}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          No posts in this category
        </div>
      )}
    </div>
  );

  return (
    <div>
      {section(
        '🎞️ Feed Posts',
        'Best performing static image & carousel posts — ranked by engagement score',
        '#EC4899',
        top5(feedPosts)
      )}
      {section(
        '🎬 Reels',
        'Best performing video & reels — ranked by engagement score',
        '#F97316',
        top5(reelsPosts)
      )}
      {section(
        '📱 Stories',
        'Best performing stories by views — ranked by story views',
        '#8B5CF6',
        storyPosts
      )}
    </div>
  );
}

export { fmtNum };