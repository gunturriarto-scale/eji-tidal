import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { formatCurrency, formatNumber } from '../utils/dataAggregation';
import { PlatformSummary } from '../components/PlatformSummary';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, Cell, PieChart, Pie, ComposedChart
} from 'recharts';
import { 
  DollarSign, Megaphone, Users, MousePointerClick, Eye, ShieldCheck, 
  TrendingUp, BarChart3, Activity, Info, AlertCircle, CheckCircle,
  Play, ExternalLink, Zap, Image
} from 'lucide-react';

export const MetaRaw = ({ filteredData }) => {
  const metaAdsData = filteredData?.meta || [];
  const { loading } = useData();
  const [viewMode, setViewMode] = useState('ad'); // 'campaign' or 'ad'
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  // Ad Account List
  const accounts = useMemo(() => {
    const accMap = {};
    metaAdsData.forEach(row => {
      if (row.account_id && !accMap[row.account_id]) {
        accMap[row.account_id] = row.account_name || row.account_id;
      }
    });
    return Object.entries(accMap).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [metaAdsData]);

  // Data filtered by Account
  const filteredMetaAds = useMemo(() => {
    if (selectedAccountId === 'all') return metaAdsData;
    return metaAdsData.filter(row => row.account_id === selectedAccountId);
  }, [metaAdsData, selectedAccountId]);

  // Upper Funnel KPI Aggregation
  const stats = useMemo(() => {
    if (!filteredMetaAds.length) return [];
    const spend = filteredMetaAds.reduce((acc, curr) => acc + (curr.spend || 0), 0);
    const reach = filteredMetaAds.reduce((acc, curr) => acc + (curr.reach || 0), 0);
    const impressions = filteredMetaAds.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const views = filteredMetaAds.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const p50 = filteredMetaAds.reduce((acc, curr) => acc + (curr.video_p50 || 0), 0);
    
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const hookRate = impressions > 0 ? (views / impressions) * 100 : 0;
    const retentionRate = views > 0 ? (p50 / views) * 100 : 0;
    const frequency = reach > 0 ? impressions / reach : 0;

    return [
      { label: 'Total Reach', value: reach, format: 'number', icon: <Megaphone size={18} />, color: '#3B82F6' },
      { label: 'Avg. CPM', value: cpm, format: 'currency', icon: <DollarSign size={18} />, color: '#6366F1' },
      { label: 'Hook Rate (3s)', value: hookRate, format: 'number', suffix: '%', icon: <Zap size={18} />, color: '#F59E0B' },
      { label: 'Retention (50%)', value: retentionRate, format: 'number', suffix: '%', icon: <ShieldCheck size={18} />, color: '#10B981' },
    ];
  }, [filteredMetaAds]);

  // Daily Trend Data
  const dailyData = useMemo(() => {
    const map = {};
    filteredMetaAds.forEach(row => {
      const date = row.day || row.normDate || 'Unknown';
      if (!map[date]) map[date] = { date, reach: 0, impressions: 0, spend: 0, views: 0 };
      map[date].reach += row.reach || 0;
      map[date].impressions += row.impressions || 0;
      map[date].spend += row.spend || 0;
      map[date].views += row.views || 0;
    });
    return Object.values(map)
      .filter(d => d.date !== 'Unknown')
      .map(d => ({
        ...d,
        cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
        hookRate: d.impressions > 0 ? (d.views / d.impressions) * 100 : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredMetaAds]);

  // Ad Level Aggregation
  const adPerformance = useMemo(() => {
    const map = {};
    filteredMetaAds.forEach(row => {
      const id = row.ad_id;
      if (!map[id]) {
        map[id] = { 
          id, 
          name: row.ad_name, 
          campaign: row.campaign_name,
          spend: 0, reach: 0, impressions: 0, views: 0, 
          link_clicks: 0, engagements: 0,
          p25: 0, p50: 0, p75: 0, p100: 0,
          status: row.effective_status || 'ACTIVE',
          thumbnail: row.ad_thumbnail_url,
          preview: row.ad_preview_url,
          history: []
        };
      }
      map[id].spend += row.spend || 0;
      map[id].reach += row.reach || 0;
      map[id].impressions += row.impressions || 0;
      map[id].views += row.views || 0;
      map[id].link_clicks += row.link_clicks || 0;
      map[id].engagements += (row.post_engagements || 0);
      map[id].p25 += row.video_p25 || 0;
      map[id].p50 += row.video_p50 || 0;
      map[id].p75 += row.video_p75 || 0;
      map[id].p100 += row.video_p100 || 0;
      map[id].history.push({ day: row.day, spend: row.spend });
    });
    
    return Object.values(map).sort((a, b) => b.spend - a.spend);
  }, [filteredMetaAds]);

  // Alerts Logic
  const alerts = useMemo(() => {
    const list = [];
    const avgCpm = stats.find(s => s.label === 'Avg. CPM')?.value || 0;
    
    adPerformance.forEach(ad => {
      const cpm = ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0;
      const hookRate = ad.impressions > 0 ? (ad.views / ad.impressions) * 100 : 0;
      const frequency = ad.reach > 0 ? ad.impressions / ad.reach : 0;

      if (ad.spend > 500000) {
        if (hookRate < 10) {
            list.push({ type: 'critical', msg: `Ads "${ad.name}" has very low Hook Rate (3s). Consider changing the first 3 seconds content.` });
        }
        if (frequency > 2.5) {
            list.push({ type: 'warning', msg: `Frequency for "${ad.name}" is high (${frequency.toFixed(2)}x). Audience fatigue likely.` });
        }
        if (cpm < avgCpm * 0.7 && hookRate > 20) {
            list.push({ type: 'opportunity', msg: `"${ad.name}" is highly efficient! Low CPM + High Hook Rate. Scale it up!` });
        }
      }
    });

    return list.slice(0, 5);
  }, [adPerformance, stats]);

  // Discovery Championship Logic
  const discoveryChamps = useMemo(() => {
    const videoAds = adPerformance.filter(a => a.views > 0);
    const staticAds = adPerformance.filter(a => a.views === 0);
    
    const getChamps = (adsList, type) => {
        if (!adsList.length) return [];
        
        // 1. Spending Champ (Budget King)
        const bySpend = [...adsList].sort((a,b) => b.spend - a.spend)[0];
        
        // 2. Stop-Ratio Champ (Engagement Favorite)
        // Filter out tiny ads (< 10k impressions) to ensure significance
        const significantAds = adsList.filter(a => a.impressions >= 10000);
        const byEngagement = [...significantAds].sort((a,b) => {
            if (type === 'video') {
                const hookA = a.impressions > 0 ? (a.views / a.impressions) : 0;
                const hookB = b.impressions > 0 ? (b.views / b.impressions) : 0;
                return hookB - hookA;
            } else {
                const ctrA = a.impressions > 0 ? (a.link_clicks / a.impressions) : 0;
                const ctrB = b.impressions > 0 ? (b.link_clicks / b.impressions) : 0;
                return ctrB - ctrA;
            }
        })[0];
        
        // 3. CPM Efficiency Champ (Scale Efficiency - MIN 1,000,000 imps)
        const byCPM = [...adsList]
          .filter(a => a.impressions >= 1000000)
          .sort((a,b) => (a.spend/a.impressions) - (b.spend/b.impressions))[0];
        
        const res = [
            { ...bySpend, champLabel: '💸 Spending Champ', champColor: '#ef4444' }
        ];
        
        if (byEngagement) {
            const label = type === 'video' ? '🪝 Stop-Ratio (Hook)' : '🪝 Stop-Ratio (CTR)';
            res.push({ ...byEngagement, champLabel: label, champColor: '#3b82f6' });
        }
        
        if (byCPM) {
            res.push({ ...byCPM, champLabel: '🚀 CPM Efficiency Champ', champColor: '#10b981' });
        }
        
        return res.filter(a => a && a.id);
    };

    return {
        video: getChamps(videoAds, 'video'),
        static: getChamps(staticAds, 'static')
    };
  }, [adPerformance]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="text-gray-400">Analyzing Upper Funnel Discovery...</p>
    </div>
  );

  return (
    <div className="fade-in pb-12">
      <style>{`
        .meta-dashboard-container { display: flex; flex-direction: column; gap: 2rem; }
        .section-header { margin-bottom: 1.5rem; }
        .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .alerts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        
        .alert-card { padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .alert-critical { background: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.2); }
        .alert-warning { background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.2); }
        .alert-opportunity { background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2); }
        
        .ad-card { 
            display: flex; 
            gap: 1.5rem; 
            padding: 1.5rem; 
            margin-bottom: 1rem; 
            align-items: stretch;
            transition: all 0.3s ease;
            position: relative;
        }
        .ad-card:hover { border-color: #3b82f6; }
        
        .champ-badge { 
            position: absolute; top: -12px; left: 24px; padding: 4px 12px; border-radius: 20px; 
            font-size: 11px; font-weight: 700; color: #fff; z-index: 20; box-shadow: 0 4px 12px rgba(0,0,0,0.5); 
        }
        
        .ad-thumb-container { width: 140px; flex-shrink: 0; position: relative; border-radius: 12px; overflow: hidden; background: #000; }
        .ad-info-container { flex: 2; display: flex; flex-direction: column; justify-content: center; min-width: 200px; padding-right: 1rem; }
        .ad-name-text { 
            margin: 0 0 4px 0; 
            font-size: 1.1rem; 
            font-weight: 700;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            word-break: break-word;
        }
        .ad-metrics-container { flex: 1.5; padding: 0 1rem; border-right: 1px solid rgba(255,255,255,0.05); border-left: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; justify-content: center; }
        .ad-actions-container { flex: 1; padding-left: 1rem; display: flex; flex-direction: column; justify-content: space-between; }
        
        .metric-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; font-size: 0.8rem; }
        .progress-bar-bg { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 4px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 10px; }
        
        @media (max-width: 1024px) {
            .ad-card { flex-direction: column; }
            .ad-thumb-container { width: 100%; aspect-ratio: 16/9; }
            .ad-metrics-container { border: none; padding: 1.5rem 0; }
            .ad-actions-container { padding: 0; }
        }
      `}</style>

      <div className="meta-dashboard-container">
        {/* Ad Account Filter */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Filter Ad Account:</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => setSelectedAccountId('all')}
                    style={{ 
                        padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', 
                        background: selectedAccountId === 'all' ? '#3b82f6' : 'transparent',
                        color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                    }}
                >
                    ALL ACCOUNTS
                </button>
                {accounts.map(acc => (
                    <button 
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        style={{ 
                            padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', 
                            background: selectedAccountId === acc.id ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                            color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                        }}
                    >
                        {acc.name.replace('EJI // ', '').replace('HMI - ', '')}
                    </button>
                ))}
            </div>
        </div>

        {/* Header Summary */}
        <PlatformSummary title="Meta Awareness Command Center" stats={stats} />

        {/* Charts Section */}
        <div className="charts-row">
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={18} style={{ color: '#3B82F6' }} />
                        Reach & Discovery Trend
                    </h3>
                </div>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                        <defs>
                        <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748B'}} tickFormatter={(val) => {
                           if(!val || typeof val !== 'string') return '';
                           return val.split('-').slice(1).join('/');
                        }} />
                        <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#64748B'}} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#64748B'}} tickFormatter={(val) => `${val.toFixed(1)}%`} />
                        <Tooltip 
                            contentStyle={{ background: 'rgba(10, 10, 15, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Area yAxisId="left" type="monotone" dataKey="reach" name="Reach" stroke="#3B82F6" fill="url(#colorReach)" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="hookRate" name="Hook Rate" stroke="#F59E0B" dot={false} strokeWidth={2} />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Eye size={18} style={{ color: '#10B981' }} />
                    Efficiency Matrix (CPM vs Retention)
                </h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748B'}} />
                        <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#64748B'}} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}K`} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#64748B'}} tickFormatter={(val) => `${(val/1000).toFixed(0)}K`} />
                        <Tooltip 
                            contentStyle={{ background: 'rgba(10, 10, 15, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar yAxisId="right" dataKey="impressions" name="Impressions" fill="#3B82F6" opacity={0.15} barSize={20} />
                        <Line yAxisId="left" type="monotone" dataKey="cpm" name="CPM" stroke="#6366F1" strokeWidth={3} dot={{r: 4, fill: '#6366F1'}} />
                    </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Alerts Section */}
        <div className="alerts-row">
            <div className="alert-card alert-critical">
                <h4 style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 1rem 0', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> Discovery Blockers
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {alerts.filter(a => a.type === 'critical').map((a, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: '#f87171', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', marginTop: '4px', flexShrink: 0 }}></span>
                        {a.msg}
                    </div>
                    ))}
                    {alerts.filter(a => a.type === 'critical').length === 0 && <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>No critical issues detected.</p>}
                </div>
            </div>
            
            <div className="alert-card alert-warning">
                <h4 style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 1rem 0', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={16} /> Saturation Alerts
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {alerts.filter(a => a.type === 'warning').map((a, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', marginTop: '4px', flexShrink: 0 }}></span>
                        {a.msg}
                    </div>
                    ))}
                    {alerts.filter(a => a.type === 'warning').length === 0 && <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>Normal saturation levels.</p>}
                </div>
            </div>

            <div className="alert-card alert-opportunity">
                <h4 style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700, margin: '0 0 1rem 0', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} /> Scale-up Opportunities
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {alerts.filter(a => a.type === 'opportunity').map((a, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', marginTop: '4px', flexShrink: 0 }}></span>
                        {a.msg}
                    </div>
                    ))}
                    {alerts.filter(a => a.type === 'opportunity').length === 0 && <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>No pending opportunities.</p>}
                </div>
            </div>
        </div>

        {/* Discovery Championship Grids */}
        {[
          { title: 'STATIC PERFORMERS (Image/Carousel)', data: discoveryChamps.static, icon: <Image size={24} /> },
          { title: 'VIDEO PERFORMERS (Motion Content)', data: discoveryChamps.video, icon: <Play size={24} /> }
        ].map((section, sIdx) => section.data.length > 0 && (
          <div key={sIdx} className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#3b82f6' }}>{section.icon}</div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{section.title}</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '6px 16px', borderRadius: '20px' }}>
                    Proprietary Performance Distribution
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {section.data.map((ad, idx) => {
                const isVideo = ad.views > 0;
                const hookRate = ad.impressions > 0 ? (ad.views / ad.impressions) * 100 : 0;
                const retention = ad.views > 0 ? (ad.p50 / ad.views) * 100 : 0;
                const ctr = ad.impressions > 0 ? (ad.link_clicks / ad.impressions) * 100 : 0;
                const cpm = ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0;
                const freq = ad.reach > 0 ? ad.impressions / ad.reach : 0;

                return (
                <div key={`${ad.id}-${idx}`} className="glass-panel ad-card" style={{ borderLeft: `5px solid ${ad.champColor}`, padding: '1.5rem' }}>
                    {/* Champion Badge */}
                    <div className="champ-badge" style={{ background: ad.champColor }}>
                        {ad.champLabel}
                    </div>

                    {/* Thumbnail / Status */}
                    <div className="ad-thumb-container">
                        {ad.thumbnail ? (
                            <img src={ad.thumbnail} alt={ad.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f172a' }}>
                                <Play size={40} style={{ opacity: 0.1 }} />
                            </div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}></div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                            <span style={{ 
                                fontSize: '9px', fontWeight: 900, padding: '4px 12px', borderRadius: '4px',
                                background: ad.status.includes('ACTIVE') ? '#10b981' : '#64748b',
                                color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                            {ad.status.replace('CAMPAIGN_', '').replace('ADSET_', '')}
                            </span>
                        </div>
                    </div>

                    {/* Core Info */}
                    <div className="ad-info-container">
                        <h4 className="ad-name-text" style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 700, lineHeight: 1.4 }}>{ad.name}</h4>
                        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', opacity: 0.7 }}>{ad.campaign}</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ margin: '0 0 6px 0', fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>Spend</p>
                                <p style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>{formatCurrency(ad.spend)}</p>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <p style={{ margin: '0 0 6px 0', fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 800 }}>CPM Efficiency</p>
                                <p style={{ margin: 0, fontWeight: 800, color: '#818cf8', fontSize: '1.2rem' }}>{formatCurrency(cpm)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Upper Funnel Metrics */}
                    <div className="ad-metrics-container">
                        {isVideo ? (
                            <>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div className="metric-row">
                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Hook Rate (3s View)</span>
                                        <span style={{ fontWeight: 800, color: hookRate > 20 ? '#10b981' : '#f59e0b', fontSize: '1.2rem' }}>{hookRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ 
                                            width: `${Math.min(hookRate * 2, 100)}%`, 
                                            background: hookRate > 20 ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #d97706, #f59e0b)' 
                                        }}></div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div className="metric-row">
                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Retention Index (50%)</span>
                                        <span style={{ fontWeight: 800, color: retention > 30 ? '#10b981' : '#f59e0b', fontSize: '1.2rem' }}>{retention.toFixed(1)}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ 
                                            width: `${Math.min(retention * 2, 100)}%`, 
                                            background: retention > 30 ? '#10b981' : '#f59e0b' 
                                        }}></div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div className="metric-row">
                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Link CTR (Clicks)</span>
                                        <span style={{ fontWeight: 800, color: ctr > 1 ? '#10b981' : '#f59e0b', fontSize: '1.2rem' }}>{ctr.toFixed(2)}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ 
                                            width: `${Math.min(ctr * 50, 100)}%`, 
                                            background: ctr > 1 ? '#10b981' : '#f59e0b' 
                                        }}></div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div className="metric-row">
                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>Discovery Frequency</span>
                                        <span style={{ fontWeight: 800, color: freq > 2.5 ? '#f59e0b' : '#10b981', fontSize: '1.2rem' }}>{freq.toFixed(2)}x</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ 
                                            width: `${Math.min(freq * 30, 100)}%`, 
                                            background: freq > 2.5 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'linear-gradient(90deg, #059669, #10b981)' 
                                        }}></div>
                                    </div>
                                </div>
                            </>
                        )}
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="metric-row" style={{ marginBottom: '6px' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Discovery Reach:</span>
                                <span style={{ fontWeight: 800, color: '#f8fafc' }}>{formatNumber(ad.reach)}</span>
                            </div>
                            <div style={{ height: '30px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={ad.history}>
                                        <Area type="monotone" dataKey="spend" stroke={ad.champColor} fill={ad.champColor} fillOpacity={0.1} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="ad-actions-container" style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                        <button className="glass-button" style={{ 
                            flex: 1, padding: '0.75rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                             <Activity size={14} /> Details
                        </button>
                        {ad.preview && (
                            <a href={ad.preview} target="_blank" rel="noopener noreferrer" style={{
                                padding: '0.75rem', background: '#3b82f6', color: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center'
                            }}>
                                <ExternalLink size={16} />
                            </a>
                        )}
                    </div>
                </div>
                );
            })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
