import React from 'react';
import { Users, Eye, TrendingUp, Camera, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function TrendBadge({ value }) {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;
  return (
    <span style={{
      fontSize: '0.7rem',
      fontWeight: 700,
      color: positive ? '#10B981' : '#EF4444',
      background: positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      padding: '2px 6px',
      borderRadius: '4px',
    }}>
      {positive ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  );
}

function KPICard({ label, value, sub, icon, accentColor = '#EC4899', trend }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      {/* Accent gradient strip */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '3px', height: '100%',
        background: `linear-gradient(180deg, ${accentColor}, transparent)`,
        borderRadius: '0 2px 2px 0',
      }} />
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-20px', right: '-20px',
        width: '80px', height: '80px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}22, transparent)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        <span style={{ color: accentColor, opacity: 0.8 }}>{icon}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>

      {sub && (
        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>{sub}</p>
      )}
    </div>
  );
}

export function IG_KPICards({ kpi, accountCount }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1rem',
      marginBottom: '1.5rem',
    }}>
      <KPICard
        label="Total Followers"
        value={fmtNum(kpi?.total_followers)}
        sub={`across ${accountCount || 3} accounts`}
        icon={<Users size={16} />}
        accentColor="#EC4899"
        trend={null}
      />
      <KPICard
        label="Total Reach"
        value={fmtNum(kpi?.total_reach)}
        sub="last 7 days"
        icon={<Eye size={16} />}
        accentColor="#8B5CF6"
        trend={null}
      />
      <KPICard
        label="Avg Engagement Rate"
        value={kpi?.avg_engagement_rate != null ? kpi.avg_engagement_rate + '%' : '—'}
        sub="likes + comments / reach"
        icon={<TrendingUp size={16} />}
        accentColor="#10B981"
        trend={null}
      />
      <KPICard
        label="Posts This Week"
        value={kpi?.total_posts ?? '—'}
        sub="feed + reels + stories"
        icon={<Camera size={16} />}
        accentColor="#06B6D4"
        trend={null}
      />
    </div>
  );
}

export function EngagementMini({ likes, comments, shares, saved }) {
  const items = [
    { icon: <Heart size={11} />, value: likes, label: 'likes' },
    { icon: <MessageCircle size={11} />, value: comments, label: 'cmts' },
    { icon: <Share2 size={11} />, value: shares, label: 'shares' },
    { icon: <Bookmark size={11} />, value: saved, label: 'saved' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {items.map(({ icon, value, label }) => (
        value != null && (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#EC4899' }}>{icon}</span>
            <span style={{ fontWeight: 600 }}>{fmtNum(value)}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>{label}</span>
          </span>
        )
      ))}
    </div>
  );
}

export { fmtNum };
