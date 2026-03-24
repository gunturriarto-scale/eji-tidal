import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';
import { ShoppingBag, TrendingUp, Users, BarChart3, Target, Percent } from 'lucide-react';

const PLATFORM_CONFIG = {
  shopee:     { label: 'Shopee',      color: '#EE4D2D', accentColor: '#FB923C', key: 'shopee',     emoji: '🛒' },
  tiktokShop: { label: 'TikTok Shop', color: '#4F46E5', accentColor: '#818CF8', key: 'tiktokShop', emoji: '🎵' },
  lazada:     { label: 'Lazada',      color: '#1E40AF', accentColor: '#60A5FA', key: 'lazada',     emoji: '🛍️' },
  tokopedia:  { label: 'Tokopedia',   color: '#059669', accentColor: '#34D399', key: 'tokopedia',  emoji: '🟢' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', minWidth: '180px' }}>
        <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</p>
        {payload.map((entry, i) => (
          <div key={i} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 600 }}>
              {entry.name.toLowerCase().includes('gmv') || entry.name.toLowerCase().includes('target') || entry.name.toLowerCase().includes('asp')
                ? formatCurrency(entry.value)
                : entry.name.toLowerCase().includes('cr') || entry.name.toLowerCase().includes('rate')
                ? `${Number(entry.value).toFixed(2)}%`
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const EcommerceView = ({ ordersData = [], platform, dateRange }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;
  const config = PLATFORM_CONFIG[platform];

  const filteredData = useMemo(() => {
    if (!ordersData.length) return [];
    if (!dateRange) return ordersData;
    return ordersData.filter(row => row.normDate >= dateRange.start && row.normDate <= dateRange.end);
  }, [ordersData, dateRange]);

  const kpis = useMemo(() => {
    if (!filteredData.length) return null;
    const p = config.key;
    const totalGMV     = filteredData.reduce((s, r) => s + (r[p]?.gmv || 0), 0);
    const totalOrders  = filteredData.reduce((s, r) => s + (r[p]?.orders || 0), 0);
    const totalUnits   = filteredData.reduce((s, r) => s + (r[p]?.units || 0), 0);
    const totalViews   = filteredData.reduce((s, r) => s + (r[p]?.pageViews || 0), 0);
    const totalVisitors= filteredData.reduce((s, r) => s + (r[p]?.visitors || 0), 0);
    const avgASP       = totalOrders > 0 ? totalGMV / totalOrders : 0;
    const avgCR        = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;
    const totalTarget  = filteredData.reduce((s, r) => s + (r[p]?.target || 0), 0);
    const runRatePct   = totalTarget > 0 ? (totalGMV / totalTarget) * 100 : 0;
    return { totalGMV, totalOrders, totalUnits, totalViews, totalVisitors, avgASP, avgCR, totalTarget, runRatePct };
  }, [filteredData, config.key]);

  const dailyData = useMemo(() =>
    filteredData.map(row => ({
      date: row.date,
      normDate: row.normDate,
      gmv: row[config.key]?.gmv || 0,
      target: row[config.key]?.target || 0,
      orders: row[config.key]?.orders || 0,
      units: row[config.key]?.units || 0,
      pageViews: row[config.key]?.pageViews || 0,
      visitors: row[config.key]?.visitors || 0,
      cr: row[config.key]?.cr || 0,
      asp: row[config.key]?.asp || 0,
      runRate: row[config.key]?.runRate || 0,
    })).sort((a, b) => new Date(a.normDate) - new Date(b.normDate)),
  [filteredData, config.key]);

  const paginatedRows = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const mainColor = config.color;
  const accentColor = config.accentColor;

  if (!filteredData.length) {
    return (
      <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>{config.emoji}</div>
        <p style={{ color: 'var(--text-tertiary)' }}>No data available for {config.label} in this date range.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards */}
      <div className="kpi-grid">
        {[
          { label: 'Total GMV', value: formatCurrency(kpis?.totalGMV || 0), icon: <TrendingUp size={18} />, sub: `Target: ${formatCurrency(kpis?.totalTarget || 0)}` },
          { label: 'Run Rate', value: `${(kpis?.runRatePct || 0).toFixed(1)}%`, icon: <Target size={18} />, sub: kpis?.runRatePct >= 100 ? '✅ Hit Target' : '⚠️ Below Target', positive: kpis?.runRatePct >= 100 },
          { label: 'Total Orders', value: formatNumber(kpis?.totalOrders || 0), icon: <ShoppingBag size={18} />, sub: `${formatNumber(kpis?.totalUnits || 0)} units sold` },
          { label: 'Avg. ASP', value: formatCurrency(kpis?.avgASP || 0), icon: <BarChart3 size={18} />, sub: 'Avg Selling Price per Order' },
          { label: 'Page Views', value: formatNumber(kpis?.totalViews || 0), icon: <Users size={18} />, sub: `${formatNumber(kpis?.totalVisitors || 0)} visitors` },
          { label: 'Conv. Rate (CR)', value: `${(kpis?.avgCR || 0).toFixed(2)}%`, icon: <Percent size={18} />, sub: 'Orders / Page Views' },
        ].map((kpi, i) => (
          <div key={i} className="glass-panel kpi-card">
            <div className="kpi-header">
              <span>{kpi.label}</span>
              <div className="kpi-icon" style={{ color: mainColor }}>{kpi.icon}</div>
            </div>
            <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: kpi.positive === true ? '#10b981' : kpi.positive === false ? '#f43f5e' : 'var(--text-tertiary)', marginTop: '0.25rem' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* GMV vs Target + Run Rate */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><TrendingUp size={16} /> Daily GMV vs Target</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={v => `Rp${(v/1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="target" name="Target" fill="rgba(255,255,255,0.08)" radius={[4,4,0,0]} />
                <Bar yAxisId="left" dataKey="gmv" name="GMV" fill={mainColor} opacity={0.85} radius={[4,4,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><Percent size={16} /> Run Rate vs CR Trend</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} unit="%" />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={10} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="runRate" name="Run Rate %" fill={accentColor} opacity={0.4} radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="cr" name="CR %" stroke={mainColor} strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Orders + Visitors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><ShoppingBag size={16} /> Orders & Units Sold</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" name="Orders" fill={mainColor} opacity={0.7} radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="units" name="Units" stroke={accentColor} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><Users size={16} /> Page Views & Visitors</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id={`grad-pv-${platform}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={mainColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`grad-vis-${platform}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="pageViews" name="Page Views" stroke={mainColor} fill={`url(#grad-pv-${platform})`} strokeWidth={2} />
                <Area type="monotone" dataKey="visitors" name="Visitors" stroke={accentColor} fill={`url(#grad-vis-${platform})`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Performance Table */}
      <div className="glass-panel">
        <div className="table-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{config.emoji}</span> {config.label} Daily Performance
          </h3>
          <div className="badge">{filteredData.length} Days</div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>GMV</th>
                <th>Target</th>
                <th>Run Rate</th>
                <th>Orders</th>
                <th>Units</th>
                <th>ASP</th>
                <th>Page Views</th>
                <th>Visitors</th>
                <th>CR</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, i) => {
                const p = config.key;
                const rr = row[p]?.runRate || 0;
                return (
                  <tr key={i} className="hover-row">
                    <td style={{ fontWeight: 600 }}>{row.date}</td>
                    <td>{formatCurrency(row[p]?.gmv || 0)}</td>
                    <td style={{ color: 'var(--text-tertiary)' }}>{formatCurrency(row[p]?.target || 0)}</td>
                    <td>
                      <span style={{ color: rr >= 100 ? '#10b981' : rr >= 80 ? '#f59e0b' : '#f43f5e', fontWeight: 600 }}>
                        {rr.toFixed(1)}%
                      </span>
                    </td>
                    <td>{formatNumber(row[p]?.orders || 0)}</td>
                    <td>{formatNumber(row[p]?.units || 0)}</td>
                    <td>{formatCurrency(row[p]?.asp || 0)}</td>
                    <td>{formatNumber(row[p]?.pageViews || 0)}</td>
                    <td>{formatNumber(row[p]?.visitors || 0)}</td>
                    <td>{(row[p]?.cr || 0).toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <div className="pagination-info">
            Showing {((page-1)*rowsPerPage)+1} to {Math.min(page*rowsPerPage, filteredData.length)} of {filteredData.length}
          </div>
          <div className="pagination-btns">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="glass-panel">Prev</button>
            <div className="page-indicator">{page} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="glass-panel">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
