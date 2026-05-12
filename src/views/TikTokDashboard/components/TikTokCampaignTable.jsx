import React, { useState } from 'react';

const PAGE_SIZE = 5;

const SortIcon = ({ active, dir }) => (
  <span style={{ fontSize: '0.65rem', marginLeft: '4px', color: active ? '#FF0050' : 'var(--text-tertiary)' }}>
    {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
  </span>
);

export const TikTokCampaignTable = ({ data }) => {
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  if (!data || data.length === 0) return null;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
  const fmtRp = (n) => n ? 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

  const sorted = [...data].sort((a, b) => {
    const av = Number(a[sortKey]) || 0;
    const bv = Number(b[sortKey]) || 0;
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const TH = ({ label, col }) => (
    <th
      onClick={() => handleSort(col)}
      style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {label}<SortIcon active={sortKey === col} dir={sortDir} />
    </th>
  );

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <TH label="Brand" col="account_name" />
              <TH label="Campaign" col="CAMPAIGN_NAME" />
              <TH label="Objective" col="CAMPAIGN_OBJECTIVE_TYPE" />
              <TH label="Spend" col="spend" />
              <TH label="Impressions" col="impressions" />
              <TH label="Clicks" col="clicks" />
              <TH label="Video 2s" col="video_2s" />
              <TH label="Conv" col="conversions" />
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.6rem 0.75rem', color: '#FF0050', fontWeight: 600, fontSize: '0.7rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.account_name?.split('//').pop()?.trim() || '—'}
                </td>
                <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.CAMPAIGN_NAME || '—'}
                </td>
                <td style={{ padding: '0.6rem 0.75rem' }}>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,0,80,0.1)', color: '#FF0050', borderRadius: '4px', fontWeight: 600 }}>
                    {row.CAMPAIGN_OBJECTIVE_TYPE || '—'}
                  </span>
                </td>
                <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>{fmtRp(row.spend)}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{fmt(row.impressions)}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{fmt(row.clicks)}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#FF0050' }}>{fmt(row.video_2s)}</td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#10B981' }}>{fmt(row.conversions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0 0.5rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
              ←
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
