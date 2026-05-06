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

const KPICard = ({ icon, label, value, sub, accent, wide }) => (
  <div className="glass-panel" style={{
    padding: '0.85rem 1rem',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    flex: wide ? 2 : 1,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{
        padding: '4px',
        background: accent ? 'rgba(16,185,129,0.1)' : 'rgba(79,70,229,0.1)',
        borderRadius: '6px',
        color: accent || 'var(--accent-primary)',
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '0.75rem'
    }}>
      <KPICard
        icon={<DollarSign size={16} />}
        label="Total Spend"
        value={fmtRp(kpis.spend)}
        sub={`${kpis.impressions > 0 ? fmt(Math.round(kpis.spend / (kpis.impressions / 1000))) + '/K impr' : 'No impressions'}`}
      />
      <KPICard
        icon={<Eye size={16} />}
        label="Impressions"
        value={fmt(kpis.impressions)}
        sub={`Reach: ${fmt(kpis.reach)}`}
      />
      <KPICard
        icon={<MousePointerClick size={16} />}
        label="Clicks"
        value={fmt(kpis.clicks)}
        sub={`CTR: ${kpis.ctr}%`}
      />
      <KPICard
        icon={<TrendingUp size={16} />}
        label="CTR"
        value={`${kpis.ctr}%`}
        sub="Click-through rate"
      />
      <KPICard
        icon={<BarChart2 size={16} />}
        label="CPM"
        value={fmtRp(kpis.cpm)}
        sub="Cost per 1K impr."
      />
      <KPICard
        icon={<MousePointerClick size={16} />}
        label="CPC"
        value={fmtRp(kpis.cpc)}
        sub="Cost per click"
      />
      <KPICard
        icon={<Play size={16} />}
        label="CPV"
        value={fmtRp(kpis.cpv)}
        sub="Cost per video view"
      />
      <KPICard
        icon={<Play size={16} />}
        label="Video Views"
        value={fmt(kpis.videoViews)}
        sub={`ThruPlay: ${kpis.thruplayRate}%`}
      />
      {/*
      <KPICard
        icon={<ShoppingCart size={16} />}
        label="Purchase Value"
        value={fmtRp(kpis.purchaseValue)}
        sub={`${fmt(kpis.purchases)} purchases`}
        accent="#10B981"
        wide
      />
      */}
    </div>
  );
};