import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Users, MapPin, Smartphone, Instagram } from 'lucide-react';

const API = '/api/bigquery';

const AGE_ORDER = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtRp(n) {
  if (!n) return 'Rp0';
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}K`;
  return `Rp${n}`;
}

const KPICard = ({ icon, label, value, sub }) => (
  <div className="glass-panel kpi-card" style={{ padding: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <div style={{ padding: '6px', background: 'rgba(79,70,229,0.1)', borderRadius: '6px', color: 'var(--accent-primary)' }}>{icon}</div>
    </div>
    <div style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.2)' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: '0.85rem', color: p.color, fontWeight: 600 }}>
          {p.name}: {p.name === 'Spend' ? fmtRp(p.value) : fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

// Heatmap cell — intensity based on spend relative to max
const HeatCell = ({ spend, maxSpend, age, gender }) => {
  const intensity = maxSpend > 0 ? spend / maxSpend : 0;
  const bg = intensity > 0
    ? `rgba(79,70,229,${Math.max(0.07, intensity * 0.85)})`
    : 'rgba(255,255,255,0.02)';
  const textColor = intensity > 0.6 ? '#fff' : intensity > 0.3 ? '#c7d2fe' : 'var(--text-tertiary)';
  return (
    <div
      title={`${age} ${gender}: ${fmtRp(spend)}`}
      style={{
        background: bg, borderRadius: '6px', padding: '0.5rem 0.25rem',
        textAlign: 'center', transition: 'all 0.2s', cursor: 'default',
        border: '1px solid rgba(79,70,229,0.1)'
      }}
    >
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: textColor }}>{fmtRp(spend)}</div>
    </div>
  );
};

const PLAT_COLORS = { instagram: '#4F46E5', facebook: '#1877F2', audience_network: '#10B981', threads: '#94A3B8' };
const PLAT_LABELS = { instagram: 'Instagram', facebook: 'Facebook', audience_network: 'Audience Network', threads: 'Threads' };

export const AudienceIntelligence = ({ start, end, account }) => {
  const [ageGender, setAgeGender] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [geo, setGeo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = `start=${start}&end=${end}&account=${encodeURIComponent(account)}`;
    Promise.all([
      fetch(`${API}?type=ageGender&${params}`).then(r => r.json()),
      fetch(`${API}?type=platform&${params}`).then(r => r.json()),
      fetch(`${API}?type=geo&${params}`).then(r => r.json()),
    ]).then(([ag, pl, g]) => {
      setAgeGender(ag.data || []);
      setPlatforms(pl.data || []);
      setGeo(g.data || []);
      setLoading(false);
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, [start, end, account]);

  // KPIs
  const kpis = useMemo(() => {
    if (!ageGender.length) return { domAge: '-', domGender: '-' };
    const byAge = {};
    ageGender.forEach(d => {
      if (!byAge[d.AGE]) byAge[d.AGE] = 0;
      byAge[d.AGE] += d.spend || 0;
    });
    const domAge = Object.entries(byAge).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    const byGender = {};
    ageGender.forEach(d => {
      if (d.GENDER === 'unknown') return;
      if (!byGender[d.GENDER]) byGender[d.GENDER] = 0;
      byGender[d.GENDER] += d.spend || 0;
    });
    const domGender = Object.entries(byGender).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { domAge, domGender };
  }, [ageGender]);

  const topRegion = geo[0]?.REGION || '-';
  const topPlatform = platforms[0];
  const totalPlatSpend = platforms.reduce((s, p) => s + (p.spend || 0), 0);
  const topPlatPct = topPlatform && totalPlatSpend > 0
    ? Math.round((topPlatform.spend / totalPlatSpend) * 100)
    : 0;

  // Heatmap data structure
  const heatData = useMemo(() => {
    const map = {};
    ageGender.forEach(d => {
      const age = d.AGE; const gender = d.GENDER;
      if (!map[age]) map[age] = {};
      map[age][gender] = (map[age][gender] || 0) + (d.spend || 0);
    });
    return map;
  }, [ageGender]);

  const maxHeatSpend = useMemo(() => {
    let max = 0;
    Object.values(heatData).forEach(row => Object.values(row).forEach(v => { if (v > max) max = v; }));
    return max;
  }, [heatData]);

  // Platform bar chart data
  const platChartData = platforms
    .filter(p => p.PUBLISHER_PLATFORM !== 'unknown')
    .map(p => ({
      name: PLAT_LABELS[p.PUBLISHER_PLATFORM] || p.PUBLISHER_PLATFORM,
      Spend: p.spend || 0,
      CPM: p.impressions > 0 ? Math.round((p.spend / p.impressions) * 1000) : 0,
      key: p.PUBLISHER_PLATFORM,
    }));

  // Geo bar chart
  const geoChartData = geo.map(g => ({
    name: g.REGION?.replace(' Province', '').replace(', Indonesia', ''),
    Spend: g.spend || 0,
    Impressions: g.impressions || 0,
  }));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-secondary)' }}>
      Loading audience data...
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444' }}>
      Error: {error}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard icon={<Users size={16} />} label="Top Age Group" value={kpis.domAge} sub="Highest spend segment" />
        <KPICard icon={<Users size={16} />} label="Top Gender" value={kpis.domGender === 'female' ? 'Female' : kpis.domGender === 'male' ? 'Male' : kpis.domGender} sub="By spend" />
        <KPICard icon={<MapPin size={16} />} label="Top Region" value={topRegion?.split(',')[0] || '-'} sub={fmtRp(geo[0]?.spend)} />
        <KPICard icon={<Instagram size={16} />} label="Top Platform" value={PLAT_LABELS[topPlatform?.PUBLISHER_PLATFORM] || '-'} sub={`${topPlatPct}% of total spend`} />
      </div>

      {/* Heatmap + Platform split */}
      <div className="charts-grid">
        {/* Age × Gender Heatmap */}
        <div className="glass-panel chart-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Age × Gender — Spend Heatmap
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.25rem' }}>
            Darker = higher spend
          </p>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 1fr 1fr', gap: '6px', marginBottom: '6px' }}>
            <div />
            {['Female', 'Male', 'Unknown'].map(g => (
              <div key={g} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g}</div>
            ))}
          </div>
          {AGE_ORDER.map(age => (
            <div key={age} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 1fr 1fr', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{age}</div>
              {['female', 'male', 'unknown'].map(gender => (
                <HeatCell
                  key={gender}
                  spend={heatData[age]?.[gender] || 0}
                  maxSpend={maxHeatSpend}
                  age={age}
                  gender={gender}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Platform split */}
        <div className="glass-panel chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Spend by Platform
            </h3>
            <div style={{ minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={platChartData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={v => fmtRp(v)} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Spend" name="Spend" radius={[0, 4, 4, 0]}>
                    {platChartData.map((d, i) => (
                      <Cell key={i} fill={PLAT_COLORS[d.key] || '#4F46E5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CPM per platform mini table */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>CPM by Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {platChartData.map((p) => (
                <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PLAT_COLORS[p.key] || '#4F46E5' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{fmtRp(p.CPM)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Geo chart */}
      <div className="glass-panel chart-container">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
          Top 15 Regions — Spend & Impressions
        </h3>
        <div style={{ minHeight: '380px' }}>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={geoChartData} layout="vertical" barGap={4} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} tickFormatter={v => fmtRp(v)} />
              <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
              <Bar dataKey="Spend" name="Spend" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Impressions" name="Impressions" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
