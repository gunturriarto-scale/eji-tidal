import React from 'react';

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function IG_GeoTable({ geoData = [], accountId, limit = 20 }) {
  const filtered = geoData.filter(r => !accountId || accountId === 'all' || r.ACCOUNT_ID === accountId);

  // Aggregate by city
  const cityTotals = {};
  filtered.forEach(r => {
    if (!cityTotals[r.CITY]) cityTotals[r.CITY] = 0;
    cityTotals[r.CITY] += r.FOLLOWERS_COUNT || 0;
  });

  const totalFollowers = Object.values(cityTotals).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(cityTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  if (sorted.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        No geographic data available
      </div>
    );
  }

  const maxFollowers = sorted[0]?.[1] || 1;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', margin: 0 }}>
          Top {sorted.length} Cities
        </p>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
          {fmtNum(totalFollowers)} total followers tracked
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>City</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Followers</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-tertiary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>% of Total</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([city, count], idx) => {
              const pct = totalFollowers ? ((count / totalFollowers) * 100).toFixed(1) : '0';
              const barPct = (count / maxFollowers) * 100;

              return (
                <tr key={city}>
                  <td style={{ padding: '6px 8px', color: 'var(--text-tertiary)', fontWeight: 600, width: '30px' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '6px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {city}
                    {idx === 0 && <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: '#EC4899' }}>👑</span>}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fmtNum(count)}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {pct}%
                  </td>
                  <td style={{ padding: '6px 8px', minWidth: '100px' }}>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: barPct + '%',
                        background: idx === 0 ? '#EC4899' : '#8B5CF680',
                        borderRadius: '2px',
                      }} />
                    </div>
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

export { fmtNum };