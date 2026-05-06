import React, { useMemo } from 'react';

const fmtRp = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

const HeatCell = ({ spend, maxSpend }) => {
  const intensity = maxSpend > 0 ? spend / maxSpend : 0;
  const bg = intensity > 0
    ? `rgba(79,70,229,${Math.max(0.05, intensity * 0.9)})`
    : 'rgba(255,255,255,0.02)';
  const textColor = intensity > 0.55 ? '#fff' : intensity > 0.25 ? '#c7d2fe' : 'var(--text-tertiary)';

  return (
    <div style={{
      background: bg,
      borderRadius: '6px',
      padding: '0.5rem 0.25rem',
      textAlign: 'center',
      border: '1px solid rgba(79,70,229,0.08)',
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: textColor }}>
        {spend > 0 ? fmtRp(spend) : '—'}
      </div>
    </div>
  );
};

export const DemographicsChart = ({ data }) => {
  // Build heatmap matrix
  const heatData = useMemo(() => {
    const map = {};
    const totals = {};
    data.forEach(d => {
      const age = d.AGE;
      const gender = d.GENDER?.toLowerCase() || 'unknown';
      if (!map[age]) map[age] = {};
      map[age][gender] = (map[age][gender] || 0) + (Number(d.spend) || 0);
      if (!totals[age]) totals[age] = 0;
      totals[age] += Number(d.spend) || 0;
    });
    // Find max for intensity
    let max = 0;
    Object.values(map).forEach(row => Object.values(row).forEach(v => { if (v > max) max = v; }));
    return { map, max, totals };
  }, [data]);

  // KPI summary
  const kpis = useMemo(() => {
    const byAge = {}; const byGender = {}; let totalSpend = 0;
    data.forEach(d => {
      totalSpend += Number(d.spend) || 0;
      if (d.AGE) { byAge[d.AGE] = (byAge[d.AGE] || 0) + (Number(d.spend) || 0); }
      if (d.GENDER && d.GENDER !== 'unknown') {
        byGender[d.GENDER] = (byGender[d.GENDER] || 0) + (Number(d.spend) || 0);
      }
    });
    const domAge = Object.entries(byAge).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const domGender = Object.entries(byGender).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return { domAge, domGender, totalSpend };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        No demographic data available
      </div>
    );
  }

  return (
    <div>
      {/* Top KPIs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Top Age Group', value: kpis.domAge },
          { label: 'Top Gender', value: kpis.domGender === 'female' ? 'Female' : kpis.domGender === 'male' ? 'Male' : kpis.domGender },
          { label: 'Total Demo Spend', value: fmtRp(kpis.totalSpend) },
        ].map((k, i) => (
          <div key={i} style={{
            flex: 1, padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {k.label}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(3, 1fr)', gap: '6px', marginBottom: '0.5rem' }}>
        <div />
        {['Female', 'Male', 'Unknown'].map(g => (
          <div key={g} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {g}
          </div>
        ))}
      </div>

      {AGE_ORDER.filter(age => heatData.map[age]).map(age => (
        <div key={age} style={{ display: 'grid', gridTemplateColumns: '56px repeat(3, 1fr)', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{age}</div>
          {['female', 'male', 'unknown'].map(gender => {
            const spend = heatData.map[age]?.[gender] || 0;
            return (
              <div key={gender}>
                {spend > 0 ? (
                  <div style={{
                    background: `rgba(79,70,229,${Math.max(0.05, (spend / heatData.max) * 0.9)})`,
                    borderRadius: '6px', padding: '0.5rem 0.25rem', textAlign: 'center',
                    border: '1px solid rgba(79,70,229,0.08)',
                  }}>
                    <div style={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: (spend / heatData.max) > 0.55 ? '#fff' : (spend / heatData.max) > 0.25 ? '#c7d2fe' : 'var(--text-tertiary)'
                    }}>
                      {fmtRp(spend)}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '6px', padding: '0.5rem 0.25rem', textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.1)' }}>—</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Age distribution bar */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Spend by Age Group
        </div>
        {Object.entries(
          Object.fromEntries(
            Object.entries(heatData.totals).sort((a, b) => b[1] - a[1])
          )
        ).slice(0, 7).map(([age, spend]) => {
          const pct = heatData.max > 0 ? (spend / heatData.max) * 100 : 0;
          return (
            <div key={age} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '40px', fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 'none', textAlign: 'right' }}>{age}</div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '4px', transition: 'width 0.4s' }} />
              </div>
              <div style={{ width: '70px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', flex: 'none', textAlign: 'right' }}>{fmtRp(spend)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};