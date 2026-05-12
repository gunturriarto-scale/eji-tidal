import React from 'react';

const ACCOUNT_COLORS = {
  'Official Hanasui': '#EC4899',
  'Next Level by Hanasui': '#8B5CF6',
  'Official Skincare Hanasui': '#06B6D4',
};

export function IG_AccountSwitcher({ accounts, selected, onChange }) {
  if (!accounts?.length) return null;

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
    }}>
      {accounts.map((acc) => {
        const isActive = selected === acc.ACCOUNT_ID || selected === 'all';
        const color = ACCOUNT_COLORS[acc.ACCOUNT_NAME] || '#EC4899';
        const followers = acc.FOLLOWERS_COUNT;

        return (
          <button
            key={acc.ACCOUNT_ID}
            onClick={() => onChange(acc.ACCOUNT_ID)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: isActive ? `1.5px solid ${color}` : '1.5px solid rgba(255,255,255,0.08)',
              background: isActive ? `${color}18` : 'rgba(255,255,255,0.03)',
              color: isActive ? color : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Color dot */}
            <div style={{
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: color,
              flexShrink: 0,
            }} />

            {/* Account name + follower count */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ lineHeight: 1.2 }}>{acc.ACCOUNT_NAME}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 400 }}>
                {followers >= 1000 ? (followers / 1000).toFixed(0) + 'K' : followers} followers
              </span>
            </div>
          </button>
        );
      })}

      {/* All accounts option */}
      <button
        onClick={() => onChange('all')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: selected === 'all' ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px solid rgba(255,255,255,0.08)',
          background: selected === 'all' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
          color: selected === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
      >
        <span>All Accounts</span>
      </button>
    </div>
  );
}
