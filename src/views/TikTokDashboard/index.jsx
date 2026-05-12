import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector
} from 'recharts';
import {
  DollarSign, Eye, TrendingUp, MousePointerClick, Play,
  Clock, ShoppingCart, Users, Zap, Video
} from 'lucide-react';
import { TikTokKPICards } from './components/TikTokKPICards';
import { TikTokSpendTrend } from './components/TikTokSpendTrend';
import { TikTokBrandDonut } from './components/TikTokBrandDonut';
import { TikTokCampaignTable } from './components/TikTokCampaignTable';
import { TikTokDemographics } from './components/TikTokDemographics';
import { TikTokGeoPerformance } from './components/TikTokGeoPerformance';
import { TikTokVideoFunnel } from './components/TikTokVideoFunnel';
import { TikTokAdCreativePreview } from './components/TikTokAdCreativePreview';
import { TikTokPlacementChart } from './components/TikTokPlacementChart';
import { TikTokCampaignObjective } from './components/TikTokCampaignObjective';
import { TikTokDeviceChart } from './components/TikTokDeviceChart';
import { TikTokDayOfWeek } from './components/TikTokDayOfWeek';
import { TikTokFrequency } from './components/TikTokFrequency';
import { TikTokQuickInsights } from './components/TikTokQuickInsights';
import { SectionTabs } from './components/SectionTabs';

const API = '/api/bigquery';

class TikTokDashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem', margin: '1rem',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', color: '#ef4444',
          fontSize: '0.9rem'
        }}>
          Dashboard render error: {this.state.error?.message}
          <pre style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const BRAND_LABELS = {
  'EJI // Hanasui // SKINCARE': 'Skincare',
  'EJI // Hanasui // DECORATIVE': 'Decorative',
  'EJI // Hanasui // BODYCARE': 'Bodycare',
};
const BRAND_COLORS = {
  Skincare: '#FF0050',
  Decorative: '#10B981',
  Bodycare: '#F59E0B',
};

// ─── Date Helpers ──────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const fmtRp = (n) => {
  if (!n && n !== 0) return '—';
  return 'Rp ' + Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{
      padding: '0.75rem 1rem',
      border: '1px solid rgba(255,0,80,0.25)',
      background: 'rgba(20,20,29,0.95)',
      borderRadius: '8px'
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.85rem', color: p.color || '#FF0050', fontWeight: 600 }}>
          {p.name}: {p.name?.includes('spend') || p.name?.includes('Spend') ? fmtRp(p.value) : fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

// ─── Loading State ─────────────────────────────────────────────────────────────
const LoadingState = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{
        height: '80px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
    ))}
  </div>
);

// ─── Section Wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, subtitle, children, style = {} }) => (
  <div className="glass-panel" style={{ padding: '1.5rem', ...style }}>
    {title && (
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0' }}>{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TikTokDashboardInner = () => {
  // ─── Filter State ───────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [brandFilter, setBrandFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [kpiData, setKpiData] = useState(null);
  const [prevKpiData, setPrevKpiData] = useState(null);
  const [brandOverview, setBrandOverview] = useState([]);
  const [brandTrend, setBrandTrend] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [ageGender, setAgeGender] = useState([]);
  const [geo, setGeo] = useState([]);
  const [videoFunnel, setVideoFunnel] = useState([]);
  const [videoKPIData, setVideoKPIData] = useState({});
  const [placement, setPlacement] = useState([]);
  const [ads, setAds] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [dayOfWeek, setDayOfWeek] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const periodDays = Math.round((end - start) / 86400000) + 1;
    const prevEnd = new Date(start.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - (periodDays - 1) * 86400000);
    const prevStartStr = prevStart.toISOString().split('T')[0];
    const prevEndStr = prevEnd.toISOString().split('T')[0];
    const prevParams = `start=${prevStartStr}&end=${prevEndStr}${brandFilter !== 'all' ? `&account=${encodeURIComponent(brandFilter)}` : ''}`;
    const params = `start=${startDate}&end=${endDate}${brandFilter !== 'all' ? `&account=${encodeURIComponent(brandFilter)}` : ''}`;

    Promise.all([
      fetch(`${API}?type=tiktokKpiSummary&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokKpiSummary&${prevParams}`).then(r => r.json()),
      fetch(`${API}?type=tiktokVideoKPISummary&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokBrandOverview&start=${startDate}&end=${endDate}`).then(r => r.json()),
      fetch(`${API}?type=tiktokBrandTrend&start=${startDate}&end=${endDate}`).then(r => r.json()),
      fetch(`${API}?type=tiktokTopCampaigns&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokAgeGender&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokGeo&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokVideoFunnel&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokPlacement&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokAdOverview&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokConversions&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokDayOfWeek&${params}`).then(r => r.json()),
      fetch(`${API}?type=tiktokDevice&${params}`).then(r => r.json()),
      fetch(`${API}?type=frequency&${params}`).then(r => r.json()),
    ]).then(([kpi, prevKpi, vidKpi, brandOv, brandTr, cam, ag, geoData, vidFn, plcmt, adData, conv, dow, device, freq]) => {
      setKpiData(kpi.data?.[0] || {});
      setPrevKpiData(prevKpi.data?.[0] || null);
      setVideoKPIData(vidKpi.data?.[0] || {});
      setBrandOverview(brandOv.data || []);
      setBrandTrend(brandTr.data || []);
      setCampaigns(cam.data || []);
      setAgeGender(ag.data || []);
      setGeo(geoData.data || []);
      setVideoFunnel(vidFn.data || []);
      setPlacement(plcmt.data || []);
      setAds(adData.data || []);
      setConversions(conv.data || []);
      setDayOfWeek(dow.data || []);
      setDeviceData(device.data || []);
      setFrequencyData(freq.data || []);
      setLoading(false);
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, [startDate, endDate, brandFilter]);

  // ─── Derived KPIs ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!kpiData) return null;
    const s = Number(kpiData.total_spend) || 0;
    const i = Number(kpiData.total_impressions) || 0;
    const c = Number(kpiData.total_clicks) || 0;
    const v2s = Number(kpiData.total_video_2s) || 0;
    const v6s = Number(kpiData.total_video_6s) || 0;
    const vplays = Number(kpiData.total_video_play) || 0;
    const conv = Number(kpiData.total_conversions) || 0;
    const p25 = Number(kpiData.total_p25) || 0;
    const p50 = Number(kpiData.total_p50) || 0;
    const p75 = Number(kpiData.total_p75) || 0;
    const p100 = Number(kpiData.total_p100) || 0;

    return {
      spend: s,
      impressions: i,
      clicks: c,
      ctr: i > 0 ? ((c / i) * 100).toFixed(2) : '0.00',
      cpc: c > 0 ? (s / c).toFixed(2) : '0.00',
      cpm: i > 0 ? ((s / i) * 1000).toFixed(2) : '0.00',
      video2s: v2s,
      video6s: v6s,
      videoPlays: vplays,
      video6sRate: v2s > 0 ? ((v6s / v2s) * 100).toFixed(1) : '0.0',
      p25, p50, p75, p100,
      conversions: conv,
      conversionRate: i > 0 ? ((conv / i) * 100).toFixed(3) : '0.000',
    };
  }, [kpiData]);

  const prevKpis = useMemo(() => {
    if (!prevKpiData) return null;
    const s = Number(prevKpiData.total_spend) || 0;
    const i = Number(prevKpiData.total_impressions) || 0;
    const c = Number(prevKpiData.total_clicks) || 0;
    const v2s = Number(prevKpiData.total_video_2s) || 0;
    const v6s = Number(prevKpiData.total_video_6s) || 0;
    const vplays = Number(prevKpiData.total_video_play) || 0;
    const conv = Number(prevKpiData.total_conversions) || 0;

    return {
      spend: s,
      impressions: i,
      clicks: c,
      ctr: i > 0 ? ((c / i) * 100).toFixed(2) : '0.00',
      cpc: c > 0 ? (s / c).toFixed(2) : '0.00',
      cpm: i > 0 ? ((s / i) * 1000).toFixed(2) : '0.00',
      video2s: v2s,
      video6s: v6s,
      videoPlays: vplays,
      video6sRate: v2s > 0 ? ((v6s / v2s) * 100).toFixed(1) : '0.0',
      conversions: conv,
      conversionRate: i > 0 ? ((conv / i) * 100).toFixed(3) : '0.000',
    };
  }, [prevKpiData]);

  // ─── Brand Trend Chart Data ──────────────────────────────────────────────────
  const trendChartData = useMemo(() => {
    const byDate = {};
    brandTrend.forEach(row => {
      const d = String(row.DATE?.value || row.DATE || row.date || '');
      if (!byDate[d]) byDate[d] = { date: d };
      const label = BRAND_LABELS[row.account_name] || row.account_name?.split('//').pop()?.trim() || 'Unknown';
      byDate[d][label] = Number(row.spend) || 0;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [brandTrend]);

  // ─── Brand Donut Data ─────────────────────────────────────────────────────────
  const brandDonutData = useMemo(() => {
    return brandOverview.map(d => {
      const label = BRAND_LABELS[d.account_name] || d.account_name?.split('//').pop()?.trim() || 'Unknown';
      return {
        name: label,
        value: Number(d.spend) || 0,
        color: BRAND_COLORS[label] || '#FF0050',
        impressions: Number(d.impressions) || 0,
        clicks: Number(d.clicks) || 0,
        video2s: Number(d.video_2s) || 0,
      };
    });
  }, [brandOverview]);

  // ─── Video Funnel Chart Data ─────────────────────────────────────────────────
  const videoFunnelChartData = useMemo(() => {
    if (!videoKPIData) return [];
    return [
      { name: '2s Views', value: Number(videoKPIData.total_video_2s) || 0, color: '#FF0050' },
      { name: '6s Views', value: Number(videoKPIData.total_video_6s) || 0, color: '#E11D48' },
      { name: '25% Play', value: Number(videoKPIData.total_p25) || 0, color: '#DB2777' },
      { name: '50% Play', value: Number(videoKPIData.total_p50) || 0, color: '#BE185D' },
      { name: '75% Play', value: Number(videoKPIData.total_p75) || 0, color: '#9D174D' },
      { name: '100% Play', value: Number(videoKPIData.total_p100) || 0, color: '#831843' },
    ];
  }, [videoKPIData]);

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{
      padding: '2rem', margin: '1rem',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: '12px', color: '#ef4444',
      fontSize: '0.9rem'
    }}>
      BigQuery Error: {error}
      <br />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        Check service account permissions or date range
      </span>
    </div>
  );

  const EmptyState = ({ message }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2.5rem', color: 'var(--text-tertiary)',
      fontSize: '0.85rem', fontStyle: 'italic'
    }}>
      {message || 'No data for this period'}
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ─── Sticky Filter Bar ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap',
        padding: '1rem 1.5rem',
        background: 'rgba(15,15,22,0.88)', backdropFilter: 'blur(12px)',
        borderRadius: '12px', border: '1px solid var(--border-color)',
        margin: '0 -0.5rem',
      }}>
        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="glass-input" style={{ height: '38px', width: '160px' }} max={endDate} />
        </div>
        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="glass-input" style={{ height: '38px', width: '160px' }} min={startDate} />
        </div>
        <div style={{ height: '38px', width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />
        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Brand</label>
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="glass-select" style={{ height: '38px', minWidth: '200px' }}>
            <option value="all">All Brands</option>
            <option value="EJI // Hanasui // SKINCARE">Skincare</option>
            <option value="EJI // Hanasui // DECORATIVE">Decorative</option>
            <option value="EJI // Hanasui // BODYCARE">Bodycare</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {[{ label: '7D', days: 7 }, { label: '14D', days: 14 }, { label: '30D', days: 30 }].map(q => (
            <button key={q.label} onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setDate(end.getDate() - q.days + 1);
              setEndDate(end.toISOString().split('T')[0]);
              setStartDate(start.toISOString().split('T')[0]);
            }}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Loading ─────────────────────────────────────────────────────────── */}
      {loading && <LoadingState />}

      {/* ─── KPI Cards ────────────────────────────────────────────────────────── */}
      {!loading && kpis && <TikTokKPICards kpis={kpis} prevKpis={prevKpis} />}

      {/* ─── Quick Insights 2x2 Grid ───────────────────────────────────────────── */}
      {!loading && (
        <TikTokQuickInsights
          trendData={trendChartData}
          brandDonutData={brandDonutData}
          placement={placement}
          conversions={conversions}
          brandColors={BRAND_COLORS}
        />
      )}

      {/* ─── Tabbed Detail Sections ───────────────────────────────────────────── */}
      {!loading && (
        <SectionTabs activeTab={activeTab} onTabChange={setActiveTab}>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {trendChartData.length > 0 ? (
                <Section title="Spend Trend" subtitle="Daily spend over time">
                  <TikTokSpendTrend data={trendChartData} brandColors={BRAND_COLORS} />
                </Section>
              ) : <EmptyState message="No trend data for this period" />}
              {brandDonutData.length > 0 ? (
                <Section title="Brand Distribution" subtitle="Spend by brand">
                  <TikTokBrandDonut data={brandDonutData} />
                </Section>
              ) : <EmptyState message="No brand data for this period" />}
            </div>
          )}

          {/* Video tab */}
          {activeTab === 'video' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {videoFunnelChartData.some(d => d.value > 0) ? (
                <Section title="Video Funnel" subtitle="2s → 6s → 25% → 50% → 75% → 100%">
                  <TikTokVideoFunnel data={videoFunnelChartData} />
                </Section>
              ) : <EmptyState message="No video data for this period" />}
              {videoFunnel.length > 0 ? (
                <Section title="Top Video Creatives" subtitle="By 2-second views">
                  <TikTokVideoTopTable data={videoFunnel} brandLabels={BRAND_LABELS} brandColors={BRAND_COLORS} />
                </Section>
              ) : <EmptyState message="No video creatives for this period" />}
            </div>
          )}

          {/* Campaigns tab */}
          {activeTab === 'campaigns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {campaigns.length > 0 ? (
                <Section title="Campaign Performance" subtitle={`${campaigns.length} campaigns`}>
                  <TikTokCampaignTable data={campaigns} brandLabels={BRAND_LABELS} brandColors={BRAND_COLORS} />
                </Section>
              ) : <EmptyState message="No campaign data for this period" />}
              {ads.length > 0 ? (
                <Section title="Ad Creative Preview" subtitle="Top ads with thumbnail & ad text">
                  <TikTokAdCreativePreview data={ads.slice(0, 20)} brandLabels={BRAND_LABELS} />
                </Section>
              ) : <EmptyState message="No ad data for this period" />}
              {conversions.length > 0 ? (
                <Section title="Campaign Objective Breakdown" subtitle="By campaign objective">
                  <TikTokCampaignObjective data={conversions} brandColors={BRAND_COLORS} />
                </Section>
              ) : <EmptyState message="No objective data for this period" />}
            </div>
          )}

          {/* Audience tab */}
          {activeTab === 'audience' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {ageGender.length > 0 ? (
                <Section title="Audience Demographics" subtitle="Age x Gender breakdown by spend">
                  <TikTokDemographics data={ageGender} />
                </Section>
              ) : <EmptyState message="No demographics data for this period" />}
              {frequencyData.length > 0 ? (
                <Section title="Frequency Analysis" subtitle="By advertiser">
                  <TikTokFrequency data={frequencyData} />
                </Section>
              ) : <EmptyState message="No frequency data for this period" />}
            </div>
          )}

          {/* Geo tab */}
          {activeTab === 'geo' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {geo.length > 0 ? (
                <Section title="Top Regions" subtitle="Top 20 by spend">
                  <TikTokGeoPerformance data={geo} />
                </Section>
              ) : <EmptyState message="No geo data for this period" />}
              {deviceData.length > 0 ? (
                <Section title="Device Breakdown" subtitle="iOS vs Android performance">
                  <TikTokDeviceChart data={deviceData} />
                </Section>
              ) : <EmptyState message="No device data for this period" />}
              {placement.length > 0 && (
                <Section title="Placement Breakdown" subtitle="In-feed, search, etc.">
                  <TikTokPlacementChart data={placement} />
                </Section>
              )}
            </div>
          )}

          {/* Day of week */}
          {activeTab === 'dayofweek' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {dayOfWeek.length > 0 ? (
                <Section title="Day of Week Performance" subtitle="Spend by day">
                  <TikTokDayOfWeek data={dayOfWeek} />
                </Section>
              ) : <EmptyState message="No day-of-week data for this period" />}
              {placement.length > 0 ? (
                <Section title="Placement Performance" subtitle="By placement type">
                  <TikTokPlacementChart data={placement} />
                </Section>
              ) : <EmptyState message="No placement data for this period" />}
            </div>
          )}

        </SectionTabs>
      )}
    </div>
  );
};

// ─── Tiny inline table for top video creatives (Video tab) ──────────────────
const TikTokVideoTopTable = ({ data, brandLabels, brandColors }) => {
  const fmt = (n) => n ? Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {['Ad', '2s Views', '6s Views', 'Video Plays', 'Spend'].map(h => (
              <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => {
            const label = brandLabels[row.account_name] || row.account_name?.split('//').pop()?.trim() || 'Unknown';
            return (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '0.65rem', color: brandColors[label] || '#FF0050', fontWeight: 700 }}>{label}</span>
                  <br />
                  <span style={{ color: 'var(--text-secondary)' }}>{row.AD_NAME}</span>
                </td>
                <td style={{ padding: '0.5rem 0.75rem', color: '#FF0050', fontWeight: 700 }}>{fmt(row.video_2s)}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: '#E11D48' }}>{fmt(row.video_6s)}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}>{fmt(row.video_plays)}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{fmt(row.spend)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const TikTokDashboard = () => (
  <TikTokDashboardErrorBoundary>
    <TikTokDashboardInner />
  </TikTokDashboardErrorBoundary>
);