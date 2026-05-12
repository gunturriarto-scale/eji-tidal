import React from 'react';
import { ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

function TopPerformersTable({ posts = [] }) {
  if (!posts?.length) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        No post data available
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        Top 10 Posts by Engagement Score
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>#</th>
            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Date</th>
            <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Caption</th>
            <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Likes</th>
            <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Cmts</th>
            <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Reach</th>
            <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Views</th>
            <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>ER%</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p, idx) => {
            const ts = p.TIMESTAMP?.value || p.TIMESTAMP;
            const dateStr = ts ? new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—';
            const er = p.engagement_rate;
            const erColor = er >= 5 ? '#10B981' : er >= 2 ? '#F59E0B' : '#EF4444';

            return (
              <tr key={p.MEDIA_ID} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx === 0 ? 'rgba(236,72,153,0.05)' : 'transparent' }}>
                <td style={{ padding: '8px', color: idx < 3 ? '#EC4899' : 'var(--text-tertiary)', fontWeight: 700 }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </td>
                <td style={{ padding: '8px', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{dateStr}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700,
                    padding: '2px 6px', borderRadius: '4px',
                    background: `${typeColor(p.MEDIA_PRODUCT_TYPE)}18`,
                    color: typeColor(p.MEDIA_PRODUCT_TYPE),
                  }}>
                    {p.MEDIA_PRODUCT_TYPE}
                  </span>
                </td>
                <td style={{ padding: '8px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.MEDIA_CAPTION?.substring(0, 60) || '—'}{p.MEDIA_CAPTION?.length > 60 ? '…' : ''}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#EC4899' }}>{fmtNum(p.MEDIA_LIKE_COUNT)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{fmtNum(p.MEDIA_COMMENTS_COUNT)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#8B5CF6' }}>{fmtNum(p.MEDIA_REACH)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>{fmtNum(p.MEDIA_VIEWS)}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: erColor }}>
                  {er != null ? er + '%' : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ContentTypeDonut({ posts = [] }) {
  const typeMap = {};
  posts.forEach(p => {
    const t = p.MEDIA_PRODUCT_TYPE || 'Unknown';
    if (!typeMap[t]) typeMap[t] = 0;
    typeMap[t]++;
  });

  const data = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  const COLORS = ['#EC4899', '#F97316', '#8B5CF6'];

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        Content Type Distribution
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.72rem' }}
            itemStyle={{ color: 'white' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {data.map(({ name, value }, idx) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
            {name}: <strong style={{ color: 'var(--text-primary)' }}>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IG_TopPerformers({ topPosts = [], allMedia = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <TopPerformersTable posts={topPosts} />
        <ContentTypeDonut posts={topPosts} />
      </div>
    </div>
  );
}

export { fmtNum };