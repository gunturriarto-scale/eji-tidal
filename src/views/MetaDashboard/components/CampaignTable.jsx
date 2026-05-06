import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const fmtRp = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const fmt = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const ROASBadge = ({ roas }) => {
  if (!roas || roas <= 0) return <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>—</span>;
  const color = roas >= 3 ? '#10B981' : roas >= 1 ? '#F59E0B' : '#EF4444';
  const bg = roas >= 3 ? 'rgba(16,185,129,0.1)' : roas >= 1 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', color, background: bg }}>
      {roas.toFixed(1)}x
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const isActive = status === 'ACTIVE';
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
      color: isActive ? '#10B981' : '#94A3B8',
      background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
    }}>
      {isActive ? 'Active' : 'Paused'}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{
      padding: '0.75rem 1rem',
      border: '1px solid rgba(79,70,229,0.25)',
      background: 'rgba(20,20,29,0.95)',
      borderRadius: '8px', minWidth: '160px'
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
        {label?.substring(0, 40)}{label?.length > 40 ? '...' : ''}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8rem', color: p.color }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.name?.includes('Spend') ? fmtRp(p.value) : fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const CampaignTable = ({ data, brandLabels, brandColors }) => {
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...data].sort((a, b) => {
    const av = Number(a[sortKey]) || 0;
    const bv = Number(b[sortKey]) || 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const COLUMNS = [
    { key: null, label: 'Brand' },
    { key: null, label: 'Campaign', style: { minWidth: 200 } },
    { key: 'spend', label: 'Spend' },
    { key: 'impressions', label: 'Impr.' },
    { key: 'reach', label: 'Reach' },
    { key: 'clicks', label: 'Clicks' },
    { key: null, label: 'CTR' },
    { key: null, label: 'ROAS' },
    { key: null, label: 'Status' },
  ];

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          Showing {paged.length} of {sorted.length} campaigns
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['Skincare', 'Decorative', 'Bodycare'].map(b => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: brandColors[b] }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: brandColors[b] }} />
              {b}
            </div>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.label}
                  onClick={col.key ? () => handleSort(col.key) : undefined}
                  style={{
                    padding: '0.6rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: col.key ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    ...(col.style || {}),
                  }}
                >
                  {col.label}
                  {col.key && sortKey === col.key && (
                    <span style={{ marginLeft: '4px', fontSize: '0.65rem' }}>
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const ctr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : '0.00';
              const roas = row.purchase_value && row.spend > 0 ? (row.purchase_value / row.spend) : 0;
              const brandLabel = brandLabels[row.ACCOUNT_NAME] || row.ACCOUNT_NAME?.split('//').pop()?.trim() || '—';
              const brandColor = brandColors[brandLabel] || '#4F46E5';

              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                      color: brandColor,
                      background: `${brandColor}15`,
                    }}>
                      {brandLabel}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }} title={row.CAMPAIGN_NAME}>
                    {row.CAMPAIGN_NAME}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontSize: '0.85rem' }}>{fmtRp(row.spend)}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fmt(row.impressions)}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fmt(row.reach)}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fmt(row.clicks)}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: parseFloat(ctr) > 1 ? '#10B981' : 'var(--text-secondary)' }}>{ctr}%</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}><ROASBadge roas={roas} /></td>
                  <td style={{ padding: '0.6rem 0.75rem' }}><StatusBadge status={row.CAMPAIGN_STATUS} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px', color: 'var(--text-secondary)',
              fontSize: '0.8rem', cursor: page === 0 ? 'not-allowed' : 'pointer',
              opacity: page === 0 ? 0.4 : 1
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px', color: 'var(--text-secondary)',
              fontSize: '0.8rem', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages - 1 ? 0.4 : 1
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};