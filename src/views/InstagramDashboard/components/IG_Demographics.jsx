import React from 'react';

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function getIntensityColor(value, max, baseColor = '#EC4899') {
  if (!max || value === 0) return 'transparent';
  const ratio = Math.min(value / max, 1);
  const alpha = (0.08 + ratio * 0.5).toFixed(2);
  return baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

function GenderSplit({ data, accountId }) {
  const filtered = data.filter(r => !accountId || accountId === 'all' || r.ACCOUNT_ID === accountId);
  let totalFemale = 0, totalMale = 0, totalUndefined = 0;
  filtered.forEach(r => {
    if (r.GENDER === 'female') totalFemale += r.FOLLOWERS_COUNT || 0;
    else if (r.GENDER === 'male') totalMale += r.FOLLOWERS_COUNT || 0;
    else totalUndefined += r.FOLLOWERS_COUNT || 0;
  });
  const total = totalFemale + totalMale + totalUndefined;
  if (!total) return null;
  const pct = (v) => total ? ((v / total) * 100).toFixed(1) + '%' : '—';

  const rows = [
    { label: 'Female', value: totalFemale, color: '#EC4899', pct: pct(totalFemale) },
    { label: 'Male', value: totalMale, color: '#3B82F6', pct: pct(totalMale) },
    { label: 'Undefined', value: totalUndefined, color: '#6B7280', pct: pct(totalUndefined) },
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        Gender Split
      </p>
      {rows.map(({ label, value, color, pct }) => (
        <div key={label} style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              {label}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {fmtNum(value)} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({pct})</span>
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct, background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AgeGroupBar({ data, accountId }) {
  const ageGroups = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const filtered = data.filter(r => !accountId || accountId === 'all' || r.ACCOUNT_ID === accountId);

  const totals = {};
  ageGroups.forEach(ag => { totals[ag] = 0; });
  filtered.forEach(r => {
    if (totals[r.AGE] !== undefined) totals[r.AGE] += r.FOLLOWERS_COUNT || 0;
  });
  const maxTotal = Math.max(...Object.values(totals), 1);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        Age Distribution
      </p>
      {ageGroups.map((ag) => {
        const val = totals[ag];
        const pct = ((val / maxTotal) * 100).toFixed(1);
        return (
          <div key={ag} style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{ag}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fmtNum(val)}</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: pct + '%',
                background: ag === '25-34' ? '#EC4899' : '#8B5CF680',
                borderRadius: '3px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgeGenderMatrix({ data, accountId }) {
  const ageGroups = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const genders = ['female', 'male', 'undefined'];
  const genderLabels = { female: 'Female', male: 'Male', undefined: 'Undef.' };

  // Build matrix: age -> gender -> count
  const matrix = {};
  ageGroups.forEach(ag => { matrix[ag] = {}; genders.forEach(g => { matrix[ag][g] = 0; }); });

  const filtered = data.filter(r => (!accountId || accountId === 'all' || r.ACCOUNT_ID === accountId));
  filtered.forEach(r => {
    if (matrix[r.AGE]?.[r.GENDER] !== undefined) {
      matrix[r.AGE][r.GENDER] += r.FOLLOWERS_COUNT || 0;
    }
  });

  // Find max for intensity
  let maxVal = 0;
  Object.values(matrix).forEach(ageRow => {
    Object.values(ageRow).forEach(v => { if (v > maxVal) maxVal = v; });
  });

  const colorMap = { female: '#EC4899', male: '#3B82F6', undefined: '#6B7280' };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
        Age × Gender Matrix
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Age</th>
              {genders.map(g => (
                <th key={g} style={{ textAlign: 'right', padding: '6px 8px', color: colorMap[g], fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {genderLabels[g]}
                </th>
              ))}
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-primary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {ageGroups.map((ag) => {
              const rowTotal = genders.reduce((sum, g) => sum + matrix[ag][g], 0);
              const isBold = ag === '25-34';
              return (
                <tr key={ag} style={{ background: isBold ? 'rgba(236,72,153,0.04)' : 'transparent' }}>
                  <td style={{ padding: '6px 8px', fontWeight: isBold ? 700 : 400, color: isBold ? '#EC4899' : 'var(--text-secondary)' }}>
                    {ag}{isBold && <span style={{ fontSize: '0.6rem', marginLeft: '4px', color: '#EC4899' }}>★</span>}
                  </td>
                  {genders.map(g => (
                    <td key={g} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', background: getIntensityColor(matrix[ag][g], maxVal, colorMap[g]) }}>
                      {fmtNum(matrix[ag][g])}
                    </td>
                  ))}
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fmtNum(rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IG_Demographics({ ageGenderData, accountId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AgeGenderMatrix data={ageGenderData || []} accountId={accountId} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <GenderSplit data={ageGenderData || []} accountId={accountId} />
        <AgeGroupBar data={ageGenderData || []} accountId={accountId} />
      </div>
    </div>
  );
}

export { fmtNum };
