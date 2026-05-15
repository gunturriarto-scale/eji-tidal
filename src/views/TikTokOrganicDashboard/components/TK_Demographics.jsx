import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COUNTRY_NAMES = {
  ID: 'Indonesia', MY: 'Malaysia', SG: 'Singapore', US: 'United States',
  TW: 'Taiwan', PH: 'Philippines', TH: 'Thailand', VN: 'Vietnam',
  AU: 'Australia', GB: 'United Kingdom', JP: 'Japan', KR: 'South Korea',
  SA: 'Saudi Arabia', AE: 'UAE', IN: 'India', CN: 'China',
  DE: 'Germany', FR: 'France', BR: 'Brazil', CA: 'Canada',
  Others: 'Others',
};

const COUNTRY_FLAGS = {
  ID: '🇮🇩', MY: '🇲🇾', SG: '🇸🇬', US: '🇺🇸', TW: '🇹🇼',
  PH: '🇵🇭', TH: '🇹🇭', VN: '🇻🇳', AU: '🇦🇺', GB: '🇬🇧',
  JP: '🇯🇵', KR: '🇰🇷', SA: '🇸🇦', AE: '🇦🇪', IN: '🇮🇳',
  CN: '🇨🇳', DE: '🇩🇪', FR: '🇫🇷', BR: '🇧🇷', CA: '🇨🇦',
};

const GENDER_COLORS = { female: '#FF0050', male: '#3B82F6', unknown: '#6B7280', undefined: '#6B7280' };
const GENDER_LABELS = { female: 'Female', male: 'Male', unknown: 'Unknown', undefined: 'Unknown' };

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

export function TK_Demographics({ genderData, countryData }) {
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

  const maxPct = countryList[0]?.pct || 1;

  const COUNTRY_COLORS = ['#FF0050', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899'];

  return (
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {genderPie.map((entry) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                  <span>{entry.name}</span>
                  <strong style={{ color: entry.color }}>{entry.value}%</strong>
                </div>
              ))}
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
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
          Audience by Country
        </p>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginBottom: '1rem', marginTop: '-0.25rem' }}>
          Country-level distribution (city data not available for TikTok organic)
        </p>

        {countryList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {countryList.map((row, idx) => {
              const flag = COUNTRY_FLAGS[row.code] || '🌍';
              const name = COUNTRY_NAMES[row.code] || row.code;
              const barColor = COUNTRY_COLORS[idx % COUNTRY_COLORS.length];
              const barWidth = `${(row.pct / maxPct) * 100}%`;
              return (
                <div key={row.code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem' }}>{flag}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{name}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '3px' }}>{row.code}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: barColor }}>{row.pct}%</span>
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
  );
}
