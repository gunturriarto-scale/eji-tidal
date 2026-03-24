import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  Users, 
  Eye, 
  DollarSign, 
  MessageSquare, 
  Heart, 
  Share2,
  ExternalLink,
  Award,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';

export const KOLView = ({ filteredData }) => {
  const { loading } = useData();
  const kolData = filteredData?.kol || [];
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 10;

  const stats = useMemo(() => {
    if (!kolData.length) return null;
    const spend = kolData.reduce((acc, curr) => acc + (curr.Ratecard || 0), 0);
    const views = kolData.reduce((acc, curr) => acc + (curr.Views || 0), 0);
    const likes = kolData.reduce((acc, curr) => acc + (curr.Likes || 0), 0);
    const comments = kolData.reduce((acc, curr) => acc + (curr.Comment || 0), 0);
    const engagement = likes + comments + (kolData.reduce((acc, curr) => acc + (curr.Save || 0), 0)) + (kolData.reduce((acc, curr) => acc + (curr.Share || 0), 0));
    
    return {
      totalSpend: spend,
      totalViews: views,
      totalKOLs: new Set(kolData.filter(d => d.Username).map(d => d.Username)).size,
      avgCPV: views > 0 ? spend / views : 0,
      totalEngagement: engagement,
      avgEngRate: views > 0 ? (engagement / views) * 100 : 0
    };
  }, [kolData]);

  const topKOLs = useMemo(() => {
    const map = {};
    kolData.forEach(d => {
      if (!d.Username) return;
      if (!map[d.Username]) map[d.Username] = { name: d.Username, views: 0, spend: 0 };
      map[d.Username].views += (d.Views || 0);
      map[d.Username].spend += (d.Ratecard || 0);
    });
    return Object.values(map).sort((a,b) => b.views - a.views).slice(0, 10);
  }, [kolData]);

  const tierData = useMemo(() => {
    const map = {};
    kolData.forEach(d => {
      const tier = d.Tier || 'Unknown';
      map[tier] = (map[tier] || 0) + 1;
    });
    const colors = ['#4F46E5', '#10B981', '#6366F1', '#94A3B8', '#F59E0B'];
    return Object.entries(map).map(([name, value], idx) => ({ 
      name, 
      value,
      color: colors[idx % colors.length]
    }));
  }, [kolData]);

  const productData = useMemo(() => {
    const map = {};
    kolData.forEach(d => {
      const prod = d.PRODUCT || 'Other';
      if (!map[prod]) map[prod] = { name: prod, views: 0, engagement: 0, count: 0 };
      const eng = (Number(d.Likes) || 0) + (Number(d.Comment) || 0) + (Number(d.Save) || 0) + (Number(d.Share) || 0);
      map[prod].views += (d.Views || 0);
      map[prod].engagement += eng;
      map[prod].count += 1;
    });
    
    return Object.values(map).map(p => ({
      ...p,
      avgER: p.views > 0 ? (p.engagement / p.views) * 100 : 0
    })).sort((a,b) => b.views - a.views);
  }, [kolData]);

  const searchedData = useMemo(() => {
    return kolData.filter(d => 
      (d.Username && d.Username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.PRODUCT && d.PRODUCT.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [kolData, searchTerm]);

  const paginatedData = useMemo(() => {
    return searchedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [searchedData, page]);

  const totalPages = Math.ceil(searchedData.length / rowsPerPage);

  if (loading) return (
    <div className="loading-state">
      <div className="pulse-loader"></div>
      <p>Synchronizing KOL Performance...</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="header-actions" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <div className="search-box glass-panel">
            <Users size={16} />
            <input 
              type="text" 
              placeholder="Search KOL or Product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      {stats && (
        <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-header">
              <span>Total KOL Spend</span>
              <div className="kpi-icon"><DollarSign size={20} /></div>
            </div>
            <div className="kpi-value">{formatCurrency(stats.totalSpend)}</div>
            <div className="kpi-footer">Across {stats.totalKOLs} influencers</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-header">
              <span>Total Awareness (Views)</span>
              <div className="kpi-icon"><Eye size={20} /></div>
            </div>
            <div className="kpi-value">{formatNumber(stats.totalViews)}</div>
            <div className="kpi-footer">Cumulative reach</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-header">
              <span>Avg. CPV</span>
              <div className="kpi-icon"><TrendingUp size={20} /></div>
            </div>
            <div className="kpi-value">{formatCurrency(stats.avgCPV)}</div>
            <div className="kpi-footer">Cost per view efficiency</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-header">
              <span>Engagement Rate</span>
              <div className="kpi-icon"><Heart size={20} /></div>
            </div>
            <div className="kpi-value">{stats.avgEngRate.toFixed(2)}%</div>
            <div className="kpi-footer">Total: {formatNumber(stats.totalEngagement)}</div>
          </div>
        </div>
      )}

      <div className="charts-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel chart-card">
          <div className="chart-header">
            <h3><Award size={18} /> Top 10 KOLs by Views</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={topKOLs} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-tertiary)" fontSize={12} width={100} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ 
                    background: 'rgba(20, 20, 29, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#aaa' }}
                  formatter={(val) => formatNumber(val)}
                />
                <Bar dataKey="views" fill="url(#colorViews)" radius={[0, 4, 4, 0]} />
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-card">
          <div className="chart-header">
            <h3><TrendingUp size={18} /> Views by Product</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={productData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(val) => val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : val} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(20, 20, 29, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#aaa' }}
                  formatter={(val) => formatNumber(val)}
                />
                <Bar dataKey="views" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-card">
          <div className="chart-header">
            <h3><Heart size={18} /> Avg. Engagement Rate per Product</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={[...productData].sort((a,b) => b.avgER - a.avgER)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(20, 20, 29, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#aaa' }}
                  formatter={(val) => val.toFixed(2) + '%'}
                />
                <Bar dataKey="avgER" fill="var(--accent-tertiary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-card">
          <div className="chart-header">
            <h3><PieIcon size={18} /> KOL Tier Distribution</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(20, 20, 29, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff'
                  }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel data-table-card">
        <div className="table-header">
          <h3>Recent Content Performance</h3>
          <div className="badge">{searchedData.length} Posts</div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Product</th>
                <th>Tier</th>
                <th>Views</th>
                <th>Eng. Rate</th>
                <th>Spend</th>
                <th>Status</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => {
                const eng = (Number(row.Likes) || 0) + (Number(row.Comment) || 0) + (Number(row.Save) || 0) + (Number(row.Share) || 0);
                const er = (Number(row.Views) || 0) > 0 ? (eng / row.Views) * 100 : 0;
                return (
                  <tr key={idx} className="hover-row">
                    <td>
                      <div className="user-cell">
                        <div className="avatar-placeholder">{row.Username?.charAt(0)}</div>
                        <span>{row.Username}</span>
                      </div>
                    </td>
                    <td>{row.PRODUCT}</td>
                    <td><span className="tier-badge">{row.Tier}</span></td>
                    <td><div style={{ fontWeight: 600 }}>{formatNumber(row.Views)}</div></td>
                    <td>
                      <div className="er-indicator">
                        <div className="er-bar" style={{ width: `${Math.min(er * 10, 100)}%` }}></div>
                        <span>{er.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>{formatCurrency(row.Ratecard)}</td>
                    <td>
                      <span className={`status-pill ${row['Date Posting'] ? 'status-live' : 'status-planned'}`}>
                        {row['Date Posting'] ? 'Live' : 'Planned'}
                      </span>
                    </td>
                    <td>
                      {row['Link TT / IG'] && (
                        <a href={row['Link TT / IG']} target="_blank" rel="noopener noreferrer" className="external-btn">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div className="pagination-info">
            Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, searchedData.length)} of {searchedData.length}
          </div>
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
