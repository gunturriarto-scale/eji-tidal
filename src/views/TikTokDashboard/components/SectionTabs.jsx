import React from 'react';

const TABS = [
  { key: 'overview',   label: 'Overview' },
  { key: 'video',      label: 'Video' },
  { key: 'campaigns',  label: 'Campaigns' },
  { key: 'audience',   label: 'Audience' },
  { key: 'geo',        label: 'Geo + Device' },
  { key: 'dayofweek',  label: 'Day of Week' },
];

export const SectionTabs = ({ activeTab, onTabChange, children }) => {
  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        marginBottom: '1.5rem',
        padding: '4px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        overflowX: 'auto',
        flexWrap: 'nowrap',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              padding: '7px 16px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #FF0050, #E11D48)'
                : 'transparent',
              color: activeTab === tab.key
                ? '#fff'
                : 'var(--text-tertiary)',
              boxShadow: activeTab === tab.key
                ? '0 0 12px rgba(255,0,80,0.3)'
                : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {children}
    </div>
  );
};
