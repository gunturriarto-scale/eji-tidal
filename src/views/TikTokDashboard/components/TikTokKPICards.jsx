import React from 'react';

const TrendBadge = ({ current, prev, prefix = '', suffix = '', invertColors = false }) => {
  if (!prev || prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  if (Math.abs(pct) < 0.01) return null;
  const isPositive = pct > 0;
  const isGood = invertColors ? !isPositive : isPositive;
  const color = isGood ? '#10B981' : '#EF4444';
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 700, color,
      background: `${color}18`, padding: '1px 5px',
      borderRadius: '4px', marginLeft: '4px',
      letterSpacing: '0.02em'
    }}>
      {isPositive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

const Card = ({ label, value, sub, icon: Icon, accent, badge }) => (
  <div className="glass-panel" style={{
    padding: '1rem 1.25rem',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    minWidth: 0
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      {Icon && <Icon size={14} color={accent || '#FF0050'} />}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{sub}</span>}
    </div>
    {badge}
  </div>
);

export const TikTokKPICards = ({ kpis, prevKpis }) => {
  if (!kpis) return null;
  const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
  const fmtRp = (n) => n ? 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '0.75rem'
    }}>
      <Card label="Total Spend" value={fmtRp(kpis.spend)} accent="#FF0050"
        badge={<TrendBadge current={kpis.spend} prev={prevKpis?.spend} prefix="Rp " />} />
      <Card label="Impressions" value={fmt(kpis.impressions)} accent="#FF0050"
        badge={<TrendBadge current={kpis.impressions} prev={prevKpis?.impressions} />} />
      <Card label="Clicks" value={fmt(kpis.clicks)} accent="#FF0050"
        badge={<TrendBadge current={kpis.clicks} prev={prevKpis?.clicks} />} />
      <Card label="CTR" value={kpis.ctr + '%'} sub="" accent="#FF0050"
        badge={<TrendBadge current={parseFloat(kpis.ctr)} prev={parseFloat(prevKpis?.ctr || 0)} suffix="%" />} />
      <Card label="CPM" value={'Rp ' + kpis.cpm} sub="" accent="#FF0050"
        badge={<TrendBadge current={parseFloat(kpis.cpm)} prev={parseFloat(prevKpis?.cpm || 0)} invertColors />} />
      <Card label="CPC" value={'Rp ' + kpis.cpc} sub="" accent="#FF0050"
        badge={<TrendBadge current={parseFloat(kpis.cpc)} prev={parseFloat(prevKpis?.cpc || 0)} invertColors />} />
      <Card label="2s Views" value={fmt(kpis.video2s)} accent="#FF0050"
        badge={<TrendBadge current={kpis.video2s} prev={prevKpis?.video2s} />} />
      <Card label="6s Views" value={fmt(kpis.video6s)} accent="#E11D48"
        badge={<TrendBadge current={kpis.video6s} prev={prevKpis?.video6s} />} />
      <Card label="6s Rate" value={kpis.video6sRate + '%'} sub="of 2s" accent="#E11D48"
        badge={<TrendBadge current={parseFloat(kpis.video6sRate)} prev={parseFloat(prevKpis?.video6sRate || 0)} suffix="%" />} />
      <Card label="Video Plays" value={fmt(kpis.videoPlays)} accent="#DB2777"
        badge={<TrendBadge current={kpis.videoPlays} prev={prevKpis?.videoPlays} />} />
      <Card label="Conversions" value={fmt(kpis.conversions)} accent="#10B981"
        badge={<TrendBadge current={kpis.conversions} prev={prevKpis?.conversions} />} />
    </div>
  );
};
