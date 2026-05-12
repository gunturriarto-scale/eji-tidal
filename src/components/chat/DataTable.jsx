import { useState } from 'react';

const formatNumber = (num) => {
  if (num === null || num === undefined || num === '') return '—';
  const n = Number(num);
  if (isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
};

const formatPercent = (num) => {
  if (num === null || num === undefined || num === '') return '—';
  const n = Number(num);
  if (isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
};

const TrendArrow = ({ value }) => {
  if (value === null || value === undefined || value === '' || value === 0) return <span className="text-gray-400">—</span>;
  if (value > 0) return <span className="text-green-500">↑ {formatPercent(Math.abs(value))}</span>;
  if (value < 0) return <span className="text-red-500">↓ {formatPercent(Math.abs(value))}</span>;
  return <span className="text-gray-400">—</span>;
};

function exportToCSV(columns, data, title) {
  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key] ?? '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      })
      .join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'data').replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataTable({ columns, data, title, highlightTop = true, overspendingField = 'pacing' }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Tidak ada data untuk ditampilkan.
      </div>
    );
  }

  const sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a, b) => {
      const av = Number(a[sortKey]) || 0;
      const bv = Number(b[sortKey]) || 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="w-full">
      {/* Header row with title + export button */}
      <div className="flex items-center justify-between mb-2 px-1">
        {title && <div className="text-sm font-semibold text-gray-700">{title}</div>}
        <button
          onClick={() => exportToCSV(columns, sortedData, title)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#10B981',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '6px',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          ⬇ Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
                    col.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortKey === col.key && (
                      <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => {
              const isTop = highlightTop && idx === 0;
              const isOverspend = Number(row[overspendingField]) > 100;
              return (
                <tr
                  key={row._id || idx}
                  className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                    isOverspend
                      ? 'bg-red-50/60'
                      : isTop
                      ? 'bg-amber-50/60'
                      : idx % 2 === 0
                      ? 'bg-white'
                      : 'bg-gray-50/30'
                  }`}
                >
                  {columns.map((col) => {
                    let cellValue = row[col.key];
                    if (col.format === 'number') cellValue = formatNumber(cellValue);
                    else if (col.format === 'percent') cellValue = formatPercent(cellValue);
                    else if (col.format === 'trend') cellValue = <TrendArrow value={cellValue} />;
                    else if (col.format === 'currency') cellValue = `Rp ${formatNumber(cellValue)}`;

                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2.5 whitespace-nowrap ${
                          col.align === 'right' ? 'text-right' : 'text-left'
                        } ${isTop && col.highlightOnTop ? 'font-bold text-gray-900' : 'text-gray-700'} ${
                          isOverspend && col.align === 'right' ? 'text-red-600 font-medium' : ''
                        }`}
                      >
                        {cellValue ?? <span className="text-gray-400">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="text-xs text-gray-400 mt-1.5 px-1">
          {data.length} rows · Klik header untuk sort · <span className="text-red-500">●</span> Overspending · <span className="text-amber-500">●</span> Top performer
        </div>
      )}
    </div>
  );
}

// Helper to convert raw API data to table columns automatically
export function autoDetectColumns(data) {
  if (!data || data.length === 0) return [];
  const keys = Object.keys(data[0]).filter((k) => !k.startsWith('_'));
  return keys.map((key) => ({
    key,
    label: key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    sortable: true,
    format: 'auto',
  }));
}
