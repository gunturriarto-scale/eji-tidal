import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const ACCENT = '#4285F4';

// BigQuery stores device values as lowercase strings
const DEVICE_COLORS  = {
  MOBILE: '#4285F4', mobile: '#4285F4',
  DESKTOP: '#34A853', desktop: '#34A853',
  TABLET: '#FBBC04', tablet: '#FBBC04',
  OTHER: '#6B7280', other: '#6B7280',
  CONNECTED_TV: '#EA4335', connected_tv: '#EA4335',
  'Devices streaming video content to TV screens': '#EA4335',
};
const DEVICE_LABELS = {
  mobile: 'Mobile', MOBILE: 'Mobile',
  desktop: 'Desktop', DESKTOP: 'Desktop',
  tablet: 'Tablet', TABLET: 'Tablet',
  connected_tv: 'CTV', CONNECTED_TV: 'CTV',
  'Devices streaming video content to TV screens': 'CTV',
  other: 'Other', OTHER: 'Other',
};
const NETWORK_COLORS = { CONTENT: '#4285F4', content: '#4285F4', SEARCH: '#34A853', search: '#34A853', YOUTUBE_WATCH: '#EA4335', youtube_watch: '#EA4335', YOUTUBE_SEARCH: '#FBBC04', youtube_search: '#FBBC04', UNKNOWN: '#6B7280', unknown: '#6B7280' };
const NETWORK_LABELS = { CONTENT: 'Display', content: 'Display', SEARCH: 'Search', search: 'Search', YOUTUBE_WATCH: 'YT Watch', youtube_watch: 'YT Watch', YOUTUBE_SEARCH: 'YT Search', youtube_search: 'YT Search', UNKNOWN: 'Unknown', unknown: 'Unknown' };
const AD_TYPE_COLORS = { RESPONSIVE_DISPLAY_AD: '#FBBC04', VIDEO_AD: '#EA4335', DEMAND_GEN_VIDEO_RESPONSIVE_AD: '#34A853', DEMAND_GEN_PRODUCT_AD: '#8B5CF6' };
const AD_TYPE_LABELS = {
  RESPONSIVE_DISPLAY_AD: 'Display',
  VIDEO_AD: 'Video',
  DEMAND_GEN_VIDEO_RESPONSIVE_AD: 'DemGen Video',
  DEMAND_GEN_PRODUCT_AD: 'DemGen Product',
};

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

function DonutChart({ data, colorMap, labelMap = {}, title }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  return (
    <div className="glass-panel" style={{ padding: '1rem' }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>{title}</p>
      <ResponsiveContainer width="100%" height={130}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
            {data.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || '#6B7280'} />)}
          </Pie>
          <Tooltip formatter={(v) => [fmtNum(v) + ' clicks', '']} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '0.5rem' }}>
        {data.slice(0, 5).map(entry => {
          const color = colorMap[entry.name] || '#6B7280';
          const pct = total > 0 ? Math.round(entry.value / total * 100) : 0;
          return (
            <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.62rem' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{labelMap[entry.name] || DEVICE_LABELS[entry.name] || NETWORK_LABELS[entry.name] || entry.name}</span>
              <span style={{ color, fontWeight: 700 }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: 'CAMPAIGN_NAME', label: 'Campaign',   w: '160px', align: 'left' },
  { key: 'AD_GROUP_NAME', label: 'Ad Group',   w: '120px', align: 'left' },
  { key: 'AD_TYPE',       label: 'Type',       w: '90px',  align: 'center' },
  { key: 'DEVICE',        label: 'Device',     w: '70px',  align: 'center' },
  { key: 'NETWORK',       label: 'Network',    w: '80px',  align: 'center' },
  { key: 'impressions',   label: 'Impr.',      w: '70px',  align: 'right' },
  { key: 'clicks',        label: 'Clicks',     w: '60px',  align: 'right' },
  { key: 'ctr',           label: 'CTR',        w: '60px',  align: 'right' },
  { key: 'cost',          label: 'Spend',      w: '80px',  align: 'right' },
  { key: 'conversions',   label: 'Conv.',      w: '60px',  align: 'right' },
  { key: 'video_views',   label: 'Video Views', w: '80px', align: 'right' },
];

const PAGE_SIZE = 10;

export function GA_AdTable({ adsData, deviceBreakdown }) {
  const [sortCol, setSortCol]     = useState('cost');
  const [sortDir, setSortDir]     = useState('desc');
  const [page, setPage]           = useState(0);

  const sorted = useMemo(() => {
    return [...(adsData || [])].sort((a, b) => {
      const av = Number(a[sortCol] ?? -Infinity);
      const bv = Number(b[sortCol] ?? -Infinity);
      if (!isNaN(av) && !isNaN(bv)) return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(a[sortCol]).localeCompare(String(b[sortCol]))
        : String(b[sortCol]).localeCompare(String(a[sortCol]));
    });
  }, [adsData, sortCol, sortDir]);

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
      case 'AD_GROUP_NAME':
        return <span style={{ display: 'block', maxWidth: col.w, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</span>;
      case 'AD_TYPE': {
        const color = AD_TYPE_COLORS[v] || '#6B7280';
        return <span style={{ fontSize: '0.58rem', padding: '2px 5px', background: `${color}18`, color, borderRadius: '3px', fontWeight: 700, whiteSpace: 'nowrap' }}>{AD_TYPE_LABELS[v] || (v || '—')}</span>;
      }
      case 'DEVICE': {
        const color = DEVICE_COLORS[v] || '#6B7280';
        return <span style={{ fontSize: '0.62rem', color, fontWeight: 600 }}>{DEVICE_LABELS[v] || v || '—'}</span>;
      }
      case 'NETWORK': {
        const color = NETWORK_COLORS[v] || '#6B7280';
        return <span style={{ fontSize: '0.6rem', color, fontWeight: 600 }}>{NETWORK_LABELS[v] || v || '—'}</span>;
      }
      case 'cost':        return <span style={{ color: ACCENT, fontWeight: 600 }}>{v != null ? `IDR ${fmtIDR(v)}` : '—'}</span>;
      case 'impressions': return fmtNum(v);
      case 'clicks':      return fmtNum(v);
      case 'ctr':         return v != null ? `${Number(v).toFixed(2)}%` : '—';
      case 'conversions': return v != null ? Number(v).toFixed(1) : '—';
      case 'video_views': return v ? fmtNum(v) : '—';
      default: return v ?? '—';
    }
  }

  // Build device + network donuts from deviceBreakdown
  const deviceData = (deviceBreakdown || []).map(r => ({ name: r.DEVICE || '', value: Number(r.clicks || 0) })).filter(r => r.value > 0);
  const networkMap = {};
  (adsData || []).forEach(r => {
    const net = r.NETWORK || 'UNKNOWN';
    networkMap[net] = (networkMap[net] || 0) + Number(r.clicks || 0);
  });
  const networkData = Object.entries(networkMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Donuts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <DonutChart data={deviceData} colorMap={DEVICE_COLORS} labelMap={DEVICE_LABELS} title="Device Breakdown" />
        <DonutChart data={networkData} colorMap={NETWORK_COLORS} labelMap={NETWORK_LABELS} title="Network Breakdown" />
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
          Ad Performance — {sorted.length} rows
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)}
                    style={{ padding: '0.5rem 0.5rem', textAlign: col.align, color: sortCol === col.key ? ACCENT : 'var(--text-tertiary)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', minWidth: col.w, borderBottom: '1px solid rgba(255,255,255,0.06)', userSelect: 'none' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {col.label}<SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No data</td></tr>
              ) : (
                pageRows.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {COLUMNS.map(col => (
                      <td key={col.key} style={{ padding: '0.5rem 0.5rem', textAlign: col.align, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
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
