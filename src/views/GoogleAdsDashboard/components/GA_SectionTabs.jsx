import React from 'react';

const ACCENT = '#4285F4';

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'campaigns',    label: 'Campaigns' },
  { id: 'ads',          label: 'Ads' },
  { id: 'shopping',     label: 'Shopping' },
  { id: 'conversions',  label: 'Conversions' },
];

export function GA_SectionTabs({ activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
              color: isActive ? ACCENT : 'var(--text-tertiary)',
              fontSize: '0.75rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.02em',
              marginBottom: '-1px',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-tertiary)'; }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
