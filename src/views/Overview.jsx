import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, ComposedChart,
  PieChart, Pie, Cell
} from 'recharts';
import { KPICards } from '../components/KPICards';
import { 
  getAggregatedByDate, 
  formatCurrency, 
  formatNumber, 
  getKOLPerformance,
  getTikTokCreativePerformance,
  getMetaCreativePerformance,
  getProductPerformance,
  getChannelPerformance
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

export const Overview = ({ filteredData, dateRange }) => {
  const { loading, error } = useData();
  const { tiktok: fTiktok, meta: fMeta, google: fGoogle, kol: fKol, criteo: fCriteo, offsite: fOffsite, orders: fOrders = [], kpiDates } = filteredData;


  // Calculate unique dates ONLY for the filtered subset (Chart View)
  const dynamicDates = useMemo(() => {
    const allDates = new Set();
    fTiktok.forEach(d => { if (d.normDate) allDates.add(d.normDate) });
    fMeta.forEach(d => { if (d.normDate) allDates.add(d.normDate) });
    fGoogle.forEach(d => { if (d.normDate) allDates.add(d.normDate) });
    fKol.forEach(d => { if (d.normDate) allDates.add(d.normDate) });
    fCriteo.forEach(d => { if (d.normDate) allDates.add(d.normDate) });
    fOffsite.forEach(d => { if (d.normDate) allDates.add(d.normDate) });
    
    if (allDates.size === 0) return dates; // fallback
    return Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
  }, [fTiktok, fMeta, fGoogle, fKol, fCriteo, fOffsite]);

  // Memoize data calculations so they only run when context updates
  const chartData = useMemo(() => {
    if (loading || error) return [];
    return getAggregatedByDate(fTiktok, fGoogle, fMeta, fOffsite, fKol, fCriteo, dynamicDates).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [fTiktok, fGoogle, fMeta, fOffsite, fKol, fCriteo, loading, error, dynamicDates]);



  const spendByChannel = useMemo(() => {
    if (!chartData.length) return [];
    const totals = {
      tt: chartData.reduce((acc, curr) => acc + (curr.ttSpend || 0), 0),
      meta: chartData.reduce((acc, curr) => acc + (curr.metaSpend || 0), 0),
      gg: chartData.reduce((acc, curr) => acc + (curr.ggSpend || 0), 0),
      kol: chartData.reduce((acc, curr) => acc + (curr.kolSpend || 0), 0),
      cri: chartData.reduce((acc, curr) => acc + (curr.criSpend || 0), 0),
    };
    return [
      { name: 'TikTok Ads', value: totals.tt, color: '#00f2fe' },
      { name: 'Meta Ads', value: totals.meta, color: '#1877f2' },
      { name: 'Google Ads', value: totals.gg, color: '#ea4335' },
      { name: 'Criteo Ads', value: totals.cri, color: '#33b3ff' },
    ].filter(item => item.value > 0);
  }, [chartData]);

  const impressionsByChannel = useMemo(() => {
    if (!chartData.length) return [];
    const totals = {
      tt: chartData.reduce((acc, curr) => acc + (curr.ttImp || 0), 0),
      meta: chartData.reduce((acc, curr) => acc + (curr.metaImp || 0), 0),
      gg: chartData.reduce((acc, curr) => acc + (curr.ggImp || 0), 0),
      kol: chartData.reduce((acc, curr) => acc + (curr.kolImp || 0), 0),
      cri: chartData.reduce((acc, curr) => acc + (curr.criImp || 0), 0),
    };
    return [
      { name: 'TikTok', value: totals.tt, color: '#00f2fe' },
      { name: 'Meta', value: totals.meta, color: '#1877f2' },
      { name: 'Google', value: totals.gg, color: '#ea4335' },
      { name: 'Criteo', value: totals.cri, color: '#33b3ff' },
    ].filter(item => item.value > 0);
  }, [chartData]);

  const clicksByChannel = useMemo(() => {
    if (!chartData.length) return [];
    const totals = {
      tt: chartData.reduce((acc, curr) => acc + (curr.ttClicks || 0), 0),
      meta: chartData.reduce((acc, curr) => acc + (curr.metaClicks || 0), 0),
      gg: chartData.reduce((acc, curr) => acc + (curr.ggClicks || 0), 0),
      cri: chartData.reduce((acc, curr) => acc + (curr.criClicks || 0), 0),
    };
    return [
      { name: 'TikTok', value: totals.tt, color: '#00f2fe' },
      { name: 'Meta', value: totals.meta, color: '#1877f2' },
      { name: 'Google', value: totals.gg, color: '#ea4335' },
      { name: 'Criteo', value: totals.cri, color: '#33b3ff' },
    ].filter(item => item.value > 0);
  }, [chartData]);

  const channelComparison = useMemo(() => {
    if (loading) return [];
    return getChannelPerformance(fTiktok, fMeta, fGoogle, fKol, fCriteo);
  }, [fTiktok, fMeta, fGoogle, fKol, fCriteo, loading]);
  



  return (
    <div className="fade-in">
      <section>
        <KPICards filteredData={filteredData} />
      </section>

      {/* Main Charts Area */}
      <section className="fade-in delay-2" style={{ marginTop: '1.5rem' }}>
        {/* Timeline Chart - Impressions vs Spend */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Impressions vs Spend (Trend)</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={400}>
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
      </section>

      {/* Channel Breakdown Row (3 Pie Charts) */}
      <section className="fade-in delay-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Spend Breakdown */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Spend by Channel</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={spendByChannel} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {spendByChannel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: 'rgba(20, 20, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impressions Breakdown */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Impressions by Channel</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={impressionsByChannel} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {impressionsByChannel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ background: 'rgba(20, 20, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clicks Breakdown */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h2 className="chart-title">Clicks by Channel</h2>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={clicksByChannel} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {clicksByChannel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} contentStyle={{ background: 'rgba(20, 20, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>


      {/* Efficiency & Correlation Section */}
      <section className="fade-in delay-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Efficiency Comparison */}
        <div className="glass-panel chart-container">
          <div className="chart-header"><h2 className="chart-title">Efficiency Comparison (CPM per Channel)</h2></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={channelComparison} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }} formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="cpm" name="CPM (IDR)" radius={[0, 4, 4, 0]}>
                  {channelComparison.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Spend vs Avg CPM */}
        <div className="glass-panel chart-container">
          <div className="chart-header"><h2 className="chart-title">Total Spend vs Avg CPM</h2></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp${(val/1000000).toFixed(0)}M`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar yAxisId="left" dataKey="totalSpend" name="Total Spend" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgCpm" name="Avg CPM" stroke="var(--accent-tertiary)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Impressions vs Avg CPM */}
        <div className="glass-panel chart-container">
          <div className="chart-header"><h2 className="chart-title">Total Impressions vs Avg CPM</h2></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar yAxisId="left" dataKey="totalImpressions" name="Total Impressions" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgCpm" name="Avg CPM" stroke="var(--accent-tertiary)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>


    </div>
  );
};
