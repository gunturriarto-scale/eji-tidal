import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const FREQ_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const getFreqColor = (freq) => {
  if (freq <= 3) return FREQ_COLORS[0]; // Good
  if (freq <= 5) return FREQ_COLORS[1]; // Warning
  return FREQ_COLORS[2]; // Bad
};

const getFreqLabel = (freq) => {
  if (freq <= 3) return 'Optimal';
  if (freq <= 5) return 'Moderate';
  return 'Oversaturated';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const freq = payload[0]?.value || 0;
  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1rem', border: '1px solid rgba(79,70,229,0.25)', background: 'rgba(20,20,29,0.95)', borderRadius: '8px' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</p>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
        Frequency: {freq}x — <span style={{ color: getFreqColor(freq) }}>{getFreqLabel(freq)}</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
        Impressions: {fmt(payload[0]?.payload?.impressions || 0)} · Reach: {fmt(payload[0]?.payload?.reach || 0)}
      </div>
    </div>
  );
};

export const FrequencyChart = ({ data, brandColors }) => {
  const chartArr = data.map(d => ({
    brand: d.ACCOUNT_NAME?.split('//').pop()?.trim() || d.ACCOUNT_NAME,
    frequency: Number(d.frequency) || 0,
    impressions: Number(d.impressions) || 0,
    reach: Number(d.reach) || 0,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Brand</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Frequency</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Status</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Impressions</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Reach</th>
            </tr>
          </thead>
          <tbody>
            {chartArr.map(row => (
              <tr key={row.brand} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.brand}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {row.frequency}x
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                    background: getFreqColor(row.frequency) + '20',
                    color: getFreqColor(row.frequency)
                  }}>
                    {getFreqLabel(row.frequency)}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(row.impressions)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{fmt(row.reach)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartArr}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="brand" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} domain={[0, 10]} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="frequency" radius={[4, 4, 0, 0]} name="Frequency">
            {chartArr.map((row, i) => (
              <rect key={i} fill={getFreqColor(row.frequency)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {[['Optimal (≤3x)', FREQ_COLORS[0]], ['Moderate (3-5x)', FREQ_COLORS[1]], ['Oversaturated (>5x)', FREQ_COLORS[2]]].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
