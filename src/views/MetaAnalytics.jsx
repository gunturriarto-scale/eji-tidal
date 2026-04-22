import React, { useState } from 'react';
import { BarChart3, Users, Film } from 'lucide-react';
import { BrandCommandCenter } from './meta/BrandCommandCenter';
import { AudienceIntelligence } from './meta/AudienceIntelligence';
import { CreativeStudio } from './meta/CreativeStudio';

const TABS = [
  { id: 'brand', label: 'Brand Command Center', icon: <BarChart3 size={16} /> },
  { id: 'audience', label: 'Audience Intelligence', icon: <Users size={16} /> },
  { id: 'creative', label: 'Creative Studio', icon: <Film size={16} /> },
];

const today = new Date().toISOString().split('T')[0];
const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];

export const MetaAnalytics = () => {
  const [activeTab, setActiveTab] = useState('brand');
  const [start, setStart] = useState(sevenDaysAgo);
  const [end, setEnd] = useState(today);
  const [account, setAccount] = useState('all');

  return (
    <div className="fade-in">
      {/* Filters bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '1.5rem', flexWrap: 'wrap'
      }}>
        <div className="filter-group" style={{ flex: 'none' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>From</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="glass-input" style={{ height: '36px' }} max={end} />
        </div>
        <div className="filter-group" style={{ flex: 'none' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>To</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="glass-input" style={{ height: '36px' }} min={start} />
        </div>
        <div className="filter-group" style={{ flex: 'none' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Account</label>
          <select value={account} onChange={e => setAccount(e.target.value)} className="glass-select" style={{ height: '36px' }}>
            <option value="all">All Accounts</option>
            <option value="EJI // HANASUI // SKINCARE">Skincare</option>
            <option value="EJI // HANASUI // DECORATIVE">Decorative</option>
            <option value="EJI // HANASUI // BODYCARE">Bodycare</option>
          </select>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '0.6rem 1.1rem',
              background: activeTab === tab.id ? 'rgba(79,70,229,0.1)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s',
              marginBottom: '-1px',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'brand' && <BrandCommandCenter start={start} end={end} />}
      {activeTab === 'audience' && <AudienceIntelligence start={start} end={end} account={account} />}
      {activeTab === 'creative' && <CreativeStudio start={start} end={end} account={account} />}
    </div>
  );
};
