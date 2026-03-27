import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';
import { ShoppingBag, TrendingUp, Users, BarChart3, Target, Percent, ShoppingCart } from 'lucide-react';

const formatCompactCurrency = (val) => {
  if (val >= 1e9)  return `Rp ${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6)  return `Rp ${(val / 1e6).toFixed(2)}M`;
  return formatCurrency(val);
};

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
    const avgASP       = totalUnits > 0 ? totalGMV / totalUnits : 0;
    const avgABS       = totalOrders > 0 ? totalGMV / totalOrders : 0;
    const avgCR        = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;
    const totalTarget  = filteredData.reduce((s, r) => s + (r[p]?.target || 0), 0);
    const runRatePct   = totalTarget > 0 ? (totalGMV / totalTarget) * 100 : 0;
    return { totalGMV, totalOrders, totalUnits, totalViews, totalVisitors, avgASP, avgABS, avgCR, totalTarget, runRatePct };
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
      abs: row[config.key]?.abs || 0,
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
          { label: 'TOTAL GMV', value: formatCompactCurrency(kpis?.totalGMV || 0), color: '#3B82F6', dataKey: 'gmv', badge: kpis?.runRatePct >= 100 ? '+0%' : `${(kpis?.runRatePct - 100).toFixed(0)}%`, good: kpis?.runRatePct >= 100 },
          { label: 'RUN RATE', value: `${(kpis?.runRatePct || 0).toFixed(1)}%`, color: '#F59E0B', dataKey: 'runRate', badge: kpis?.runRatePct >= 100 ? 'On Track' : 'Below', good: kpis?.runRatePct >= 100 },
          { label: 'TOTAL ORDERS', value: formatNumber(kpis?.totalOrders || 0), color: '#10B981', dataKey: 'orders' },
          { label: 'AVG. ASP', value: formatCurrency(kpis?.avgASP || 0), color: '#8B5CF6', dataKey: 'asp' },
          { label: 'AVG. ABS', value: formatCurrency(kpis?.avgABS || 0), color: '#EC4899', dataKey: 'abs' },
          { label: 'AVG. CR', value: `${(kpis?.avgCR || 0).toFixed(2)}%`, color: '#06B6D4', dataKey: 'cr' },
        ].map((kpi, i) => (
          <div key={i} className="glass-panel" style={{ 
            position: 'relative', 
            padding: '1.25rem',
            borderTop: `3px solid ${kpi.color}`,
            borderRadius: '12px',
            overflow: 'hidden',
            minHeight: '130px',
            background: 'var(--bg-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>{kpi.label}</span>
              {kpi.badge && (
                <span style={{ 
                  background: kpi.good ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', 
                  color: kpi.good ? '#10b981' : '#f43f5e', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.65rem', 
                  fontWeight: 600 
                }}>
                  {kpi.badge}
                </span>
              )}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, position: 'relative', zIndex: 2 }}>{kpi.value}</div>
            
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', zIndex: 1, opacity: 0.8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={kpi.color} stopOpacity={0.6}/>
                      <stop offset="100%" stopColor={kpi.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey={kpi.dataKey} stroke={kpi.color} fill={`url(#spark-${i})`} strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Overview Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><TrendingUp size={16} /> Daily GMV Target Tracker</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={v => `Rp ${(v/1e6).toFixed(0)}M`} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="gmv" name="GMV" fill={mainColor} opacity={0.9} radius={[4,4,0,0]} />
                <Line yAxisId="left" type="stepAfter" dataKey="target" name="Target Line" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><Target size={16} /> Run Rate Achievement</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} unit="%" domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="runRate" name="Run Rate %" fill={accentColor} opacity={0.8} radius={[4,4,0,0]} />
                <Line yAxisId="left" type="monotone" dataKey={() => 100} name="100% Target" stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><ShoppingBag size={16} /> Orders, Units & ASP Trend</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={v => `Rp ${(v/1e3).toFixed(0)}k`} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="orders" name="Orders" fill={mainColor} opacity={0.8} radius={[4,4,0,0]} />
                <Bar yAxisId="left" dataKey="units" name="Units" fill={accentColor} opacity={0.5} radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="asp" name="ASP" stroke="#EAB308" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><Users size={16} /> Traffic Metrics & CR</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={dailyData}>
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
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={50} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={10} unit="%" width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="pageViews" name={platform === 'shopee' || platform === 'tokopedia' ? 'Product Views' : 'Page Views'} stroke={mainColor} fill={`url(#grad-pv-${platform})`} strokeWidth={2} />
                <Area yAxisId="left" type="monotone" dataKey="visitors" name="Visitors" stroke={accentColor} fill={`url(#grad-vis-${platform})`} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="cr" name="CR %" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
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
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
              <tr>
                <th>Date</th>
                <th>GMV</th>
                <th>Run Rate</th>
                <th>Orders</th>
                <th>Units</th>
                <th>ASP</th>
                <th>ABS</th>
                <th>{platform === 'shopee' || platform === 'tokopedia' ? 'Prod. Views' : 'Page Views'}</th>
                <th>Visitors</th>
                <th>CR %</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, i) => {
                const p = config.key;
                const rData = row[p] || {};
                const rr = rData.runRate || 0;
                const gmv = rData.gmv || 0;
                const target = rData.target || 0;
                const rrColor = rr >= 100 ? 'rgba(16, 185, 129, 0.15)' : rr >= 80 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)';
                const rrText = rr >= 100 ? '#10b981' : rr >= 80 ? '#f59e0b' : '#f43f5e';
                const progressWidth = target > 0 ? Math.min((gmv / target) * 100, 100) : 0;
                
                return (
                  <tr key={i} className="hover-row">
                    <td style={{ fontWeight: 600 }}>{row.date}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{formatCompactCurrency(gmv)}</span>
                        <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                           <div style={{ width: `${progressWidth}%`, height: '100%', background: mainColor, borderRadius: '2px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Tgt: {formatCompactCurrency(target)}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: rrColor, color: rrText, padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>
                        {rr.toFixed(1)}%
                      </span>
                    </td>
                    <td>{formatNumber(rData.orders || 0)}</td>
                    <td>{formatNumber(rData.units || 0)}</td>
                    <td>{formatCurrency(rData.asp || 0)}</td>
                    <td>{formatCurrency(rData.abs || 0)}</td>
                    <td>{formatNumber(rData.pageViews || 0)}</td>
                    <td>{formatNumber(rData.visitors || 0)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>{(rData.cr || 0).toFixed(2)}%</td>
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
