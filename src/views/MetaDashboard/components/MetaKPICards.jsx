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

const KPICard = ({ icon, label, value, sub }) => (
  <div className="glass-panel" style={{
    padding: '0.85rem 1rem',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    flex: 1,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{
        padding: '4px',
        background: 'rgba(79,70,229,0.1)',
        borderRadius: '6px',
        color: 'var(--accent-primary)',
        display: 'flex'
      }}>
        {icon}
      </div>
    </div>
    <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
  </div>
);

export const MetaKPICards = ({ kpis }) => {
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
        />
        <KPICard
          icon={<Eye size={16} />}
          label="Impressions"
          value={fmt(kpis.impressions)}
        />
        <KPICard
          icon={<MousePointerClick size={16} />}
          label="Clicks"
          value={fmt(kpis.clicks)}
        />
        <KPICard
          icon={<TrendingUp size={16} />}
          label="Post Engagement"
          value={fmt(kpis.postEngagement)}
        />
        <KPICard
          icon={<Play size={16} />}
          label="Video Views"
          value={fmt(kpis.videoViews)}
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
        />
        <KPICard
          icon={<MousePointerClick size={16} />}
          label="CPC"
          value={fmtRp(kpis.cpc)}
        />
        <KPICard
          icon={<Play size={16} />}
          label="CPV"
          value={fmtRp(kpis.cpv)}
        />
        <KPICard
          icon={<TrendingUp size={16} />}
          label="CTR"
          value={`${kpis.ctr}%`}
        />
        <KPICard
          icon={<TrendingUp size={16} />}
          label="CPE"
          value={fmtRp(kpis.cpe)}
        />
      </div>
    </div>
  );
};