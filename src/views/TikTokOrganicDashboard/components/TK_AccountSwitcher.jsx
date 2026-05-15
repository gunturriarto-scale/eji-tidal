import React from 'react';

export function TK_AccountSwitcher({ accounts, selected, onChange }) {
  if (!accounts || accounts.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginRight: '0.25rem' }}>
        Account
      </span>
      <button
        onClick={() => onChange('all')}
        style={{
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          border: '1.5px solid',
          borderColor: selected === 'all' ? '#FF0050' : 'rgba(255,255,255,0.1)',
          background: selected === 'all' ? 'rgba(255,0,80,0.12)' : 'transparent',
          color: selected === 'all' ? '#FF0050' : 'var(--text-secondary)',
          fontSize: '0.72rem',
          fontWeight: selected === 'all' ? 700 : 400,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        All Accounts
      </button>
      {accounts.map(acc => (
        <button
          key={acc.USERNAME}
          onClick={() => onChange(acc.USERNAME)}
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            border: '1.5px solid',
            borderColor: selected === acc.USERNAME ? '#FF0050' : 'rgba(255,255,255,0.1)',
            background: selected === acc.USERNAME ? 'rgba(255,0,80,0.12)' : 'transparent',
            color: selected === acc.USERNAME ? '#FF0050' : 'var(--text-secondary)',
            fontSize: '0.72rem',
            fontWeight: selected === acc.USERNAME ? 700 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          @{acc.USERNAME}
        </button>
      ))}
    </div>
  );
}
