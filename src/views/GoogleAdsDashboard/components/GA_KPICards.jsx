import React from 'react';
import { DollarSign, MousePointerClick, Eye, TrendingUp, ShoppingCart, Zap, BarChart2, Target } from 'lucide-react';

function fmtIDR(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function fmtNum(n, decimals = 1) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(decimals) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(decimals) + 'K';
  return v.toLocaleString();
}

function KPICard({ icon, label, value, sub, color, badge }) {
  return (
    <div className="glass-panel" style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{sub}</div>}
      </div>
      {badge && (
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: `${color}18`, color, borderRadius: '4px', fontWeight: 700 }}>{badge}</span>
        </div>
      )}
    </div>
  );
}

export function GA_KPICards({ kpi }) {
  if (!kpi) return null;

  const cards = [
    {
      icon: <DollarSign size={16} />,
      label: 'Total Spend',
      value: `IDR ${fmtIDR(kpi.total_cost)}`,
      sub: `Budget: IDR ${fmtIDR(kpi.total_daily_budget)}/day`,
      color: '#4285F4',
    },
    {
      icon: <Eye size={16} />,
      label: 'Impressions',
      value: fmtNum(kpi.total_impressions),
      sub: `CPM: IDR ${fmtIDR(kpi.cpm)}`,
      color: '#FBBC04',
    },
    {
      icon: <MousePointerClick size={16} />,
      label: 'Clicks',
      value: fmtNum(kpi.total_clicks),
      sub: `CTR: ${kpi.ctr != null ? kpi.ctr + '%' : '—'}`,
      color: '#EA4335',
    },
    {
      icon: <DollarSign size={16} />,
      label: 'CPC',
      value: `IDR ${fmtIDR(kpi.cpc)}`,
      sub: 'Cost per Click',
      color: '#8B5CF6',
    },
    {
      icon: <ShoppingCart size={16} />,
      label: 'Conversions',
      value: fmtNum(kpi.total_conversions, 0),
      sub: `Conv Rate: ${kpi.conv_rate != null ? kpi.conv_rate + '%' : '—'}`,
      color: '#34A853',
    },
    {
      icon: <TrendingUp size={16} />,
      label: 'ROAS',
      value: kpi.roas != null ? kpi.roas + 'x' : '—',
      sub: `Value: IDR ${fmtIDR(kpi.total_conv_value)}`,
      color: '#10B981',
    },
    {
      icon: <BarChart2 size={16} />,
      label: 'CPM',
      value: `IDR ${fmtIDR(kpi.cpm)}`,
      sub: 'Cost per 1,000 Impressions',
      color: '#06B6D4',
    },
    {
      icon: <Zap size={16} />,
      label: 'Video Views',
      value: fmtNum(kpi.total_video_views),
      sub: 'YouTube + Video campaigns',
      color: '#F59E0B',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  );
}
