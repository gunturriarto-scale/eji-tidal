import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from 'lucide-react';

const ACCENT = '#4285F4';

function fmtIDR(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function fmtNum(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown size={11} style={{ opacity: 0.3 }} />;
  return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
}

const PLACEMENT_TYPE_COLORS = {
  CONTENT:        '#4285F4',
  YOUTUBE_WATCH:  '#EA4335',
  YOUTUBE_SEARCH: '#FF6B35',
  SEARCH:         '#34A853',
  UNKNOWN:        '#6B7280',
};

const PLACEMENT_TYPE_LABELS = {
  CONTENT:        'Display',
  YOUTUBE_WATCH:  'YT Watch',
  YOUTUBE_SEARCH: 'YT Search',
  SEARCH:         'Search',
  UNKNOWN:        'Unknown',
};

const COLUMNS = [
  { key: 'PLACEMENT',      label: 'Placement',     w: '240px', align: 'left' },
  { key: 'PLACEMENT_TYPE', label: 'Type',          w: '120px', align: 'center' },
  { key: 'CAMPAIGN_NAME',  label: 'Campaign',      w: '160px', align: 'left' },
  { key: 'impressions',    label: 'Impressions',   w: '90px',  align: 'right' },
  { key: 'clicks',         label: 'Clicks',        w: '70px',  align: 'right' },
  { key: 'ctr',            label: 'CTR',           w: '60px',  align: 'right' },
  { key: 'cost',           label: 'Spend',         w: '90px',  align: 'right' },
  { key: 'cpc',            label: 'CPC',           w: '80px',  align: 'right' },
];

const PAGE_SIZE = 20;

export function GA_PlacementTable({ placementData }) {
  const [sortCol, setSortCol] = useState('impressions');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage]       = useState(0);
  const [search, setSearch]   = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const types = useMemo(() => {
    const s = new Set((placementData || []).map(r => r.PLACEMENT_TYPE || '').filter(Boolean));
    return ['all', ...Array.from(s).sort()];
  }, [placementData]);

  const filtered = useMemo(() => {
    return (placementData || []).filter(r => {
      if (typeFilter !== 'all' && r.PLACEMENT_TYPE !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (r.PLACEMENT || '').toLowerCase().includes(q) ||
               (r.CAMPAIGN_NAME || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [placementData, typeFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = Number(a[sortCol] ?? -Infinity);
      const bv = Number(b[sortCol] ?? -Infinity);
      if (!isNaN(av) && !isNaN(bv)) return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(a[sortCol]).localeCompare(String(b[sortCol]))
        : String(b[sortCol]).localeCompare(String(a[sortCol]));
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Aggregated KPIs
  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => ({
      impressions: acc.impressions + Number(r.impressions || 0),
      clicks:      acc.clicks      + Number(r.clicks      || 0),
      cost:        acc.cost        + Number(r.cost        || 0),
    }), { impressions: 0, clicks: 0, cost: 0 });
  }, [filtered]);

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(0);
  }

  function isYouTubeChannelID(v) {
    return v && /^UC[A-Za-z0-9_-]{22}$/.test(v);
  }

  function buildHref(v) {
    if (!v) return null;
    if (isYouTubeChannelID(v)) return `https://www.youtube.com/channel/${v}`;
    if (v.startsWith('http')) return v;
    return `https://${v}`;
  }

  function renderCell(row, col) {
    const v = row[col.key];
    switch (col.key) {
      case 'PLACEMENT': {
        const isYT = isYouTubeChannelID(v) || (v && (v.includes('youtube.com') || v.includes('youtu.be')));
        const href = buildHref(v);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', maxWidth: '240px' }}>
            {isYT && <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'rgba(234,67,53,0.15)', color: '#EA4335', borderRadius: '3px', flexShrink: 0 }}>YT</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontSize: '0.7rem' }}>{v || '—'}</span>
            {href && (
              <a href={href} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        );
      }
      case 'PLACEMENT_TYPE': {
        const color = PLACEMENT_TYPE_COLORS[v] || '#6B7280';
        const label = PLACEMENT_TYPE_LABELS[v] || (v || '').replace(/_/g, ' ');
        return <span style={{ fontSize: '0.6rem', padding: '2px 5px', background: `${color}18`, color, borderRadius: '3px', fontWeight: 700, whiteSpace: 'nowrap' }}>{label || '—'}</span>;
      }
      case 'CAMPAIGN_NAME':
        return <span style={{ display: 'block', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{v || '—'}</span>;
      case 'impressions': return fmtNum(v);
      case 'clicks':      return fmtNum(v);
      case 'ctr':         return v != null ? `${Number(v).toFixed(2)}%` : '—';
      case 'cost':        return <span style={{ color: ACCENT, fontWeight: 600 }}>{v != null ? `IDR ${fmtIDR(v)}` : '—'}</span>;
      case 'cpc':         return v != null ? `IDR ${fmtIDR(v)}` : '—';
      default: return v ?? '—';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'Total Impressions', value: fmtNum(totals.impressions), color: '#FBBC04' },
          { label: 'Total Clicks',      value: fmtNum(totals.clicks),      color: '#EA4335' },
          { label: 'Total Spend',       value: `IDR ${fmtIDR(totals.cost)}`, color: ACCENT },
        ].map(kpi => (
          <div key={kpi.label} className="glass-panel" style={{ padding: '0.9rem 1rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{kpi.label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', margin: 0 }}>
            Placements — {filtered.length} rows
          </p>
          {/* Type filter pills */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {types.map(t => {
              const isActive = typeFilter === t;
              const color = PLACEMENT_TYPE_COLORS[t] || ACCENT;
              const label = t === 'all' ? 'All Types' : (PLACEMENT_TYPE_LABELS[t] || t.replace(/_/g, ' '));
              return (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(0); }}
                  style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.62rem', cursor: 'pointer', fontWeight: isActive ? 700 : 400, background: isActive ? `${color}18` : 'transparent', border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`, color: isActive ? color : 'var(--text-tertiary)' }}>
                  {label}
                </button>
              );
            })}
          </div>
          <input type="text" placeholder="Search placement or campaign…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="glass-input" style={{ height: '30px', width: '200px', fontSize: '0.7rem', marginLeft: 'auto' }} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    style={{ padding: '0.45rem 0.5rem', textAlign: col.align, color: sortCol === col.key ? ACCENT : 'var(--text-tertiary)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', minWidth: col.w, borderBottom: '1px solid rgba(255,255,255,0.06)', userSelect: 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {col.label}<SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>No placement data</td></tr>
              ) : (
                pageRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {COLUMNS.map(col => (
                      <td key={col.key} style={{ padding: '0.45rem 0.5rem', textAlign: col.align, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {renderCell(row, col)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontSize: '0.7rem' }}>←</button>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Page {page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, fontSize: '0.7rem' }}>→</button>
          </div>
        )}
      </div>
    </div>
  );
}
