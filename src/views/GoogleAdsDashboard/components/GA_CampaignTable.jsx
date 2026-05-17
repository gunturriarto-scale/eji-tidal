import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const ACCENT = '#4285F4';

const CHANNEL_COLORS = {
  PERFORMANCE_MAX: '#4285F4',
  DISPLAY:         '#FBBC04',
  VIDEO:           '#EA4335',
  DEMAND_GEN:      '#34A853',
};

const CHANNEL_LABELS = {
  PERFORMANCE_MAX: 'PMax',
  DISPLAY:         'Display',
  VIDEO:           'Video',
  DEMAND_GEN:      'DemGen',
};

const STATUS_COLORS = { ENABLED: '#34A853', PAUSED: '#F59E0B', REMOVED: '#EF4444' };

function fmtIDR(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function fmtNum(n, d = 0) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return d > 0 ? v.toFixed(d) : v.toLocaleString();
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown size={11} style={{ opacity: 0.3 }} />;
  return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
}

const COLUMNS = [
  { key: 'CAMPAIGN_NAME', label: 'Campaign',          w: '220px', align: 'left' },
  { key: 'channel_type',  label: 'Channel',           w: '80px',  align: 'center' },
  { key: 'STATUS',        label: 'Status',            w: '70px',  align: 'center' },
  { key: 'cost',          label: 'Spend',             w: '90px',  align: 'right' },
  { key: 'impressions',   label: 'Impr.',             w: '80px',  align: 'right' },
  { key: 'clicks',        label: 'Clicks',            w: '70px',  align: 'right' },
  { key: 'ctr',           label: 'CTR',               w: '65px',  align: 'right' },
  { key: 'cpc',           label: 'CPC',               w: '80px',  align: 'right' },
  { key: 'conversions',   label: 'Conv.',             w: '65px',  align: 'right' },
  { key: 'conv_rate',     label: 'CVR',               w: '65px',  align: 'right' },
  { key: 'roas',          label: 'ROAS',              w: '65px',  align: 'right' },
  { key: 'impression_share', label: 'IS%',            w: '60px',  align: 'right' },
];

const PAGE_SIZE = 10;

export function GA_CampaignTable({ campaigns, channelFilter, onChannelFilterChange }) {
  const [sortCol, setSortCol] = useState('cost');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return (campaigns || []).filter(row => {
      if (channelFilter && channelFilter !== 'all') {
        return (row.channel_type || row.ADVERTISING_CHANNEL_TYPE) === channelFilter;
      }
      return true;
    });
  }, [campaigns, channelFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? -Infinity;
      const bv = b[sortCol] ?? -Infinity;
      const aNum = Number(av);
      const bNum = Number(bv);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(0);
  }

  function renderCell(row, col) {
    const v = row[col.key];
    switch (col.key) {
      case 'CAMPAIGN_NAME':
        return (
          <div style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontSize: '0.72rem' }}>
            {v || '—'}
          </div>
        );
      case 'channel_type': {
        const ch = v || row.ADVERTISING_CHANNEL_TYPE || '';
        const color = CHANNEL_COLORS[ch] || '#6B7280';
        return (
          <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: `${color}18`, color, borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {CHANNEL_LABELS[ch] || ch}
          </span>
        );
      }
      case 'STATUS': {
        const color = STATUS_COLORS[v] || '#6B7280';
        return <span style={{ fontSize: '0.6rem', color, fontWeight: 700 }}>{v || '—'}</span>;
      }
      case 'cost':         return <span style={{ color: ACCENT, fontWeight: 600 }}>{v != null ? `IDR ${fmtIDR(v)}` : '—'}</span>;
      case 'cpc':          return v != null ? `IDR ${fmtIDR(v)}` : '—';
      case 'impressions':  return fmtNum(v);
      case 'clicks':       return fmtNum(v);
      case 'ctr':          return v != null ? `${Number(v).toFixed(2)}%` : '—';
      case 'conversions':  return v != null ? Number(v).toFixed(1) : '—';
      case 'conv_rate':    return v != null ? `${Number(v).toFixed(2)}%` : '—';
      case 'roas':         return v != null ? <span style={{ color: '#34A853', fontWeight: 600 }}>{Number(v).toFixed(2)}x</span> : '—';
      case 'impression_share': return v != null ? `${Number(v).toFixed(1)}%` : '—';
      default: return v ?? '—';
    }
  }

  const CHANNELS = ['all', 'PERFORMANCE_MAX', 'DISPLAY', 'VIDEO', 'DEMAND_GEN'];

  return (
    <div>
      {/* Channel filter pills */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {CHANNELS.map(ch => {
          const isActive = (channelFilter || 'all') === ch;
          const color = CHANNEL_COLORS[ch] || ACCENT;
          const label = ch === 'all' ? 'All Channels' : (CHANNEL_LABELS[ch] || ch);
          return (
            <button
              key={ch}
              onClick={() => { onChannelFilterChange(ch); setPage(0); }}
              style={{
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.65rem', cursor: 'pointer',
                fontWeight: isActive ? 700 : 400,
                background: isActive ? `${color}18` : 'transparent',
                border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`,
                color: isActive ? color : 'var(--text-tertiary)',
              }}
            >
              {label}
            </button>
          );
        })}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: 'auto', alignSelf: 'center' }}>
          {filtered.length} campaigns
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    padding: '0.5rem 0.6rem', textAlign: col.align,
                    color: sortCol === col.key ? ACCENT : 'var(--text-tertiary)',
                    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: 'pointer', whiteSpace: 'nowrap', minWidth: col.w,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    {col.label}
                    <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No data</td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {COLUMNS.map(col => (
                    <td key={col.key} style={{ padding: '0.55rem 0.6rem', textAlign: col.align, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {renderCell(row, col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '1rem', alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontSize: '0.7rem' }}>
            ←
          </button>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-secondary)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1, fontSize: '0.7rem' }}>
            →
          </button>
        </div>
      )}
    </div>
  );
}
