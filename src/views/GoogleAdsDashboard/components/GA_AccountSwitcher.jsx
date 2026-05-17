import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ACCENT = '#4285F4';

function shortName(name) {
  if (!name) return name;
  return name.replace(/^EJI\s*[//]+\s*HANASUI\s*[//]+\s*/i, '').trim();
}

export function GA_AccountSwitcher({ accounts, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const options = [{ ACCOUNT_NAME: 'all' }, ...(accounts || [])];

  const displayLabel = selected === 'all' ? 'All Accounts' : shortName(selected);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${ACCENT}50`,
          borderRadius: '8px', color: ACCENT,
          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
        }}
      >
        {displayLabel}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '240px', background: 'rgba(15,23,42,0.97)',
          border: `1px solid ${ACCENT}30`, borderRadius: '10px',
          overflow: 'hidden', backdropFilter: 'blur(20px)',
          zIndex: 200, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          {options.map(opt => {
            const val = opt.ACCOUNT_NAME;
            const label = val === 'all' ? 'All Accounts' : shortName(val);
            const isActive = selected === val;
            return (
              <button
                key={val}
                onClick={() => { onChange(val); setOpen(false); }}
                style={{
                  width: '100%', padding: '0.6rem 1rem', textAlign: 'left',
                  background: isActive ? `${ACCENT}18` : 'transparent',
                  color: isActive ? ACCENT : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer', fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 400, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
