import React, { useState } from 'react';

const fmtRp = (n) => {
  if (!n && n !== 0) return 'Rp 0';
  return 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmt = (n) => {
  if (!n && n !== 0) return '0';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

export const AdTable = ({ data, brandLabels, brandColors }) => {
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
    { key: null, label: 'Creative' },
    { key: null, label: 'Brand' },
    { key: null, label: 'Ad Name', style: { minWidth: 180 } },
    { key: 'spend', label: 'Spend' },
    { key: 'impressions', label: 'Impr.' },
    { key: 'clicks', label: 'Clicks' },
    { key: null, label: 'CTR' },
    { key: null, label: 'ROAS' },
    { key: null, label: 'Status' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {sorted.length} ads · showing top by spend
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
                    padding: '0.55rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.65rem',
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
                    <span style={{ marginLeft: '4px', fontSize: '0.6rem' }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
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
                  <td style={{ padding: '0.4rem 0.75rem', width: '52px' }}>
                    {row.thumbnail_url ? (
                      <img
                        src={row.thumbnail_url}
                        alt=""
                        onError={e => { e.target.style.display = 'none'; }}
                        style={{
                          width: '44px', height: '44px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: `1px solid ${brandColor}30`,
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '6px',
                        background: `${brandColor}15`,
                        border: `1px solid ${brandColor}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: brandColor, fontWeight: 700,
                      }}>
                        AD
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                      color: brandColor,
                      background: `${brandColor}15`,
                    }}>
                      {brandLabel}
                    </span>
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-secondary)' }} title={row.AD_NAME}>
                    {row.AD_NAME}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, fontSize: '0.82rem' }}>{fmtRp(row.spend)}</td>
                  <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{fmt(row.impressions)}</td>
                  <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{fmt(row.clicks)}</td>
                  <td style={{ padding: '0.55rem 0.75rem', fontSize: '0.78rem', color: parseFloat(ctr) > 1 ? '#10B981' : 'var(--text-secondary)' }}>{ctr}%</td>
                  <td style={{ padding: '0.55rem 0.75rem' }}><ROASBadge roas={roas} /></td>
                  <td style={{ padding: '0.55rem 0.75rem' }}><StatusBadge status={row.AD_STATUS} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.78rem', opacity: page === 0 ? 0.4 : 1 }}>
            ← Prev
          </button>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.78rem', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};