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
  Play, ExternalLink, Zap
} from 'lucide-react';

export const MetaRaw = ({ filteredData }) => {
  const metaAdsData = filteredData?.meta || [];
  const { loading } = useData();
  const [viewMode, setViewMode] = useState('ad'); // 'campaign' or 'ad'
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Upper Funnel KPI Aggregation
  const stats = useMemo(() => {
    if (!metaAdsData.length) return [];
    const spend = metaAdsData.reduce((acc, curr) => acc + (curr.spend || 0), 0);
    const reach = metaAdsData.reduce((acc, curr) => acc + (curr.reach || 0), 0);
    const impressions = metaAdsData.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const views = metaAdsData.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const p50 = metaAdsData.reduce((acc, curr) => acc + (curr.video_p50 || 0), 0);
    
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
  }, [metaAdsData]);

  // Daily Trend Data
  const dailyData = useMemo(() => {
    const map = {};
    metaAdsData.forEach(row => {
      const date = row.day;
      if (!map[date]) map[date] = { date, reach: 0, impressions: 0, spend: 0, views: 0 };
      map[date].reach += row.reach || 0;
      map[date].impressions += row.impressions || 0;
      map[date].spend += row.spend || 0;
      map[date].views += row.views || 0;
    });
    return Object.values(map).map(d => ({
      ...d,
      cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
      hookRate: d.impressions > 0 ? (d.views / d.impressions) * 100 : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [metaAdsData]);

  // Ad Level Aggregation
  const adPerformance = useMemo(() => {
    const map = {};
    metaAdsData.forEach(row => {
      const id = row.ad_id;
      if (!map[id]) {
        map[id] = { 
          id, 
          name: row.ad_name, 
          campaign: row.campaign_name,
          spend: 0, 
          reach: 0, 
          impressions: 0, 
          views: 0, 
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
      map[id].p25 += row.video_p25 || 0;
      map[id].p50 += row.video_p50 || 0;
      map[id].p75 += row.video_p75 || 0;
      map[id].p100 += row.video_p100 || 0;
      map[id].history.push({ day: row.day, spend: row.spend });
    });
    
    return Object.values(map).sort((a, b) => b.spend - a.spend);
  }, [metaAdsData]);

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

  const paginatedAds = adPerformance.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(adPerformance.length / rowsPerPage);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p className="text-gray-400">Analyzing Upper Funnel Discovery...</p>
    </div>
  );

  return (
    <div className="fade-in space-y-8 pb-12">
      {/* Header Summary */}
      <PlatformSummary title="Meta Awareness Command Center" stats={stats} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold flex items-center gap-2">
               <TrendingUp size={18} className="text-blue-500" />
               Reach & Discovery Trend
             </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis yAxisId="left" tick={{fontSize: 10}} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} tickFormatter={(val) => `${val.toFixed(1)}%`} />
                <Tooltip 
                  contentStyle={{ background: 'rgba(10, 10, 15, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="reach" name="Reach" stroke="#3B82F6" fill="url(#colorReach)" />
                <Line yAxisId="right" type="monotone" dataKey="hookRate" name="Hook Rate" stroke="#F59E0B" dot={false} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
             <Eye size={18} className="text-green-500" />
             Efficiency Matrix (CPM vs Retention)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{fontSize: 10}} />
                <YAxis yAxisId="left" tick={{fontSize: 10}} tickFormatter={(val) => `Rp${val/1000}K`} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} tickFormatter={(val) => `${(val/1000).toFixed(0)}K`} />
                <Tooltip 
                   contentStyle={{ background: 'rgba(10, 10, 15, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar yAxisId="right" dataKey="impressions" name="Impressions" fill="#3B82F6" opacity={0.15} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="cpm" name="CPM" stroke="#6366F1" strokeWidth={3} dot={{r: 4, fill: '#6366F1'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <h4 className="text-red-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <AlertCircle size={16} /> Discovery Blockers
          </h4>
          <div className="space-y-3">
            {alerts.filter(a => a.type === 'critical').map((a, i) => (
              <div key={i} className="text-xs text-red-400 flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></span>
                {a.msg}
              </div>
            ))}
            {alerts.filter(a => a.type === 'critical').length === 0 && <p className="text-xs text-gray-500">No critical issues detected.</p>}
          </div>
        </div>
        
        <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <h4 className="text-yellow-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Info size={16} /> Saturation Alerts
          </h4>
          <div className="space-y-3">
            {alerts.filter(a => a.type === 'warning').map((a, i) => (
              <div key={i} className="text-xs text-yellow-400 flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1 shrink-0"></span>
                {a.msg}
              </div>
            ))}
             {alerts.filter(a => a.type === 'warning').length === 0 && <p className="text-xs text-gray-500">Normal saturation levels.</p>}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
          <h4 className="text-green-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <CheckCircle size={16} /> Scale-up Opportunities
          </h4>
          <div className="space-y-3">
            {alerts.filter(a => a.type === 'opportunity').map((a, i) => (
              <div key={i} className="text-xs text-green-400 flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0"></span>
                {a.msg}
              </div>
            ))}
             {alerts.filter(a => a.type === 'opportunity').length === 0 && <p className="text-xs text-gray-500">No pending opportunities.</p>}
          </div>
        </div>
      </div>

      {/* Ad Performance Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Discovery Performance Grid</h3>
          <div className="flex gap-2">
             <button onClick={() => setViewMode('campaign')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'campaign' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Campaigns</button>
             <button onClick={() => setViewMode('ad')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'ad' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Ads</button>
          </div>
        </div>

        <div className="space-y-4">
          {paginatedAds.map((ad) => {
            const hookRate = ad.impressions > 0 ? (ad.views / ad.impressions) * 100 : 0;
            const retention = ad.views > 0 ? (ad.p50 / ad.views) * 100 : 0;
            const cpm = ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0;
            const freq = ad.reach > 0 ? ad.impressions / ad.reach : 0;

            return (
              <div key={ad.id} className="glass-panel p-5 rounded-2xl hover:border-blue-500/50 transition-all group">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Thumbnail / Status */}
                  <div className="lg:col-span-2 relative flex flex-col items-center gap-3">
                    <div className="relative group w-full aspect-[9/12] bg-black/40 rounded-xl overflow-hidden flex items-center justify-center">
                      {ad.thumbnail ? (
                        <img src={ad.thumbnail} alt={ad.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <Play size={32} className="text-white/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-2 left-2 flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                          {ad.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core Info */}
                  <div className="lg:col-span-4 flex flex-col justify-center">
                    <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-blue-400 transition">{ad.name}</h4>
                    <p className="text-xs text-blue-500 font-medium mb-3">{ad.campaign}</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Spend</p>
                        <p className="font-bold">{formatCurrency(ad.spend)}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Frequency</p>
                        <p className="font-bold text-yellow-500">{freq.toFixed(2)}x</p>
                      </div>
                    </div>
                  </div>

                  {/* Upper Funnel Metrics */}
                  <div className="lg:col-span-3">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-gray-500">Hook Rate (3s View)</span>
                          <span className={`${hookRate > 20 ? 'text-green-500' : 'text-yellow-500'} font-bold`}>{hookRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${hookRate > 20 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(hookRate * 2, 100)}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-gray-500">Retention Index (50%)</span>
                          <span className={`${retention > 40 ? 'text-blue-500' : 'text-gray-400'} font-bold`}>{retention.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${retention > 40 ? 'bg-blue-500' : 'bg-gray-400'}`} style={{ width: `${retention}%` }}></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-gray-500">Discovery Reach:</span>
                        <span className="font-bold">{formatNumber(ad.reach)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">CPM Efficiency:</span>
                        <span className="font-bold text-indigo-400">{formatCurrency(cpm)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / Mini Sparkline */}
                  <div className="lg:col-span-3 flex flex-col justify-between h-full py-2">
                    <div className="h-[40px] w-full mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={ad.history}>
                            <Area type="monotone" dataKey="spend" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                         </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="flex gap-2">
                       <button className="flex-1 bg-white/10 hover:bg-white/20 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                         <Activity size={14} /> Details
                       </button>
                       {ad.preview && (
                         <a href={ad.preview} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition">
                           <ExternalLink size={16} />
                         </a>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-6">
          <p className="text-xs text-gray-500">Showing page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition">&lt;</button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};
