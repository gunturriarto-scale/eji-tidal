import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ZAxis,
  PieChart, Pie, Sector
} from 'recharts';
import {
  DollarSign, Eye, TrendingUp, MousePointerClick, BarChart2,
  Target, Play, Clock, ShoppingCart, Users, MapPin, Instagram, Zap
} from 'lucide-react';
import { MetaKPICards } from './components/MetaKPICards';
import { SpendTrendChart } from './components/SpendTrendChart';
import { BrandDonut } from './components/BrandDonut';
import { CampaignTable } from './components/CampaignTable';
import { DemographicsChart } from './components/DemographicsChart';
import { GeoPerformance } from './components/GeoPerformance';
import { VideoPerformance } from './components/VideoPerformance';
import { PlatformBreakdown } from './components/PlatformBreakdown';
import { AdTable } from './components/AdTable';

const API = '/api/bigquery';

class MetaDashboardErrorBoundary extends React.Component {
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
          ⚠️ Dashboard render error: {this.state.error?.message}
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
  'EJI // HANASUI // SKINCARE': 'Skincare',
  'EJI // HANASUI // DECORATIVE': 'Decorative',
  'EJI // HANASUI // BODYCARE': 'Bodycare',
};
const BRAND_COLORS = {
  Skincare: '#4F46E5',
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
      border: '1px solid rgba(79,70,229,0.25)',
      background: 'rgba(20,20,29,0.95)',
      borderRadius: '8px'
    }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.85rem', color: p.color || 'var(--accent-primary)', fontWeight: 600 }}>
          {p.name}: {p.name?.includes('spend') || p.name?.includes('Spend') ? fmtRp(p.value) : fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

// ─── Loading State ─────────────────────────────────────────────────────────────
const LoadingState = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: '1rem',
    padding: '2rem'
  }}>
    {[1, 2, 3, 4].map(i => (
      <div key={i} style={{
        height: '80px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
    ))}
  </div>
);

// ─── Section Wrapper ──────────────────────────────────────────────────────────
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
const MetaDashboardInner = () => {
  // ─── Filter State ───────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [brandFilter, setBrandFilter] = useState('all');

  // ─── Data State ─────────────────────────────────────────────────────────────
  const [kpiData, setKpiData] = useState(null);
  const [brandOverview, setBrandOverview] = useState([]);
  const [brandTrend, setBrandTrend] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [platformTrend, setPlatformTrend] = useState([]);
  const [ageGender, setAgeGender] = useState([]);
  const [geo, setGeo] = useState([]);
  const [videoData, setVideoData] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = `start=${startDate}&end=${endDate}${brandFilter !== 'all' ? `&account=${encodeURIComponent(brandFilter)}` : ''}`;

    Promise.all([
      fetch(`${API}?type=kpiSummary&${params}`).then(r => r.json()),
      fetch(`${API}?type=brandOverview&start=${startDate}&end=${endDate}`).then(r => r.json()),
      fetch(`${API}?type=brandTrend&start=${startDate}&end=${endDate}`).then(r => r.json()),
      fetch(`${API}?type=topCampaigns&${params}`).then(r => r.json()),
      fetch(`${API}?type=platform&${params}`).then(r => r.json()),
      fetch(`${API}?type=platformTrend&start=${startDate}&end=${endDate}`).then(r => r.json()),
      fetch(`${API}?type=ageGender&${params}`).then(r => r.json()),
      fetch(`${API}?type=geo&${params}`).then(r => r.json()),
      fetch(`${API}?type=videoFunnel&${params}`).then(r => r.json()),
      fetch(`${API}?type=adsOverview&${params}`).then(r => r.json()),
    ]).then(([kpi, brandOv, brandTr, cam, plat, platTr, ag, geoData, vid, adData]) => {
      setKpiData(kpi.data?.[0] || {});
      setBrandOverview(brandOv.data || []);
      setBrandTrend(brandTr.data || []);
      setCampaigns(cam.data || []);
      setPlatformData(plat.data || []);
      setPlatformTrend(platTr.data || []);
      setAgeGender(ag.data || []);
      setGeo(geoData.data || []);
      setVideoData(vid.data || []);
      setAds(adData.data || []);
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
    const r = Number(kpiData.total_reach) || 0;
    const pv = Number(kpiData.total_purchase_value) || 0;
    const purchases = Number(kpiData.total_purchases) || 0;
    const vv = Number(kpiData.total_video_views) || 0;
    const tp = Number(kpiData.total_thruplay) || 0;

    return {
      spend: s,
      impressions: i,
      clicks: c,
      reach: r,
      ctr: i > 0 ? ((c / i) * 100).toFixed(2) : '0.00',
      cpc: c > 0 ? (s / c).toFixed(2) : '0.00',
      cpm: i > 0 ? ((s / i) * 1000).toFixed(2) : '0.00',
      roas: s > 0 && pv > 0 ? (pv / s).toFixed(2) : '0.00',
      purchaseValue: pv,
      purchases,
      videoViews: vv,
      thruplay: tp,
      thruplayRate: vv > 0 ? ((tp / vv) * 100).toFixed(1) : '0',
    };
  }, [kpiData]);

  // ─── Brand Trend Chart Data ──────────────────────────────────────────────────
  const trendChartData = useMemo(() => {
    const byDate = {};
    brandTrend.forEach(row => {
      const d = String(row.DATE?.value || row.DATE || row.date || '');
      if (!byDate[d]) byDate[d] = { date: d };
      const label = BRAND_LABELS[row.ACCOUNT_NAME] || row.ACCOUNT_NAME?.split('//').pop()?.trim() || 'Unknown';
      byDate[d][label] = Number(row.spend) || 0;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [brandTrend]);

  // ─── Brand Donut Data ─────────────────────────────────────────────────────────
  const brandDonutData = useMemo(() => {
    return brandOverview.map(d => {
      const label = BRAND_LABELS[d.ACCOUNT_NAME] || d.ACCOUNT_NAME?.split('//').pop()?.trim() || 'Unknown';
      return {
        name: label,
        value: Number(d.spend) || 0,
        color: BRAND_COLORS[label] || '#4F46E5',
        impressions: Number(d.impressions) || 0,
        clicks: Number(d.clicks) || 0,
        reach: Number(d.reach) || 0,
        purchaseValue: Number(d.purchase_value) || 0,
      };
    });
  }, [brandOverview]);

  // ─── Error State ─────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{
      padding: '2rem', margin: '1rem',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: '12px', color: '#ef4444',
      fontSize: '0.9rem'
    }}>
      ⚠️ BigQuery Error: {error}
      <br />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        Check service account permissions or date range
      </span>
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ─── Filter Bar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap',
        padding: '1rem 1.5rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div>
          <label style={{
            fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px'
          }}>From</label>
          <input
            type="date" value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="glass-input"
            style={{ height: '38px', width: '160px' }}
            max={endDate}
          />
        </div>
        <div>
          <label style={{
            fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px'
          }}>To</label>
          <input
            type="date" value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="glass-input"
            style={{ height: '38px', width: '160px' }}
            min={startDate}
          />
        </div>
        <div style={{ height: '38px', width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />
        <div>
          <label style={{
            fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px'
          }}>Brand</label>
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="glass-select"
            style={{ height: '38px', minWidth: '200px' }}
          >
            <option value="all">All Brands</option>
            <option value="EJI // HANASUI // SKINCARE">Skincare</option>
            <option value="EJI // HANASUI // DECORATIVE">Decorative</option>
            <option value="EJI // HANASUI // BODYCARE">Bodycare</option>
          </select>
        </div>

        {/* Quick picks */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {[
            { label: '7D', days: 7 },
            { label: '14D', days: 14 },
            { label: '30D', days: 30 },
          ].map(q => (
            <button
              key={q.label}
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - q.days + 1);
                setEndDate(end.toISOString().split('T')[0]);
                setStartDate(start.toISOString().split('T')[0]);
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px', color: 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Loading ──────────────────────────────────────────────────────────── */}
      {loading && <LoadingState />}

      {/* ─── KPI Cards ────────────────────────────────────────────────────────── */}
      {!loading && kpis && <MetaKPICards kpis={kpis} />}

      {/* ─── Charts Row 1: Spend Trend + Brand Donut ─────────────────────────── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <Section title="Spend Trend by Brand" subtitle="Daily spend over selected period">
            <SpendTrendChart data={trendChartData} brandColors={BRAND_COLORS} />
          </Section>
          <Section title="Spend by Brand" subtitle="Budget allocation">
            <BrandDonut data={brandDonutData} />
          </Section>
        </div>
      )}

      {/* ─── Platform Breakdown ────────────────────────────────────────────────── */}
      {!loading && platformData.length > 0 && (
        <Section title="Platform Performance" subtitle="Spend & efficiency by platform (IG, FB, AN, Threads)">
          <PlatformBreakdown data={platformData} trendData={platformTrend} />
        </Section>
      )}

      {/* ─���─ Demographics ─────────────────────────────────────────────────────── */}
      {!loading && ageGender.length > 0 && (
        <Section title="Audience Demographics" subtitle="Age × Gender breakdown by spend">
          <DemographicsChart data={ageGender} />
        </Section>
      )}

      {/* ─── Campaign Performance ──────────────────────────────────────────────── */}
      {!loading && campaigns.length > 0 && (
        <Section title="Campaign Performance" subtitle={`${campaigns.length} campaigns · sort by click headers`}>
          <CampaignTable data={campaigns} brandLabels={BRAND_LABELS} brandColors={BRAND_COLORS} />
        </Section>
      )}

      {/* ─── Geo + Video Row ───────────────────────────────────────────────────── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {geo.length > 0 && (
            <Section title="Top Regions" subtitle="Top 20 by spend">
              <GeoPerformance data={geo} />
            </Section>
          )}
          {videoData.length > 0 && (
            <Section title="Video Performance" subtitle="Top creatives by video views">
              <VideoPerformance data={videoData} brandLabels={BRAND_LABELS} brandColors={BRAND_COLORS} />
            </Section>
          )}
        </div>
      )}

      {/* ─── Ad Level Table ────────────────────────────────────────────────────── */}
      {!loading && ads.length > 0 && (
        <Section title="Ad Level Detail" subtitle="Top 50 ads by spend">
          <AdTable data={ads} brandLabels={BRAND_LABELS} brandColors={BRAND_COLORS} />
        </Section>
      )}
    </div>
  );
};

export const MetaDashboard = () => (
  <MetaDashboardErrorBoundary>
    <MetaDashboardInner />
  </MetaDashboardErrorBoundary>
);