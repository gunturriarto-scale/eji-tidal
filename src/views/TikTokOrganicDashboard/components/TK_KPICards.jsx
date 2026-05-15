import React from 'react';
import { Eye, Heart, MessageCircle, Share2, UserPlus, Users, Play, TrendingUp } from 'lucide-react';

function fmtNum(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function Card({ icon, label, value, color, sub }) {
  return (
    <div className="glass-panel" style={{
      padding: '1.1rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      borderTop: `2px solid ${color}40`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-12px', right: '-12px',
        width: '64px', height: '64px', borderRadius: '50%',
        background: `${color}10`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{sub}</div>
      )}
    </div>
  );
}

export function TK_KPICards({ kpi }) {
  if (!kpi) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '0.75rem',
      marginBottom: '1.5rem',
    }}>
      <Card icon={<Eye size={15} />}      label="Video Views"      value={fmtNum(kpi.total_video_views)}   color="#FF0050" />
      <Card icon={<Users size={15} />}    label="Followers"        value={fmtNum(kpi.current_followers)}   color="#7C3AED" sub="current" />
      <Card icon={<UserPlus size={15} />} label="New Followers"    value={fmtNum(kpi.total_new_followers)} color="#06B6D4" />
      <Card icon={<Heart size={15} />}    label="Likes"            value={fmtNum(kpi.total_likes)}         color="#EC4899" />
      <Card icon={<MessageCircle size={15} />} label="Comments"   value={fmtNum(kpi.total_comments)}      color="#F59E0B" />
      <Card icon={<Share2 size={15} />}   label="Shares"           value={fmtNum(kpi.total_shares)}        color="#10B981" />
      <Card icon={<TrendingUp size={15} />} label="Profile Views"  value={fmtNum(kpi.total_profile_views)} color="#8B5CF6" />
      <Card
        icon={<Play size={15} />}
        label="Avg Completion"
        value={kpi.avg_completion_rate != null ? `${kpi.avg_completion_rate}%` : '—'}
        color="#FF6B35"
        sub={`${fmtNum(kpi.total_videos)} videos`}
      />
    </div>
  );
}
