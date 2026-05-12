import React from 'react';

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'content', label: '🎬 Content' },
  { id: 'audience', label: '👥 Audience' },
  { id: 'demographics', label: '📈 Demographics' },
  { id: 'story', label: '📱 Story' },
  { id: 'performance', label: '🏆 Performance' },
];

export function IG_SectionTabs({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.25rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      marginBottom: '1.5rem',
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '0.65rem 1.1rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isActive ? '#EC4899' : 'var(--text-tertiary)',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid #EC4899' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
