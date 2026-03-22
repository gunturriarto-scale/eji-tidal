import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, ComposedChart
} from 'recharts';
import { KPICards } from './KPICards';
import { 
  getAggregatedByDate, 
  formatCurrency, 
  formatNumber, 
  getKOLPerformance,
  getTikTokCreativePerformance,
  getMetaCreativePerformance,
  getProductPerformance
} from '../utils/dataAggregation';
import { dates } from '../data/mockData';
import { useData } from '../context/DataContext';

// Custom Tooltip for Recharts to match our theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 600 }}>
              {entry.name.toLowerCase().includes('spend') || entry.name.toLowerCase().includes('revenue') 
                ? formatCurrency(entry.value) 
                : typeof entry.value === 'number' && !entry.name.includes('ROAS') ? formatNumber(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Dashboard = () => {
  const { tiktokAdsData, metaAdsData, googleAdsData, offsiteData, kolData, loading, error } = useData();

  // Pagination State
  const [ttPage, setTtPage] = useState(1);
  const [metaPage, setMetaPage] = useState(1);
  const [prodPage, setProdPage] = useState(1);
  const rowsPerPage = 10;

  // Memoize data calculations so they only run when context updates
  const chartData = useMemo(() => {
    if (loading || error) return [];
    return getAggregatedByDate(tiktokAdsData, googleAdsData, metaAdsData, offsiteData, kolData, dates).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [tiktokAdsData, googleAdsData, metaAdsData, offsiteData, kolData, loading, error]);

  const kolBreakdown = useMemo(() => {
    if (loading) return [];
    return getKOLPerformance(kolData);
  }, [kolData, loading]);
  
  const ttCreative = useMemo(() => {
    if (loading) return [];
    return getTikTokCreativePerformance(tiktokAdsData);
  }, [tiktokAdsData, loading]);

  const metaCreative = useMemo(() => {
    if (loading) return [];
    return getMetaCreativePerformance(metaAdsData);
  }, [metaAdsData, loading]);

  const productPerformance = useMemo(() => {
    if (loading) return [];
    return getProductPerformance(tiktokAdsData, metaAdsData, googleAdsData, offsiteData, kolData);
  }, [tiktokAdsData, metaAdsData, googleAdsData, offsiteData, kolData, loading]);
  
  // Paginated Data
  const ttPaginated = ttCreative.slice((ttPage - 1) * rowsPerPage, ttPage * rowsPerPage);
  const ttTotalPages = Math.ceil(ttCreative.length / rowsPerPage);

  const metaPaginated = metaCreative.slice((metaPage - 1) * rowsPerPage, metaPage * rowsPerPage);
  const metaTotalPages = Math.ceil(metaCreative.length / rowsPerPage);

  const prodPaginated = productPerformance.slice((prodPage - 1) * rowsPerPage, prodPage * rowsPerPage);
  const prodTotalPages = Math.ceil(productPerformance.length / rowsPerPage);

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2 className="gradient-text">Syncing data from Google Sheets...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <h2 style={{ color: 'var(--warning)' }}>Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar could go here, omitting for simplicity/focus on dashboard */}
      
      <main className="main-content">
        <div className="header fade-in">
          <div className="title-section">
            <h1 className="gradient-text">Digital Command Center</h1>
            <p>Unified view of Ads, KOL, Ecommerce, and Traffic performance</p>
          </div>
          <div>
            {/* Quick date picker placeholder */}
            <div className="glass-panel" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Last 14 Days
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section>
          <KPICards />
        </section>

        {/* Main Charts Area */}
        <section className="charts-grid fade-in delay-2">
          
          {/* Timeline Chart - Impressions vs Spend */}
          <div className="glass-panel chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Impressions vs Spend (Trend)</h2>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                  <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '0.875rem', paddingTop: '10px' }} />
                  
                  <Area yAxisId="left" type="monotone" dataKey="totalImpressions" name="Impressions" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorImpressions)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="totalSpend" name="Total Spend" stroke="var(--accent-tertiary)" strokeWidth={2} dot={{r: 4, fill: 'var(--bg-main)', strokeWidth: 2}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spend Breakdown by Channel */}
          <div className="glass-panel chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Spend by Channel</h2>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '0.875rem', paddingTop: '10px' }} />
                  
                  <Bar dataKey="ttSpend" name="TikTok Ads" stackId="a" fill="#00f2fe" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="metaSpend" name="Meta Ads" stackId="a" fill="#1877f2" />
                  <Bar dataKey="ggSpend" name="Google Ads" stackId="a" fill="#ea4335" />
                  <Bar dataKey="kolSpend" name="KOL Spend" stackId="a" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </section>

        {/* Consideration & Flow Row */}
        <section className="charts-row-equal fade-in delay-3" style={{ marginTop: '1.5rem' }}>
          
          {/* Consideration Journey */}
          <div className="glass-panel chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Consideration Journey (Visits vs ATC Value)</h2>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                  <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  
                  <Line yAxisId="left" type="monotone" dataKey="totalTraffic" name="Total Visits (Offsite + Ads)" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="totalATCValue" name="Add To Cart Value (IDR)" stroke="var(--warning)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Total Spend vs ATC Value */}
          <div className="glass-panel chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Total Spend vs ATC Value</h2>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                  <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  
                  <Bar yAxisId="left" dataKey="totalSpend" name="Total Spend" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="totalATCValue" name="ATC Value (IDR)" stroke="var(--warning)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Cost Efficiency Correlations Row */}
        <section className="charts-row-equal fade-in delay-3" style={{ marginTop: '1.5rem' }}>
          


          {/* Total Spend vs Avg CPM */}
          <div className="glass-panel chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Total Spend vs Avg CPM</h2>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                  <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  
                  <Bar yAxisId="left" dataKey="totalSpend" name="Total Spend" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgCpm" name="Avg CPM (IDR)" stroke="var(--accent-tertiary)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Total Impressions vs Avg CPM */}
          <div className="glass-panel chart-container">
            <div className="chart-header">
              <h2 className="chart-title">Total Impressions vs Avg CPM</h2>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} />
                  <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  
                  <Bar yAxisId="left" dataKey="totalImpressions" name="Total Impressions" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgCpm" name="Avg CPM (IDR)" stroke="var(--accent-tertiary)" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Product Strategy Breakdown */}
        <section className="fade-in delay-3" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
          <h3 style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>Product Strategy Breakdown</h3>
          
          <div className="glass-panel chart-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="chart-header">
              <h2 className="chart-title">Blended Performance by Product</h2>
            </div>
            <div className="table-container" style={{ flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Total Spend (Ads)</th>
                    <th>Total Impressions</th>
                    <th>Visits (Offsite)</th>
                    <th>ATC Units</th>
                    <th>ATC Value (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  {prodPaginated.map((prod, idx) => (
                    <tr key={idx}>
                      <td><div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{prod.name}</div></td>
                      <td>{formatCurrency(prod.spend)}</td>
                      <td>{formatNumber(prod.impressions)}</td>
                      <td>{formatNumber(prod.visits)}</td>
                      <td>{formatNumber(prod.atcUnits)}</td>
                      <td>{formatCurrency(prod.atcValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {prodTotalPages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                  onClick={() => setProdPage(p => Math.max(1, p - 1))} 
                  disabled={prodPage === 1}
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: prodPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Page {prodPage} of {prodTotalPages}</span>
                <button 
                  onClick={() => setProdPage(p => Math.min(prodTotalPages, p + 1))} 
                  disabled={prodPage === prodTotalPages}
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: prodPage === prodTotalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Detailed Performance Data Section (Lower down) */}
        <section className="fade-in delay-3" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
          <h3 style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>Detailed ad creative Breakdown</h3>
          
          {/* KOL Details Table */}
          <div className="glass-panel chart-container">
            <div className="chart-header">
              <h2 className="chart-title">KOL Performance</h2>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>KOL Name</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>Shares</th>
                    <th>Saves</th>
                    <th>Spend (Ratecard)</th>
                    <th>CPM</th>
                    <th>CPV</th>
                  </tr>
                </thead>
                <tbody>
                  {kolBreakdown.map((kol, idx) => (
                    <tr key={idx}>
                      <td><div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{kol.name}</div></td>
                      <td style={{ color: 'var(--accent-secondary)' }}>{formatNumber(kol.views)}</td>
                      <td>{formatNumber(kol.like)}</td>
                      <td>{formatNumber(kol.komen)}</td>
                      <td>{formatNumber(kol.share)}</td>
                      <td>{formatNumber(kol.save)}</td>
                      <td>{formatCurrency(kol.spend)}</td>
                      <td>{formatCurrency(kol.cpm)}</td>
                      <td>{formatCurrency(kol.cpv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="charts-row-equal" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
            {/* TikTok Creative Table */}
            <div className="glass-panel chart-container" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h2 className="chart-title">TikTok Ads Creatives</h2>
              </div>
              <div className="table-container" style={{ flex: 1 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ad Name</th>
                      <th>Reach</th>
                      <th>Impr.</th>
                      <th>Views</th>
                      <th>Spend</th>
                      <th>CPM</th>
                      <th>CPV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ttPaginated.map((ad, idx) => (
                      <tr key={idx}>
                        <td><div style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ad.name}>{ad.name}</div></td>
                        <td>{formatNumber(ad.reach)}</td>
                        <td>{formatNumber(ad.impressions)}</td>
                        <td>{formatNumber(ad.views)}</td>
                        <td>{formatCurrency(ad.spend)}</td>
                        <td>{formatCurrency(ad.cpm)}</td>
                        <td>{formatCurrency(ad.cpv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                  onClick={() => setTtPage(p => Math.max(1, p - 1))} 
                  disabled={ttPage === 1}
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: ttPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Page {ttPage} of {ttTotalPages}</span>
                <button 
                  onClick={() => setTtPage(p => Math.min(ttTotalPages, p + 1))} 
                  disabled={ttPage === ttTotalPages}
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: ttPage === ttTotalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="charts-row-equal" style={{ gridTemplateColumns: 'minmax(350px, 1fr)' }}>
            {/* Meta Creative Table */}
            <div className="glass-panel chart-container" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="chart-header">
                <h2 className="chart-title">Meta Ads Creative</h2>
              </div>
              <div className="table-container" style={{ flex: 1 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Creative Name</th>
                      <th>Reach</th>
                      <th>Impr.</th>
                      <th>Spend</th>
                      <th>CPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metaPaginated.map((ad, idx) => (
                      <tr key={idx}>
                        <td><div style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ad.name}>{ad.name}</div></td>
                        <td>{formatNumber(ad.reach)}</td>
                        <td>{formatNumber(ad.impressions)}</td>
                        <td>{formatCurrency(ad.spend)}</td>
                        <td>{formatCurrency(ad.cpm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                  onClick={() => setMetaPage(p => Math.max(1, p - 1))} 
                  disabled={metaPage === 1}
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: metaPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Page {metaPage} of {metaTotalPages}</span>
                <button 
                  onClick={() => setMetaPage(p => Math.min(metaTotalPages, p + 1))} 
                  disabled={metaPage === metaTotalPages}
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: metaPage === metaTotalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};
