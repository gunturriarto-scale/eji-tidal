import React, { useState, useMemo } from 'react';
import { ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

function fmtNum(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function completionBadge(rate) {
  if (rate == null) return { text: '—', color: '#6B7280' };
  const pct = Math.round(rate * 100);
  let color = '#EF4444';
  if (pct >= 75) color = '#10B981';
  else if (pct >= 50) color = '#F59E0B';
  else if (pct >= 25) color = '#FF6B35';
  return { text: `${pct}%`, color };
}

const PAGE_SIZE = 10;

const COLUMNS = [
  { key: 'rank',                  label: '#',          numeric: false, sortKey: null },
  { key: 'THUMBNAIL_URL',         label: 'Thumb',      numeric: false, sortKey: null },
  { key: 'USERNAME',              label: 'Account',    numeric: false, sortKey: 'USERNAME' },
  { key: 'CREATE_DATE',           label: 'Date',       numeric: false, sortKey: 'CREATE_DATE' },
  { key: 'CAPTION',               label: 'Caption',    numeric: false, sortKey: null },
  { key: 'VIDEO_VIEWS',           label: 'Views',      numeric: true,  sortKey: 'VIDEO_VIEWS' },
  { key: 'LIKES',                 label: 'Likes',      numeric: true,  sortKey: 'LIKES' },
  { key: 'COMMENTS',              label: 'Comments',   numeric: true,  sortKey: 'COMMENTS' },
  { key: 'SHARES',                label: 'Shares',     numeric: true,  sortKey: 'SHARES' },
  { key: 'REACH',                 label: 'Reach',      numeric: true,  sortKey: 'REACH' },
  { key: 'VIDEO_COMPLETION_RATE', label: 'Completion', numeric: true,  sortKey: 'VIDEO_COMPLETION_RATE' },
  { key: 'TOTAL_TIME_WATCHED_MIN',label: 'Watch (min)',numeric: true,  sortKey: 'TOTAL_TIME_WATCHED_MIN' },
  { key: 'SHARE_URL',             label: 'Link',       numeric: false, sortKey: null },
];

function SortIcon({ col, sortKey, sortDir }) {
  if (!col.sortKey) return null;
  if (sortKey !== col.sortKey) return <ChevronsUpDown size={10} style={{ opacity: 0.3, marginLeft: 3 }} />;
  return sortDir === 'desc'
    ? <ChevronDown size={10} style={{ color: '#FF0050', marginLeft: 3 }} />
    : <ChevronUp size={10} style={{ color: '#FF0050', marginLeft: 3 }} />;
}

export function TK_TopVideos({ videos }) {
  const [sortKey, setSortKey]   = useState('VIDEO_VIEWS');
  const [sortDir, setSortDir]   = useState('desc');
  const [page, setPage]         = useState(1);

  const handleSort = (col) => {
    if (!col.sortKey) return;
    if (sortKey === col.sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(col.sortKey);
      setSortDir('desc');
    }
    setPage(1);
  };

  const sorted = useMemo(() => {
    if (!videos) return [];
    return [...videos].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'CREATE_DATE') {
        av = av?.value || av || '';
        bv = bv?.value || bv || '';
        return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      if (sortKey === 'USERNAME') {
        av = av || ''; bv = bv || '';
        return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      av = Number(av) || 0; bv = Number(bv) || 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [videos, sortKey, sortDir]);

  if (!sorted.length) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
        No video data available.
      </div>
    );
  }

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const globalOffset = (page - 1) * PAGE_SIZE;

  const TH = ({ col }) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        textAlign: col.numeric ? 'right' : 'left',
        padding: '8px 10px',
        color: sortKey === col.sortKey ? '#FF0050' : 'var(--text-tertiary)',
        fontWeight: 700, fontSize: '0.65rem',
        textTransform: 'uppercase', letterSpacing: '0.07em',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        whiteSpace: 'nowrap',
        cursor: col.sortKey ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {col.label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', margin: 0 }}>
          Top Videos by Views
        </p>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
          {sorted.length} videos · sorted by {COLUMNS.find(c => c.sortKey === sortKey)?.label}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              {COLUMNS.map(col => <TH key={col.key} col={col} />)}
            </tr>
          </thead>
          <tbody>
            {pageData.map((v, idx) => {
              const globalRank = globalOffset + idx + 1;
              const dateStr = v.CREATE_DATE?.value
                ? new Date(v.CREATE_DATE.value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
                : v.CREATE_DATE
                  ? new Date(v.CREATE_DATE).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
                  : '—';
              const caption = v.CAPTION || '';
              const { text: compText, color: compColor } = completionBadge(v.VIDEO_COMPLETION_RATE);

              return (
                <tr
                  key={v.VIDEO_ID}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,80,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '8px 10px', color: '#FF0050', fontWeight: 800, fontSize: '0.7rem' }}>
                    {globalRank <= 3
                      ? ['🥇','🥈','🥉'][globalRank - 1]
                      : globalRank}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {v.THUMBNAIL_URL ? (
                      <a href={v.SHARE_URL || '#'} target="_blank" rel="noopener noreferrer">
                        <img
                          src={v.THUMBNAIL_URL}
                          alt=""
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          style={{ width: '28px', height: '50px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      </a>
                    ) : (
                      <div style={{ width: '28px', height: '50px', borderRadius: '4px', background: 'rgba(255,0,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.55rem', color: '#FF0050' }}>▶</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#FF0050', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    @{v.USERNAME}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {dateStr}
                  </td>
                  <td style={{ padding: '8px 10px', color: 'var(--text-tertiary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {caption || <span style={{ opacity: 0.4, fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#FF5252' }}>{fmtNum(v.VIDEO_VIEWS)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#EC4899' }}>{fmtNum(v.LIKES)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F59E0B' }}>{fmtNum(v.COMMENTS)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981' }}>{fmtNum(v.SHARES)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtNum(v.REACH)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: compColor }}>{compText}</span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {v.TOTAL_TIME_WATCHED_MIN != null ? Number(v.TOTAL_TIME_WATCHED_MIN).toFixed(1) : '—'}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    {v.SHARE_URL
                      ? <a href={v.SHARE_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ExternalLink size={12} /></a>
                      : <span style={{ color: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
            Showing {globalOffset + 1}–{Math.min(globalOffset + PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
            <button
              onClick={() => setPage(1)} disabled={page === 1}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)', fontSize: '0.65rem', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >«</button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === 1 ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)', fontSize: '0.65rem', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) <= 2)
              .map(p => (
                <button
                  key={p} onClick={() => setPage(p)}
                  style={{
                    padding: '4px 9px', borderRadius: '6px',
                    border: '1px solid',
                    borderColor: p === page ? '#FF0050' : 'rgba(255,255,255,0.1)',
                    background: p === page ? 'rgba(255,0,80,0.15)' : 'transparent',
                    color: p === page ? '#FF0050' : 'var(--text-secondary)',
                    fontSize: '0.65rem', fontWeight: p === page ? 700 : 400,
                    cursor: 'pointer',
                  }}
                >{p}</button>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)', fontSize: '0.65rem', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >›</button>
            <button
              onClick={() => setPage(totalPages)} disabled={page === totalPages}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)', fontSize: '0.65rem', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
}
