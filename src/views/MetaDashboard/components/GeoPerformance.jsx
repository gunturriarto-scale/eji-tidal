import React, { useState } from 'react';

const fmtRp = (n) => {
  if (!n && n !== 0) return 'Rp 0';
  return 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmt = (n) => {
  if (!n && n !== 0) return '0';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const GeoPerformance = ({ data }) => {
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...data].sort((a, b) => {
    const av = Number(a[sortKey]) || 0;
    const bv = Number(b[sortKey]) || 0;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        No geo data available
      </div>
    );
  }

  const totalSpend = data.reduce((s, d) => s + (Number(d.spend) || 0), 0);

  const COLUMNS = [
    { key: 'spend', label: 'Spend' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'reach', label: 'Reach' },
    { key: 'clicks', label: 'Clicks' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {['spend', 'impressions', 'reach', 'clicks'].map(key => {
          const val = key === 'spend' ? fmtRp(sorted[0]?.[key] || 0) : fmt(sorted[0]?.[key] || 0);
          return (
            <div key={key} style={{
              padding: '0.4rem 0.75rem',
              background: sortKey === key ? 'rgba(79,70,229,0.1)' : 'rgba(255,255,255,0.03)',
              borderRadius: '8px', border: `1px solid ${sortKey === key ? 'rgba(79,70,229,0.3)' : 'var(--border-color)'}`,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              fontSize: '0.75rem', fontWeight: 600, color: sortKey === key ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }} onClick={() => handleSort(key)}>
              {key === 'spend' ? 'Top Spend' : key === 'impressions' ? 'Top Impr.' : key === 'reach' ? 'Top Reach' : 'Top Clicks'}: {val}
            </div>
          );
        })}
      </div>

      <div style={{ maxHeight: '360px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)' }}>
            <tr>
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-color)' }}>#</th>
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-color)' }}>Region</th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: 'right',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {col.label} {sortKey === col.key && (sortDir === 'desc' ? '↓' : '↑')}
                </th>
              ))}
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-color)' }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const spend = Number(row.spend) || 0;
              const share = totalSpend > 0 ? ((spend / totalSpend) * 100).toFixed(1) : '0.0';
              const cpm = row.impressions > 0 ? ((spend / row.impressions) * 1000).toFixed(0) : 0;
              const regionName = row.REGION?.replace(' Province', '').replace(', Indonesia', '') || '—';

              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{i + 1}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{regionName}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, textAlign: 'right' }}>{fmtRp(spend)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{fmt(row.impressions)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{fmt(row.reach)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{fmt(row.clicks)}</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                      background: 'rgba(79,70,229,0.08)', color: 'var(--accent-primary)',
                    }}>
                      {share}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};