import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';
import { PlatformSummary } from '../components/PlatformSummary';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, Cell, ComposedChart, PieChart, Pie
} from 'recharts';
import { DollarSign, Megaphone, Users, TrendingUp, BarChart3, Activity, Eye, MousePointerClick } from 'lucide-react';

export const CriteoRaw = ({ filteredData }) => {
  const criteoAdsData = filteredData?.criteo || [];
  const { loading } = useData();
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const stats = useMemo(() => {
    if (!criteoAdsData.length) return [];
    const spend = criteoAdsData.reduce((acc, curr) => acc + (curr.Cost || 0), 0);
    const impressions = criteoAdsData.reduce((acc, curr) => acc + (curr.Displays || 0), 0);
    const reach = criteoAdsData.reduce((acc, curr) => acc + (curr["Exposed Users"] || 0), 0);
    const clicks = criteoAdsData.reduce((acc, curr) => acc + (curr.Clicks || 0), 0);
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    
    return [
      { label: 'Total Criteo Spend', value: spend, format: 'currency', icon: <DollarSign size={18} /> },
      { label: 'Total Reach', value: reach, format: 'number', icon: <Megaphone size={18} /> },
      { label: 'Total Impressions', value: impressions, format: 'number', icon: <Eye size={18} /> },
      { label: 'Avg. CPM', value: cpm, format: 'currency', icon: <TrendingUp size={18} /> },
    ];
  }, [criteoAdsData]);

  const dailyData = useMemo(() => {
    const map = {};
    criteoAdsData.forEach(row => {
      const date = row.normDate || row.Day;
      if (!map[date]) map[date] = { date, spend: 0, impressions: 0, reach: 0, clicks: 0, viewed: 0 };
      map[date].spend += row.Cost || 0;
      map[date].impressions += row.Displays || 0;
      map[date].reach += row["Exposed Users"] || 0;
      map[date].clicks += row.Clicks || 0;
      map[date].viewed += row["Viewed displays"] || 0;
    });
    return Object.values(map).map(d => ({
      ...d,
      cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
      viewability: d.impressions > 0 ? (d.viewed / d.impressions) * 100 : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [criteoAdsData]);

  const categoryPerformance = useMemo(() => {
    const map = {};
    criteoAdsData.forEach(row => {
      const cat = row.Category || 'Uncategorized';
      if (!map[cat]) map[cat] = { name: cat, impressions: 0, spend: 0 };
      map[cat].impressions += row.Displays || 0;
      map[cat].spend += row.Cost || 0;
    });
    return Object.values(map).map(c => ({
      ...c,
      cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0
    })).sort((a,b) => b.impressions - a.impressions);
  }, [criteoAdsData]);

  const productPerformance = useMemo(() => {
    const map = {};
    criteoAdsData.forEach(row => {
      const prod = row.PRODUCTS || 'Other';
      if (!map[prod]) map[prod] = { name: prod, spend: 0, impressions: 0, reach: 0, clicks: 0 };
      map[prod].spend += row.Cost || 0;
      map[prod].impressions += row.Displays || 0;
      map[prod].reach += row["Exposed Users"] || 0;
      map[prod].clicks += row.Clicks || 0;
    });
    return Object.values(map).sort((a, b) => b.spend - a.spend);
  }, [criteoAdsData]);

  const COLORS = ['#33b3ff', '#00f2fe', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const paginatedProducts = productPerformance.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(productPerformance.length / rowsPerPage);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <span>{entry.name}:</span>
              <span style={{ fontWeight: 600 }}>
                {entry.name.includes('Spend') || entry.name.includes('Cost') || entry.name.includes('CPM')
                  ? formatCurrency(entry.value) 
                  : entry.name.includes('Rate') || entry.name.includes('viewability') ? `${entry.value.toFixed(2)}%` : formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="flex-center" style={{ height: '400px' }}>Analyzing Criteo Intelligence...</div>;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="kpi-grid">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel kpi-card">
            <div className="kpi-header">
              <span>{stat.label}</span>
              <div className="kpi-icon">{stat.icon}</div>
            </div>
            <div className="kpi-value">
              {stat.format === 'currency' ? formatCurrency(stat.value) : 
               stat.format === 'percentage' ? `${stat.value.toFixed(2)}%` : formatNumber(stat.value)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* CPM vs Impressions Trend */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><TrendingUp size={18} /> CPM vs Impression Trends</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={11} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={11} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="impressions" name="Total Impressions" fill="var(--accent-primary)" opacity={0.3} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cpm" name="Avg. CPM" stroke="var(--accent-secondary)" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impression Share by Category */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><PieChart size={18} /> Impression Share by Category</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="impressions"
                >
                  {categoryPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatNumber(val)} />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
         {/* Spend vs CPM Efficiency */}
         <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><Activity size={18} /> Spend vs CPM Efficiency</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={11} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={11} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="spend" name="Daily Spend" fill="var(--accent-tertiary)" opacity={0.5} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cpm" name="CPM" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPM by Category */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><BarChart3 size={18} /> CPM by Category</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryPerformance} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={10} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cpm" name="CPM" fill="var(--accent-primary)" radius={[0, 4, 4, 0]}>
                   {categoryPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3>Product Performance Deep Dive</h3>
          <div className="badge">{productPerformance.length} Products Tracked</div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Impressions</th>
                <th>Reach (Exposed)</th>
                <th>Clicks</th>
                <th>CTR</th>
                <th>Avg. CPM</th>
                <th>Total Spend</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((prod, idx) => {
                const cpm = prod.impressions > 0 ? (prod.spend / prod.impressions) * 1000 : 0;
                const ctr = prod.impressions > 0 ? (prod.clicks / prod.impressions) * 100 : 0;
                return (
                  <tr key={idx} className="hover-row">
                    <td><span style={{ fontWeight: 600 }}>{prod.name}</span></td>
                    <td>{formatNumber(prod.impressions)}</td>
                    <td>{formatNumber(prod.reach)}</td>
                    <td>{formatNumber(prod.clicks)}</td>
                    <td>{ctr.toFixed(2)}%</td>
                    <td>{formatCurrency(cpm)}</td>
                    <td>{formatCurrency(prod.spend)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <div className="pagination-info">Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, productPerformance.length)} of {productPerformance.length}</div>
          <div className="pagination-btns">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="glass-panel">Prev</button>
            <div className="page-indicator">{page} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="glass-panel">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
