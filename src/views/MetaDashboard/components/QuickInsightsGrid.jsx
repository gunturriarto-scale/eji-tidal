import React from 'react';
import { SpendTrendChart } from './SpendTrendChart';
import { BrandDonut } from './BrandDonut';
import { PlatformBreakdown } from './PlatformBreakdown';
import { CampaignObjectiveChart } from './CampaignObjectiveChart';

const QUADRANT_LABELS = {
  spendTrend: 'Spend Trend',
  brandDonut: 'Brand Split',
  platform: 'Platform',
  objective: 'Objective',
};

export const QuickInsightsGrid = ({
  trendData,
  brandDonutData,
  platformData,
  platformTrend,
  campaignObjective,
  brandColors,
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem',
    }}>
      {/* Top Left: Spend Trend */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            {QUADRANT_LABELS.spendTrend}
          </span>
        </div>
        <SpendTrendChart data={trendData} brandColors={brandColors} compact />
      </div>

      {/* Top Right: Brand Donut */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            {QUADRANT_LABELS.brandDonut}
          </span>
        </div>
        <BrandDonut data={brandDonutData} compact />
      </div>

      {/* Bottom Left: Platform Performance */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            {QUADRANT_LABELS.platform}
          </span>
        </div>
        <PlatformBreakdown data={platformData} trendData={platformTrend} compact />
      </div>

      {/* Bottom Right: Campaign Objective */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            {QUADRANT_LABELS.objective}
          </span>
        </div>
        <CampaignObjectiveChart data={campaignObjective} compact />
      </div>
    </div>
  );
};