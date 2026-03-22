import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useData } from '../context/DataContext';
import { TrendingUp, MessageCircle, Heart, Repeat, Share2, Search, BarChart2 } from 'lucide-react';

const COLORS = ['#10b981', '#6b7280', '#ef4444']; // Positive, Neutral, Negative

const XMonitoring = ({ filteredData, hideHeader = false }) => {
  const { xData, xPosts } = filteredData;

  const chartData = useMemo(() => {
    if (!xData) return [];
    // Aggregate by date
    const grouped = xData.reduce((acc, curr) => {
      if (!acc[curr.Date]) acc[curr.Date] = { date: curr.Date };
      acc[curr.Date][curr.Keyword] = curr.Mentions;
      return acc;
    }, {});
    return Object.values(grouped).sort((a,b) => new Date(a.date) - new Date(b.date));
  }, [xData]);

  const sentimentData = useMemo(() => {
    if (!xData) return [];
    const totals = xData.reduce((acc, curr) => {
      acc.Positive += curr.Sentiment.Positive;
      acc.Neutral += curr.Sentiment.Neutral;
      acc.Negative += curr.Sentiment.Negative;
      return acc;
    }, { Positive: 0, Neutral: 0, Negative: 0 });

    return [
      { name: 'Positive', value: totals.Positive },
      { name: 'Neutral', value: totals.Neutral },
      { name: 'Negative', value: totals.Negative }
    ];
  }, [xData]);

  // Removed loading check here as it's handled in App.jsx

  return (
    <div className={`view-container fade-in ${hideHeader ? 'embedded' : ''}`} style={hideHeader ? { padding: 0 } : {}}>
      {!hideHeader && (
        <div className="view-header">
          <h1>X (Twitter) Monitoring</h1>
          <p>Real-time brand mentions, sentiment analysis, and social intelligence.</p>
        </div>
      )}

      {/* Top Level KPIs */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>Total Mentions (30d)</span>
            <div className="kpi-icon"><MessageCircle size={18} /></div>
          </div>
          <div className="kpi-value">
            {xData.reduce((sum, d) => sum + d.Mentions, 0).toLocaleString()}
          </div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>Est. Social Reach</span>
            <div className="kpi-icon"><Share2 size={18} /></div>
          </div>
          <div className="kpi-value">
            {(xData.reduce((sum, d) => sum + d.Reach, 0) / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span>Avg. Sentiment Index</span>
            <div className="kpi-icon"><TrendingUp size={18} /></div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-secondary)' }}>
            82%
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Mentions Over Time */}
        <div className="glass-panel chart-container full-width">
          <div className="chart-header">
            <h3><BarChart2 size={18} /> Mentions Over Time</h3>
            <p>Daily volume per keyword</p>
          </div>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 20, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="hanasui" stroke="#00f2fe" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="skintific" stroke="#f43f5e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="glad2glow" stroke="#8b5cf6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3>Overall Sentiment</h3>
            <p>Aggregated user perception</p>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Keywords Reach */}
        <div className="glass-panel chart-container">
          <div className="chart-header">
            <h3>Keyword Performance</h3>
            <p>Share of mentions by brand</p>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={[
                { name: 'hanasui', value: 4500 },
                { name: 'skintific', value: 5200 },
                { name: 'glad2glow', value: 2800 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-tertiary)" fontSize={12} width={80} />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(10, 10, 20, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Posts Feed */}
      <h3 style={{ marginBottom: '1.5rem', marginTop: '2rem' }}>High Engagement Mentions</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {xPosts.map((post, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{post.User}</span>
              <span className={`badge ${post.Sentiment.toLowerCase()}`}>{post.Sentiment}</span>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)' }}>{post.Text}</p>
            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Heart size={14} /> {post.Likes}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Repeat size={14} /> {post.Retweets}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Search size={14} /> Keyword: {post.Keyword}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default XMonitoring;
