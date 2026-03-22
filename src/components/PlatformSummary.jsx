import React from 'react';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';

export const PlatformSummary = ({ title, stats }) => {
  return (
    <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
      {stats.map((stat, idx) => (
        <div key={idx} className="glass-panel kpi-card fade-in">
          <div className="kpi-header">
            <span>{stat.label}</span>
            <div className="kpi-icon">{stat.icon}</div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.5rem' }}>
            {stat.format === 'currency' ? formatCurrency(stat.value) : formatNumber(stat.value)}
          </div>
        </div>
      ))}
    </div>
  );
};
