import React from 'react';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'content',   label: 'Content Library' },
  { id: 'video',     label: 'Video Performance' },
  { id: 'audience',  label: 'Audience' },
];

export function TK_SectionTabs({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '0.25rem',
      marginBottom: '1.25rem',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      padding: '4px',
      border: '1px solid rgba(255,255,255,0.06)',
      width: 'fit-content',
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '0.45rem 1.1rem',
            borderRadius: '7px',
            border: 'none',
            background: activeTab === tab.id ? '#FF0050' : 'transparent',
            color: activeTab === tab.id ? '#fff' : 'var(--text-tertiary)',
            fontSize: '0.75rem',
            fontWeight: activeTab === tab.id ? 700 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
