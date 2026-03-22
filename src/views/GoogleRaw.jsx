import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';
import { PlatformSummary } from '../components/PlatformSummary';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, Cell, ComposedChart, PieChart, Pie
} from 'recharts';
import { DollarSign, MousePointerClick, Users, Eye, TrendingUp, BarChart3, Target, Activity } from 'lucide-react';

export const GoogleRaw = ({ filteredData }) => {
  const googleAdsData = filteredData?.google || [];
  const { loading } = useData();
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const stats = useMemo(() => {
    if (!googleAdsData.length) return [];
    const spend = googleAdsData.reduce((acc, curr) => acc + (curr.Cost || 0), 0);
    const impressions = googleAdsData.reduce((acc, curr) => acc + (curr["Impr."] || 0), 0);
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const views = googleAdsData.reduce((acc, curr) => acc + (curr["TrueView views"] || 0), 0);
    
    return [
      { label: 'Total Google Spend', value: spend, format: 'currency', icon: <DollarSign size={18} /> },
      { label: 'CPM (Overall)', value: cpm, format: 'currency', icon: <Target size={18} /> },
      { label: 'Total Impressions', value: impressions, format: 'number', icon: <Users size={18} /> },
      { label: 'TrueView views', value: views, format: 'number', icon: <Eye size={18} /> },
    ];
  }, [googleAdsData]);

  const dailyData = useMemo(() => {
    const map = {};
    googleAdsData.forEach(row => {
      const date = row.normDate || row.Day;
      if (!map[date]) map[date] = { date, spend: 0, impressions: 0, views: 0 };
      map[date].spend += row.Cost || 0;
      map[date].impressions += row["Impr."] || 0;
      map[date].views += row["TrueView views"] || 0;
    });
    return Object.values(map).map(d => ({
      ...d,
      cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [googleAdsData]);

  const campaignPerformance = useMemo(() => {
    const map = {};
    googleAdsData.forEach(row => {
      const name = row.Campaign;
      if (!map[name]) map[name] = { name, spend: 0, impressions: 0, clicks: 0, views: 0 };
      map[name].spend += row.Cost || 0;
      map[name].impressions += row["Impr."] || 0;
      map[name].clicks += row.Clicks || 0;
      map[name].views += row["TrueView views"] || 0;
    });
    return Object.values(map).sort((a, b) => b.impressions - a.impressions);
  }, [googleAdsData]);

  const videoFunnelData = useMemo(() => {
    if (!googleAdsData.length) return [];
    const totals = {
      p25: googleAdsData.reduce((acc, curr) => acc + (parseFloat(curr["Video played to 25%"]) || 0), 0) / (googleAdsData.length || 1),
      p50: googleAdsData.reduce((acc, curr) => acc + (parseFloat(curr["Video played to 50%"]) || 0), 0) / (googleAdsData.length || 1),
      p75: googleAdsData.reduce((acc, curr) => acc + (parseFloat(curr["Video played to 75%"]) || 0), 0) / (googleAdsData.length || 1),
      p100: googleAdsData.reduce((acc, curr) => acc + (parseFloat(curr["Video played to 100%"]) || 0), 0) / (googleAdsData.length || 1),
    };
    return [
      { name: '25% Play', value: totals.p25 },
      { name: '50% Play', value: totals.p50 },
      { name: '75% Play', value: totals.p75 },
      { name: '100% Play', value: totals.p100 },
    ];
  }, [googleAdsData]);

  const COLORS = ['#ea4335', '#4285f4', '#fbbc05', '#34a853', '#ff6d00', '#4615b2'];
  const paginatedCampaigns = campaignPerformance.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(campaignPerformance.length / rowsPerPage);

  if (loading) return (
    <div className="loading-state">
      <div className="loader"></div>
      <p>Analyzing Google Ads Awareness...</p>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <PlatformSummary title="Google Brand Awareness Analysis" stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Awareness Efficiency Trend */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={18} style={{ color: '#ea4335' }} />
              <h3>Efficiency Trend (CPM vs Impressions)</h3>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis yAxisId="left" stroke="#ea4335" fontSize={11} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" stroke="#4285f4" fontSize={11} tickFormatter={(val) => `${(val/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend />
                <Bar yAxisId="right" dataKey="impressions" name="Impressions" fill="#4285f4" opacity={0.3} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="cpm" name="CPM" stroke="#ea4335" strokeWidth={3} dot={{ r: 4, fill: '#ea4335' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impression Share Pie */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <BarChart3 size={18} style={{ color: '#fbbc05' }} />
              <h3>Brand Voice (Impression Share)</h3>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={campaignPerformance.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="impressions"
                  nameKey="name"
                >
                  {campaignPerformance.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ background: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                   formatter={(val) => formatNumber(val)}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '10px', maxWidth: '150px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Scale Trend */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={18} style={{ color: '#4285f4' }} />
              <h3>Scale vs Investment Trend</h3>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285f4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4285f4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="impressions" name="Daily Impressions" stroke="#4285f4" fillOpacity={1} fill="url(#colorImpressions)" />
                <Line type="monotone" dataKey="spend" name="Spend" stroke="#34a853" dot={false} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* VideoRetention */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <Eye size={18} style={{ color: '#fbbc05' }} />
              <h3>Video Awareness Retention</h3>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={videoFunnelData} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.05)'}}
                   contentStyle={{ background: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" name="Retention Rate (%)" fill="#fbbc05" radius={[0, 4, 4, 0]} barSize={30}>
                   {videoFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.2)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Campaign Awareness Deep Dive</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Efficiency analysis by CPM and Impression scale</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Impressions</th>
                <th>CPM</th>
                <th>Spend</th>
                <th>TrueView Views</th>
                <th style={{ textAlign: 'right' }}>Awareness Score</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCampaigns.map((camp, idx) => {
                const cpm = camp.impressions > 0 ? (camp.spend / camp.impressions) * 1000 : 0;
                return (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '4px', height: '1.5rem', background: '#ea4335', borderRadius: '4px' }}></div>
                        <span style={{ fontWeight: 600 }}>{camp.name}</span>
                      </div>
                    </td>
                    <td>{formatNumber(camp.impressions)}</td>
                    <td>{formatCurrency(cpm)}</td>
                    <td>{formatCurrency(camp.spend)}</td>
                    <td>{formatNumber(camp.views)}</td>
                    <td style={{ textAlign: 'right' }}>
                       <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '99px', background: cpm < 15000 ? 'rgba(52, 168, 83, 0.1)' : 'rgba(251, 188, 5, 0.1)', color: cpm < 15000 ? '#34a853' : '#fbbc05', fontSize: '0.75rem' }}>
                        {cpm < 10000 ? 'Highly Efficient' : cpm < 25000 ? 'Optimal' : 'Premium'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="glass-panel" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&lt;</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="glass-panel" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&gt;</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Page {page} of {totalPages}</p>
        </div>
      </div>
    </div>
  );
};
