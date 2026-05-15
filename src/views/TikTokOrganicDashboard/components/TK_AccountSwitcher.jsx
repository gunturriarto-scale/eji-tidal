import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User } from 'lucide-react';

export function TK_AccountSwitcher({ accounts, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!accounts || accounts.length === 0) return null;

  const selectedLabel = selected === 'all'
    ? 'All Accounts'
    : accounts.find(a => a.USERNAME === selected)?.DISPLAY_NAME || `@${selected}`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(255,255,255,0.04)',
          border: '1.5px solid rgba(255,0,80,0.3)',
          borderRadius: '8px', color: '#FF0050',
          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
          backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
        }}
      >
        <User size={14} />
        {selectedLabel}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          minWidth: '200px', background: 'rgba(15,23,42,0.97)',
          border: '1px solid rgba(255,0,80,0.2)', borderRadius: '10px',
          overflow: 'hidden', backdropFilter: 'blur(20px)',
          zIndex: 200, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          {[{ USERNAME: 'all', DISPLAY_NAME: 'All Accounts' }, ...accounts].map(acc => (
            <button
              key={acc.USERNAME}
              onClick={() => { onChange(acc.USERNAME); setOpen(false); }}
              style={{
                width: '100%', padding: '0.6rem 1rem', textAlign: 'left',
                background: selected === acc.USERNAME ? 'rgba(255,0,80,0.12)' : 'transparent',
                color: selected === acc.USERNAME ? '#FF0050' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontSize: '0.75rem',
                fontWeight: selected === acc.USERNAME ? 700 : 400, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (selected !== acc.USERNAME) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (selected !== acc.USERNAME) e.currentTarget.style.background = 'transparent'; }}
            >
              {acc.USERNAME === 'all' ? 'All Accounts' : `@${acc.USERNAME}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
