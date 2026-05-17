import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ACCENT = '#4285F4';
const BRAND_COLORS = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#8B5CF6'];

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

function BrandBreakdown({ brandData }) {
  if (!brandData?.length) return null;
  const maxClicks = Math.max(...brandData.map(r => Number(r.clicks || 0)), 1);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        Brand Breakdown
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {brandData.map((row, idx) => {
          const brand = row.BRAND || row.brand || '—';
          const clicks = Number(row.clicks || 0);
          const impressions = Number(row.impressions || 0);
          const cost = Number(row.cost || 0);
          const ctr = Number(row.ctr || 0);
          const barW = `${(clicks / maxClicks) * 100}%`;
          const color = BRAND_COLORS[idx % BRAND_COLORS.length];
          return (
            <div key={brand}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{brand}</span>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  <span><strong style={{ color }}>{fmtNum(clicks)}</strong> clicks</span>
                  <span><strong style={{ color: '#FBBC04' }}>{fmtNum(impressions)}</strong> impr.</span>
                  <span><strong style={{ color: '#34A853' }}>IDR {fmtIDR(cost)}</strong></span>
                  <span style={{ color: '#06B6D4' }}>{ctr.toFixed(2)}% CTR</span>
                </div>
              </div>
              <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: barW, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryChart({ shoppingData }) {
  const catMap = {};
  (shoppingData || []).forEach(row => {
    const cat = row.CATEGORY_LEVEL_1 || row.category_level_1 || 'Other';
    catMap[cat] = (catMap[cat] || 0) + Number(row.clicks || 0);
  });
  const data = Object.entries(catMap)
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);

  if (!data.length) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
        Top Categories by Clicks
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 30 }}>
          <XAxis type="number" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={100} />
          <Tooltip formatter={(v) => [fmtNum(v) + ' clicks', '']} />
          <Bar dataKey="clicks" name="Clicks" radius={[0, 3, 3, 0]} barSize={14}>
            {data.map((_, idx) => <Cell key={idx} fill={BRAND_COLORS[idx % BRAND_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const COLUMNS = [
  { key: 'BRAND',            label: 'Brand',       w: '80px',  align: 'left' },
  { key: 'PRODUCT_TITLE',    label: 'Product',     w: '200px', align: 'left' },
  { key: 'CATEGORY_LEVEL_1', label: 'Category L1', w: '120px', align: 'left' },
  { key: 'CATEGORY_LEVEL_2', label: 'Category L2', w: '120px', align: 'left' },
  { key: 'clicks',           label: 'Clicks',      w: '65px',  align: 'right' },
  { key: 'impressions',      label: 'Impr.',       w: '70px',  align: 'right' },
  { key: 'ctr',              label: 'CTR',         w: '60px',  align: 'right' },
  { key: 'cost',             label: 'Spend',       w: '80px',  align: 'right' },
  { key: 'cpc',              label: 'CPC',         w: '75px',  align: 'right' },
];

const PAGE_SIZE = 15;

export function GA_ShoppingTable({ shoppingData, brandData }) {
  const [sortCol, setSortCol] = useState('clicks');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage]       = useState(0);
  const [search, setSearch]   = useState('');

  const filtered = useMemo(() => {
    if (!search) return shoppingData || [];
    const q = search.toLowerCase();
    return (shoppingData || []).filter(r =>
      (r.PRODUCT_TITLE || '').toLowerCase().includes(q) ||
      (r.BRAND || '').toLowerCase().includes(q) ||
      (r.CATEGORY_LEVEL_1 || '').toLowerCase().includes(q)
    );
  }, [shoppingData, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = Number(a[sortCol] ?? -Infinity);
      const bv = Number(b[sortCol] ?? -Infinity);
      if (!isNaN(av) && !isNaN(bv)) return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(a[sortCol]).localeCompare(String(b[sortCol])) : String(b[sortCol]).localeCompare(String(a[sortCol]));
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
      case 'PRODUCT_TITLE':
        return <span style={{ display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</span>;
      case 'BRAND': {
        const idx = (brandData || []).findIndex(b => (b.BRAND || b.brand) === v);
        const color = BRAND_COLORS[idx >= 0 ? idx % BRAND_COLORS.length : 0];
        return <span style={{ color, fontWeight: 700, fontSize: '0.68rem' }}>{v || '—'}</span>;
      }
      case 'cost': return <span style={{ color: ACCENT, fontWeight: 600 }}>{v != null ? `IDR ${fmtIDR(v)}` : '—'}</span>;
      case 'cpc':  return v != null ? `IDR ${fmtIDR(v)}` : '—';
      case 'clicks': return fmtNum(v);
      case 'impressions': return fmtNum(v);
      case 'ctr': return v != null ? `${Number(v).toFixed(2)}%` : '—';
      default: return v || '—';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <BrandBreakdown brandData={brandData} />
        <CategoryChart shoppingData={shoppingData} />
      </div>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '1rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', margin: 0 }}>
            Products — {sorted.length} rows
          </p>
          <input
            type="text" placeholder="Search product, brand, category…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="glass-input"
            style={{ height: '32px', width: '220px', fontSize: '0.7rem' }}
          />
        </div>
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
