import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';
import { PlatformSummary } from '../components/PlatformSummary';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, Cell, PieChart, Pie, ComposedChart
} from 'recharts';
import { DollarSign, Megaphone, Users, MousePointerClick, Eye, ShieldCheck, TrendingUp, BarChart3, Activity } from 'lucide-react';

export const MetaRaw = ({ filteredData }) => {
  const metaAdsData = filteredData?.meta || [];
  const { loading } = useData();
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const stats = useMemo(() => {
    if (!metaAdsData.length) return [];
    const spend = metaAdsData.reduce((acc, curr) => acc + (curr["Amount spent (IDR)"] || 0), 0);
    const reach = metaAdsData.reduce((acc, curr) => acc + (curr.Reach || 0), 0);
    const impressions = metaAdsData.reduce((acc, curr) => acc + (curr.Impressions || 0), 0);
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const frequency = impressions / (reach || 1);
    
    return [
      { label: 'Total Spend', value: spend, format: 'currency', icon: <DollarSign size={18} /> },
      { label: 'CPM (Overall)', value: cpm, format: 'currency', icon: <TrendingUp size={18} /> },
      { label: 'Total Reach', value: reach, format: 'number', icon: <Megaphone size={18} /> },
      { label: 'Avg Frequency', value: frequency, format: 'number', suffix: 'x', icon: <ShieldCheck size={18} /> },
    ];
  }, [metaAdsData]);

  const dailyData = useMemo(() => {
    const map = {};
    metaAdsData.forEach(row => {
      const date = row.normDate || row.Day;
      if (!map[date]) map[date] = { date, reach: 0, impressions: 0, spend: 0 };
      map[date].reach += row.Reach || 0;
      map[date].impressions += row.Impressions || 0;
      map[date].spend += row["Amount spent (IDR)"] || 0;
    });
    return Object.values(map).map(d => ({
      ...d,
      cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [metaAdsData]);

  const campaignPerformance = useMemo(() => {
    const map = {};
    metaAdsData.forEach(row => {
      const name = row["Campaign name"];
      if (!map[name]) map[name] = { name, spend: 0, reach: 0, impressions: 0, clicks: 0, views: 0 };
      map[name].spend += row["Amount spent (IDR)"] || 0;
      map[name].reach += row.Reach || 0;
      map[name].impressions += row.Impressions || 0;
      map[name].clicks += row["Link clicks"] || 0;
      map[name].views += row.Views || 0;
    });
    return Object.values(map).sort((a, b) => b.impressions - a.impressions);
  }, [metaAdsData]);

  const retentionData = useMemo(() => {
    if (!metaAdsData.length) return [];
    const p25 = metaAdsData.reduce((acc, curr) => acc + (curr["Video plays at 25%"] || 0), 0);
    const p50 = metaAdsData.reduce((acc, curr) => acc + (curr["Video plays at 50%"] || 0), 0);
    const p75 = metaAdsData.reduce((acc, curr) => acc + (curr["Video plays at 75%"] || 0), 0);
    const p100 = metaAdsData.reduce((acc, curr) => acc + (curr["Video plays at 100%"] || 0), 0);
    
    return [
      { name: '25% Play', value: p25 },
      { name: '50% Play', value: p50 },
      { name: '75% Play', value: p75 },
      { name: '100% Play', value: p100 },
    ];
  }, [metaAdsData]);

  const COLORS = ['#1877f2', '#00f2fe', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  const paginatedCampaigns = campaignPerformance.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(campaignPerformance.length / rowsPerPage);

  if (loading) return <div>Analyzing Meta Awareness...</div>;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PlatformSummary title="Meta Awareness Analysis" stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
         <div className="glass-panel chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
              <h3>Efficiency Trend (CPM vs Impressions)</h3>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={11} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" stroke="#00f2fe" fontSize={11} tickFormatter={(val) => `${(val/1000).toFixed(0)}K`} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend />
                <Bar yAxisId="right" dataKey="impressions" name="Impressions" fill="#00f2fe" opacity={0.2} barSize={25} />
                <Line yAxisId="left" type="monotone" dataKey="cpm" name="CPM" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <BarChart3 size={18} style={{ color: '#1877f2' }} />
              <h3>Awareness Share (Impressions per Campaign)</h3>
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
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={18} style={{ color: '#1877f2' }} />
              <h3>Reach & Investment Scaling</h3>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1877f2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1877f2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="reach" name="Daily Reach" stroke="#1877f2" fillOpacity={1} fill="url(#colorReach)" />
                <Line type="monotone" dataKey="spend" name="Spend" stroke="#f59e0b" dot={false} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <Eye size={18} style={{ color: '#00f2fe' }} />
              <h3>Meta Video Retention</h3>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={retentionData} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.05)'}}
                   contentStyle={{ background: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" name="Plays" fill="#00f2fe" radius={[0, 4, 4, 0]} barSize={30}>
                   {retentionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.2)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Awareness Efficiency Breakdown</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Detailed analysis by campaign reach and saturation</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Impressions</th>
                <th>CPM</th>
                <th>Reach</th>
                <th>Freq</th>
                <th style={{ textAlign: 'right' }}>Awareness Score</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCampaigns.map((camp, idx) => {
                const cpm = camp.impressions > 0 ? (camp.spend / camp.impressions) * 1000 : 0;
                const freq = camp.impressions / (camp.reach || 1);
                return (
                  <tr key={idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '4px', height: '1.5rem', background: '#1877f2', borderRadius: '4px' }}></div>
                        <span style={{ fontWeight: 600 }}>{camp.name}</span>
                      </div>
                    </td>
                    <td>{formatNumber(camp.impressions)}</td>
                    <td>{formatCurrency(cpm)}</td>
                    <td>{formatNumber(camp.reach)}</td>
                    <td>{freq.toFixed(2)}x</td>
                    <td style={{ textAlign: 'right' }}>
                       <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '99px', background: freq < 1.5 ? 'rgba(52, 168, 83, 0.1)' : 'rgba(251, 188, 5, 0.1)', color: freq < 1.5 ? '#34a853' : '#fbbc05', fontSize: '0.75rem' }}>
                        {freq < 1.2 ? 'Fresh' : freq < 2 ? 'Optimal' : 'High Frequency'}
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
