import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserPlus, Eye, TrendingUp } from 'lucide-react';

const COUNTRY_NAMES = {
  ID: 'Indonesia', MY: 'Malaysia', SG: 'Singapore', US: 'United States',
  TW: 'Taiwan', PH: 'Philippines', TH: 'Thailand', VN: 'Vietnam',
  AU: 'Australia', GB: 'United Kingdom', JP: 'Japan', KR: 'South Korea',
  SA: 'Saudi Arabia', AE: 'UAE', IN: 'India', CN: 'China',
  DE: 'Germany', FR: 'France', BR: 'Brazil', CA: 'Canada',
  HK: 'Hong Kong', NL: 'Netherlands', IT: 'Italy', ES: 'Spain',
  MX: 'Mexico', TR: 'Turkey', EG: 'Egypt', NG: 'Nigeria',
  PK: 'Pakistan', RU: 'Russia', AR: 'Argentina', ZA: 'South Africa',
  Others: 'Others',
};

const COUNTRY_FLAGS = {
  ID: '🇮🇩', MY: '🇲🇾', SG: '🇸🇬', US: '🇺🇸', TW: '🇹🇼',
  PH: '🇵🇭', TH: '🇹🇭', VN: '🇻🇳', AU: '🇦🇺', GB: '🇬🇧',
  JP: '🇯🇵', KR: '🇰🇷', SA: '🇸🇦', AE: '🇦🇪', IN: '🇮🇳',
  CN: '🇨🇳', DE: '🇩🇪', FR: '🇫🇷', BR: '🇧🇷', CA: '🇨🇦',
  HK: '🇭🇰', NL: '🇳🇱', IT: '🇮🇹', ES: '🇪🇸', MX: '🇲🇽',
  TR: '🇹🇷', EG: '🇪🇬', NG: '🇳🇬', PK: '🇵🇰', RU: '🇷🇺',
  AR: '🇦🇷', ZA: '🇿🇦',
};

const GENDER_COLORS = { female: '#FF0050', male: '#3B82F6', unknown: '#6B7280', undefined: '#6B7280' };
const GENDER_LABELS = { female: 'Female', male: 'Male', unknown: 'Other', undefined: 'Other' };

function fmtNum(n) {
  if (n == null || n === '') return '—';
  const v = Number(n);
  if (isNaN(v)) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

function AudienceKPICard({ icon, label, value, color, sub }) {
  return (
    <div className="glass-panel" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', fontSize: '0.72rem' }}>
      <p style={{ color: payload[0].payload.color || payload[0].fill, fontWeight: 700 }}>
        {payload[0].name}: {Number(payload[0].value).toFixed(1)}%
      </p>
    </div>
  );
}

export function TK_Demographics({ genderData, countryData, kpi }) {
  // ─── Audience KPI row ──────────────────────────────────────────────────────
  const followers = kpi?.current_followers || 0;
  const newFollowers = kpi?.total_new_followers || 0;
  const profileViews = kpi?.total_profile_views || 0;
  const engagementRate = followers > 0
    ? (((kpi?.total_likes || 0) + (kpi?.total_comments || 0) + (kpi?.total_shares || 0)) / followers * 100).toFixed(2)
    : null;

  // ─── Gender Donut ──────────────────────────────────────────────────────────
  const genderRows = (genderData || []).reduce((acc, row) => {
    const key = (row.GENDER || 'unknown').toLowerCase();
    acc[key] = (acc[key] || 0) + (row.distribution_pct || 0);
    return acc;
  }, {});

  const genderPie = Object.entries(genderRows).map(([key, val]) => ({
    name: GENDER_LABELS[key] || key,
    value: Math.round(val * 10) / 10,
    color: GENDER_COLORS[key] || '#6B7280',
  }));

  const genderTotal = genderPie.reduce((s, r) => s + r.value, 0);

  // ─── Country list ──────────────────────────────────────────────────────────
  const countryRows = (countryData || []).reduce((acc, row) => {
    const code = row.COUNTRY || 'Others';
    acc[code] = (acc[code] || 0) + (row.distribution_pct || 0);
    return acc;
  }, {});

  const countryList = Object.entries(countryRows)
    .map(([code, pct]) => ({ code, pct: Math.round(pct * 10) / 10 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 12);

  const countryTotal = countryList.reduce((s, r) => s + r.pct, 0);
  const maxPct = countryList[0]?.pct || 1;
  const COUNTRY_COLORS = ['#FF0050', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Audience KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
        <AudienceKPICard
          icon={<Users size={15} />}
          label="Total Followers"
          value={fmtNum(followers)}
          color="#7C3AED"
        />
        <AudienceKPICard
          icon={<UserPlus size={15} />}
          label="New Followers"
          value={fmtNum(newFollowers)}
          color="#06B6D4"
          sub="in selected period"
        />
        <AudienceKPICard
          icon={<TrendingUp size={15} />}
          label="Engagement Rate"
          value={engagementRate != null ? `${engagementRate}%` : '—'}
          color="#10B981"
          sub="(likes+comments+shares) / followers"
        />
        <AudienceKPICard
          icon={<Eye size={15} />}
          label="Profile Views"
          value={fmtNum(profileViews)}
          color="#FF6B35"
          sub="in selected period"
        />
      </div>

      {/* Gender + Country side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>

        {/* Gender donut */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
            Gender Distribution
          </p>

          {genderPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={genderPie} cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    dataKey="value" stroke="none"
                  >
                    {genderPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend with estimated follower counts */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {genderPie.map((entry) => {
                  const est = followers > 0 ? Math.round(entry.value / 100 * followers) : null;
                  return (
                    <div key={entry.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                        <span>{entry.name}</span>
                        <strong style={{ color: entry.color }}>{entry.value}%</strong>
                      </div>
                      {est != null && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>~{fmtNum(est)} followers</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total validation badge */}
              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <span style={{
                  fontSize: '0.6rem',
                  color: Math.abs(genderTotal - 100) < 5 ? '#10B981' : '#F59E0B',
                  background: Math.abs(genderTotal - 100) < 5 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  padding: '2px 8px', borderRadius: '4px',
                }}>
                  Total: {genderTotal.toFixed(1)}%
                </span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '2rem 0' }}>
              No gender data available
            </div>
          )}
        </div>

        {/* Country list */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', margin: 0 }}>
              Audience by Country
            </p>
            <span style={{
              fontSize: '0.6rem',
              color: Math.abs(countryTotal - 100) < 10 ? '#10B981' : '#F59E0B',
              background: Math.abs(countryTotal - 100) < 10 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
              padding: '2px 8px', borderRadius: '4px',
            }}>
              Total: {countryTotal.toFixed(1)}%
            </span>
          </div>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginBottom: '1rem', marginTop: '-0.25rem' }}>
            Latest snapshot · country is the deepest level available from TikTok API
          </p>

          {countryList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {countryList.map((row, idx) => {
                const flag = COUNTRY_FLAGS[row.code] || '🌍';
                const name = COUNTRY_NAMES[row.code] || row.code;
                const barColor = COUNTRY_COLORS[idx % COUNTRY_COLORS.length];
                const barWidth = `${(row.pct / maxPct) * 100}%`;
                const estFollowers = followers > 0 ? Math.round(row.pct / 100 * followers) : null;
                return (
                  <div key={row.code}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.85rem' }}>{flag}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{name}</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '3px' }}>{row.code}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {estFollowers != null && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>~{fmtNum(estFollowers)}</span>
                        )}
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: barColor }}>{row.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: barWidth,
                        background: barColor, borderRadius: '2px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', padding: '2rem 0' }}>
              No country data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
