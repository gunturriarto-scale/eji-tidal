import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { DollarSign, Eye, Users, Target, Activity, Zap } from 'lucide-react';

const COLORS = ['#00f2fe', '#00d2ff', '#00b2ff', '#0092ff', '#0072ff'];

export const TikTokRaw = ({ filteredData }) => {
  const tiktokAdsData = filteredData?.tiktok || [];
  const { loading } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');

  const stats = useMemo(() => {
    if (!tiktokAdsData.length) return null;
    const spend = tiktokAdsData.reduce((acc, curr) => acc + (curr.Cost || 0), 0);
    const impressions = tiktokAdsData.reduce((acc, curr) => acc + (curr.Impressions || 0), 0);
    const reach = tiktokAdsData.reduce((acc, curr) => acc + (curr.Reach || 0), 0);
    const views = tiktokAdsData.reduce((acc, curr) => acc + (curr["Video views"] || 0), 0);
    const views2s = tiktokAdsData.reduce((acc, curr) => acc + (curr["2-second video views"] || 0), 0);
    const views6s = tiktokAdsData.reduce((acc, curr) => acc + (curr["6-second video views"] || 0), 0);
    
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpv = views > 0 ? (spend / views) : 0;

    return {
      spend, impressions, reach, views, views2s, views6s, cpm, cpv
    };
  }, [tiktokAdsData]);

  const trendData = useMemo(() => {
    const daily = {};
    tiktokAdsData.forEach(d => {
      const date = d["By Day"];
      if (!daily[date]) {
        daily[date] = { date, spend: 0, impressions: 0, reach: 0, views: 0, views2s: 0, views6s: 0 };
      }
      daily[date].spend += d.Cost || 0;
      daily[date].impressions += d.Impressions || 0;
      daily[date].reach += d.Reach || 0;
      daily[date].views += d["Video views"] || 0;
      daily[date].views2s += d["2-second video views"] || 0;
      daily[date].views6s += d["6-second video views"] || 0;
    });

    return Object.keys(daily).sort().map(date => {
      const d = daily[date];
      return {
        ...d,
        cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
        cpv: d.views > 0 ? (d.spend / d.views) : 0
      };
    });
  }, [tiktokAdsData]);

  const campaignStats = useMemo(() => {
    const campaigns = {};
    tiktokAdsData.forEach(d => {
      const name = d["Campaign name"];
      if (!campaigns[name]) {
        campaigns[name] = { name, spend: 0, impressions: 0, views: 0, reach: 0 };
      }
      campaigns[name].spend += d.Cost || 0;
      campaigns[name].impressions += d.Impressions || 0;
      campaigns[name].views += d["Video views"] || 0;
      campaigns[name].reach += d.Reach || 0;
    });
    return Object.values(campaigns)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)
      .map(c => ({
        ...c,
        cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0
      }));
  }, [tiktokAdsData]);

  const productShare = useMemo(() => {
    const products = {};
    tiktokAdsData.forEach(d => {
      const p = d.PRODUCTS || 'Other';
      if (!products[p]) products[p] = 0;
      products[p] += d.Impressions || 0;
    });
    return Object.entries(products)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [tiktokAdsData]);

  if (loading) return <div className="flex-center" style={{ height: '400px' }}>Loading TikTok Data...</div>;
  if (!stats) return <div className="flex-center" style={{ height: '400px' }}>No Data Available</div>;

  return (
    <div className="fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>TikTok Awareness Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`glass-panel ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderColor: activeTab === 'dashboard' ? 'var(--accent-primary)' : '' }}
          >
            Dashboard
          </button>
          <button 
            className={`glass-panel ${activeTab === 'raw' ? 'active' : ''}`}
            onClick={() => setActiveTab('raw')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderColor: activeTab === 'raw' ? 'var(--accent-primary)' : '' }}
          >
            Raw Data
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Awareness KPIs */}
          <div className="kpi-grid">
            <div className="glass-panel kpi-card">
              <div className="kpi-header"><span>TikTok Spend</span><DollarSign size={18} /></div>
              <div className="kpi-value">{formatCurrency(stats.spend)}</div>
            </div>
            <div className="glass-panel kpi-card">
              <div className="kpi-header"><span>Impressions</span><Users size={18} /></div>
              <div className="kpi-value">{formatNumber(stats.impressions)}</div>
            </div>
            <div className="glass-panel kpi-card">
              <div className="kpi-header"><span>Reach</span><Target size={18} /></div>
              <div className="kpi-value">{formatNumber(stats.reach)}</div>
            </div>
            <div className="glass-panel kpi-card">
              <div className="kpi-header"><span>Video Views</span><Eye size={18} /></div>
              <div className="kpi-value">{formatNumber(stats.views)}</div>
            </div>
            <div className="glass-panel kpi-card">
              <div className="kpi-header"><span>Avg. CPM</span><Zap size={18} /></div>
              <div className="kpi-value">{formatCurrency(stats.cpm)}</div>
            </div>
            <div className="glass-panel kpi-card">
              <div className="kpi-header"><span>Avg. CPV</span><Activity size={18} /></div>
              <div className="kpi-value">{formatCurrency(stats.cpv)}</div>
            </div>
          </div>

          {/* Main Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div className="glass-panel chart-container">
              <h3 className="chart-title">Impressions & Reach Trend</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={10} tickFormatter={val => `${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(20, 20, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(val) => formatNumber(val)}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#00f2fe" fill="url(#colorImp)" />
                    <Area type="monotone" dataKey="reach" name="Reach" stroke="#0072ff" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel chart-container">
              <h3 className="chart-title">Spend vs Impressions</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                    <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={val => `${(val/1000).toFixed(0)}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={val => `Rp${(val/1000000).toFixed(1)}M`} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(20, 20, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(val, name) => name === 'Spend' ? formatCurrency(val) : formatNumber(val)}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar yAxisId="left" dataKey="impressions" name="Impressions" fill="#00f2fe" radius={[4, 4, 0, 0]} opacity={0.6} />
                    <Line yAxisId="right" type="monotone" dataKey="spend" name="Spend" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel chart-container">
              <h3 className="chart-title">Spend vs CPM</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} />
                    <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={val => `Rp${(val/1000000).toFixed(1)}M`} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={10} tickFormatter={val => `Rp${(val/1000).toFixed(1)}k`} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(20, 20, 29, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(val, name) => formatCurrency(val)}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar yAxisId="left" dataKey="spend" name="Spend" fill="#0072ff" radius={[4, 4, 0, 0]} opacity={0.6} />
                    <Line yAxisId="right" type="monotone" dataKey="cpm" name="CPM" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Engagement & Efficiency Row */}
          <div className="charts-grid" style={{ marginTop: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
             <div className="glass-panel chart-container">
              <h3 className="chart-title">Video Engagement Funnel</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={val => `${(val/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(val) => formatNumber(val)} />
                    <Legend />
                    <Bar dataKey="views" name="Total Views" fill="#00f2fe" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="views2s" name="2s Views" fill="#00b2ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="views6s" name="6s Views" fill="#0072ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel chart-container">
              <h3 className="chart-title">Efficiency Trend (CPM & CPV)</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis yAxisId="left" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--text-tertiary)" fontSize={12} />
                    <Tooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="cpm" name="CPM" stroke="#00f2fe" strokeWidth={3} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="cpv" name="CPV" stroke="#f43f5e" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Campaign Table */}
          <div className="glass-panel chart-container" style={{ marginTop: '1.5rem' }}>
            <h3 className="chart-title">Top 10 Campaigns by Awareness Impact</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Impressions</th>
                    <th>Reach</th>
                    <th>Video Views</th>
                    <th>Spend</th>
                    <th>CPM</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignStats.map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td>{formatNumber(c.impressions)}</td>
                      <td>{formatNumber(c.reach)}</td>
                      <td>{formatNumber(c.views)}</td>
                      <td>{formatCurrency(c.spend)}</td>
                      <td><span className="trend-indicator trend-positive">{formatCurrency(c.cpm)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Raw Data View (Legacy Table) */
        <div className="glass-panel chart-container">
           <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>By Day</th>
                  <th>Campaign Name</th>
                  <th>Objective</th>
                  <th>Ad Name</th>
                  <th>Cost</th>
                  <th>Impressions</th>
                  <th>Views</th>
                  <th>Reach</th>
                </tr>
              </thead>
              <tbody>
                {tiktokAdsData.slice(0, 50).map((row, idx) => (
                  <tr key={idx}>
                    <td>{row["By Day"]}</td>
                    <td>{row["Campaign name"]}</td>
                    <td><span className="badge">{row["Advertising objective"]}</span></td>
                    <td>{row["Ad name"]}</td>
                    <td>{formatCurrency(row.Cost)}</td>
                    <td>{formatNumber(row.Impressions)}</td>
                    <td>{formatNumber(row["Video views"])}</td>
                    <td>{formatNumber(row.Reach)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
