import React, { useMemo } from 'react';
import { getOverallKPIs, formatCurrency, formatNumber, getAggregatedByDate } from '../utils/dataAggregation';
import { useData } from '../context/DataContext';
import { dates as defaultDates } from '../data/mockData';
import { 
  DollarSign, 
  ShoppingCart, 
  MousePointerClick,
  BarChart3,
  BadgeCent,
  Eye,
  Activity,
  Users,
  Megaphone,
  CreditCard
} from 'lucide-react';

export const KPICards = ({ filteredData }) => {
  const { loading } = useData();
  const { tiktok, meta, google, kol, criteo, offsite, kpiDates: dates } = filteredData;

  const kpis = useMemo(() => {
    if (loading) return null;
    const activeDates = dates || defaultDates;
    const aggregatedData = getAggregatedByDate(tiktok, google, meta, offsite, kol, criteo, activeDates);
    return getOverallKPIs(tiktok, meta, google, kol, aggregatedData);
  }, [tiktok, meta, google, offsite, kol, criteo, loading, dates]);

  if (loading || !kpis) return null;

  // Selected KPIs for simplified view
  const selectedCards = [
    {
      title: "Total Awareness Spend",
      value: formatCurrency(kpis.totalSpend),
      icon: <DollarSign size={20} />,
      trend: kpis.trends?.totalSpend?.label || "0%",
      isPositive: kpis.trends?.totalSpend?.isPositive ?? true
    },
    {
      title: "Total Reach",
      value: formatNumber(kpis.totalReach),
      icon: <Megaphone size={20} />,
      trend: kpis.trends?.totalReach?.label || "0%",
      isPositive: kpis.trends?.totalReach?.isPositive ?? true
    },
    {
      title: "Total Impressions",
      value: formatNumber(kpis.totalImpressions),
      icon: <Users size={20} />,
      trend: kpis.trends?.totalImpressions?.label || "0%",
      isPositive: kpis.trends?.totalImpressions?.isPositive ?? true
    },
    {
      title: "Avg. CPM (Ads)",
      value: formatCurrency(kpis.avgCpm),
      icon: <BarChart3 size={20} />,
      trend: kpis.trends?.avgCpm?.label || "0%",
      isPositive: kpis.trends?.avgCpm?.isPositive ?? true
    }
  ];

  const renderCard = (card, idx) => (
    <div key={idx} className={`glass-panel kpi-card fade-in delay-${(idx % 4) + 1}`}>
      <div className="kpi-header">
        <span>{card.title}</span>
        <div className="kpi-icon">{card.icon}</div>
      </div>
      <div className="kpi-value">{card.value}</div>
      <div>
        <span className={`trend-indicator ${card.isPositive ? 'trend-positive' : 'trend-negative'}`}>
          {card.trend}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '0.5rem' }}>
          vs last period
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="kpi-grid">
        {selectedCards.map(renderCard)}
      </div>
    </div>
  );
};
