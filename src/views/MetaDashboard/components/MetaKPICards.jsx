import React from 'react';
import { DollarSign, Eye, MousePointerClick, TrendingUp, BarChart2, Play } from 'lucide-react';

const fmtRp = (n) => {
  if (!n && n !== 0) return '—';
  return 'Rp ' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Trend badge: up = green, down = red, flat = muted
const TrendBadge = ({ change }) => {
  if (change == null || isNaN(change)) return null;
  const isUp = change >= 0;
  const color = isUp ? '#10B981' : '#EF4444';
  const sign = isUp ? '+' : '';
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 700, color,
      background: `${color}18`,
      padding: '1px 5px', borderRadius: '4px',
      letterSpacing: '0.02em',
    }}>
      {isUp ? '↑' : '↓'} {sign}{Math.abs(change).toFixed(1)}%
    </span>
  );
};

const KPICard = ({ icon, label, value, sub, change }) => (
  <div className="glass-panel" style={{
    padding: '0.85rem 1rem',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    flex: 1,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{
        padding: '4px',
        background: 'rgba(79,70,229,0.1)',
        borderRadius: '6px',
        color: 'var(--accent-primary)',
        display: 'flex', flex: 'none'
      }}>
        {icon}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
        {value}
      </div>
      {change != null && !isNaN(change) && (
        <TrendBadge change={change} />
      )}
    </div>
    {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
  </div>
);

// Compute % change: (current - prev) / prev * 100
const pctChange = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
};

export const MetaKPICards = ({ kpis, prevKpis }) => {
  const trend = {};
  if (prevKpis) {
    trend.spend = pctChange(kpis.spend, prevKpis.spend);
    trend.impressions = pctChange(kpis.impressions, prevKpis.impressions);
    trend.clicks = pctChange(kpis.clicks, prevKpis.clicks);
    trend.postEngagement = pctChange(kpis.postEngagement, prevKpis.postEngagement);
    trend.videoViews = pctChange(kpis.videoViews, prevKpis.videoViews);
    trend.cpm = pctChange(Number(kpis.cpm), Number(prevKpis.cpm));
    trend.cpc = pctChange(Number(kpis.cpc), Number(prevKpis.cpc));
    trend.cpv = pctChange(Number(kpis.cpv), Number(prevKpis.cpv));
    trend.ctr = pctChange(Number(kpis.ctr), Number(prevKpis.ctr));
    trend.cpe = pctChange(Number(kpis.cpe), Number(prevKpis.cpe));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Row 1: Volume Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.75rem'
      }}>
        <KPICard
          icon={<DollarSign size={16} />}
          label="Total Spend"
          value={fmtRp(kpis.spend)}
          change={trend.spend}
        />
        <KPICard
          icon={<Eye size={16} />}
          label="Impressions"
          value={fmt(kpis.impressions)}
          change={trend.impressions}
        />
        <KPICard
          icon={<MousePointerClick size={16} />}
          label="Clicks"
          value={fmt(kpis.clicks)}
          change={trend.clicks}
        />
        <KPICard
          icon={<TrendingUp size={16} />}
          label="Post Engagement"
          value={fmt(kpis.postEngagement)}
          change={trend.postEngagement}
        />
        <KPICard
          icon={<Play size={16} />}
          label="Video Views"
          value={fmt(kpis.videoViews)}
          change={trend.videoViews}
        />
      </div>

      {/* Row 2: Cost & Rate Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.75rem'
      }}>
        <KPICard
          icon={<BarChart2 size={16} />}
          label="CPM"
          value={fmtRp(kpis.cpm)}
          change={trend.cpm}
        />
        <KPICard
          icon={<MousePointerClick size={16} />}
          label="CPC"
          value={fmtRp(kpis.cpc)}
          change={trend.cpc}
        />
        <KPICard
          icon={<Play size={16} />}
          label="CPV"
          value={fmtRp(kpis.cpv)}
          change={trend.cpv}
        />
        <KPICard
          icon={<TrendingUp size={16} />}
          label="CTR"
          value={`${kpis.ctr}%`}
          change={trend.ctr}
        />
        <KPICard
          icon={<TrendingUp size={16} />}
          label="CPE"
          value={fmtRp(kpis.cpe)}
          change={trend.cpe}
        />
      </div>
    </div>
  );
};