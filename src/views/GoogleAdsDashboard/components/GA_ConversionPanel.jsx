import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const ACCENT = '#4285F4';
const GREEN  = '#34A853';

const CONV_COLORS = ['#34A853', '#4285F4', '#FBBC04', '#EA4335', '#8B5CF6', '#06B6D4'];
const DEVICE_COLORS = { MOBILE: '#4285F4', DESKTOP: '#34A853', TABLET: '#FBBC04', OTHER: '#6B7280' };

function fmtIDR(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function fmtNum(n) {
  if (n == null) return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function KPICard({ label, value, sub, color }) {
  return (
    <div className="glass-panel" style={{ padding: '0.9rem 1rem' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem' }}>
      <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color, margin: '2px 0' }}>
          {p.name}: <strong>{Number(p.value).toFixed(1)}</strong>
        </p>
      ))}
    </div>
  );
}

export function GA_ConversionPanel({ convData }) {
  const allRows = convData || [];

  // KPI aggregates
  const kpi = useMemo(() => {
    let totalConv = 0, totalValue = 0, totalEstCross = 0, totalViewThrough = 0;
    allRows.forEach(r => {
      totalConv      += Number(r.conversions || 0);
      totalValue     += Number(r.conversion_value || 0);
      totalEstCross  += Number(r.est_cross_device || 0);
      totalViewThrough += Number(r.view_through || 0);
    });
    return { totalConv, totalValue, totalEstCross, totalViewThrough };
  }, [allRows]);

  // By conv type
  const byType = useMemo(() => {
    const map = {};
    allRows.forEach(r => {
      const t = r.CONVERSION_TYPE_NAME || r.conversion_type_name || 'Other';
      if (!map[t]) map[t] = { name: t, conversions: 0, value: 0 };
      map[t].conversions += Number(r.conversions || 0);
      map[t].value       += Number(r.conversion_value || 0);
    });
    return Object.values(map).sort((a, b) => b.conversions - a.conversions);
  }, [allRows]);

  // By device
  const byDevice = useMemo(() => {
    const map = {};
    allRows.forEach(r => {
      const d = r.DEVICE || r.device || 'OTHER';
      if (!map[d]) map[d] = { name: d, conversions: 0 };
      map[d].conversions += Number(r.conversions || 0);
    });
    return Object.values(map).filter(r => r.conversions > 0).sort((a, b) => b.conversions - a.conversions);
  }, [allRows]);

  // By campaign (top 10)
  const byCampaign = useMemo(() => {
    const map = {};
    allRows.forEach(r => {
      const c = r.CAMPAIGN_NAME || r.campaign_name || 'Unknown';
      if (!map[c]) map[c] = { name: c, conversions: 0, value: 0 };
      map[c].conversions += Number(r.conversions || 0);
      map[c].value       += Number(r.conversion_value || 0);
    });
    return Object.values(map).sort((a, b) => b.conversions - a.conversions).slice(0, 10);
  }, [allRows]);

  const maxCampConv = byCampaign[0]?.conversions || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <KPICard label="Total Conversions"  value={Number(kpi.totalConv).toFixed(1)}     color={GREEN} />
        <KPICard label="Total Conv. Value"  value={`IDR ${fmtIDR(kpi.totalValue)}`}      color={ACCENT} sub="Estimated revenue" />
        <KPICard label="Est. Cross-Device"  value={Number(kpi.totalEstCross).toFixed(1)} color="#FBBC04" sub="Estimated cross-device convs." />
        <KPICard label="View-Through"       value={Number(kpi.totalViewThrough).toFixed(1)} color="#8B5CF6" sub="View-through conversions" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
        {/* Conversion type bar */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
            By Conversion Type
          </p>
          {byType.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byType} margin={{ left: 0, right: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.replace(/_/g, ' ').substring(0, 15)} />
                  <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="conversions" name="Conversions" radius={[3, 3, 0, 0]} barSize={32}>
                    {byType.map((_, idx) => <Cell key={idx} fill={CONV_COLORS[idx % CONV_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {byType.map((row, idx) => (
                  <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.62rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '2px', background: CONV_COLORS[idx % CONV_COLORS.length] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{row.name.replace(/_/g, ' ')}</span>
                    <strong style={{ color: CONV_COLORS[idx % CONV_COLORS.length] }}>{Number(row.conversions).toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.8rem' }}>No data</div>
          )}
        </div>

        {/* Device donut */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
            Conv. by Device
          </p>
          {byDevice.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={byDevice.map(d => ({ name: d.name, value: d.conversions }))}
                    cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" stroke="none">
                    {byDevice.map((entry, i) => <Cell key={i} fill={DEVICE_COLORS[entry.name] || '#6B7280'} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [Number(v).toFixed(1) + ' conv.', '']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '0.5rem' }}>
                {byDevice.map(row => {
                  const color = DEVICE_COLORS[row.name] || '#6B7280';
                  const total = byDevice.reduce((s, r) => s + r.conversions, 0);
                  const pct = total > 0 ? Math.round(row.conversions / total * 100) : 0;
                  return (
                    <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.62rem' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{row.name}</span>
                      <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>{Number(row.conversions).toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.8rem' }}>No data</div>
          )}
        </div>
      </div>

      {/* Top campaigns by conversions */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
          Top Campaigns by Conversions
        </p>
        {byCampaign.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {byCampaign.map((row, idx) => {
              const barW = `${(row.conversions / maxCampConv) * 100}%`;
              const color = CONV_COLORS[idx % CONV_COLORS.length];
              return (
                <div key={row.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '1rem' }}>{row.name}</span>
                    <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.68rem', color: GREEN, fontWeight: 700 }}>{Number(row.conversions).toFixed(1)} conv</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>IDR {fmtIDR(row.value)}</span>
                    </div>
                  </div>
                  <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: barW, background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '1rem', fontSize: '0.8rem' }}>No data</div>
        )}
      </div>
    </div>
  );
}
