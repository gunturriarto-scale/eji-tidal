import React, { useState } from 'react';
import { BarChart2, Play, Store, FileText, MapPin, Smartphone } from 'lucide-react';

const TABS = [
  { id: 'audience', label: 'Audience', icon: <BarChart2 size={14} /> },
  { id: 'video', label: 'Video', icon: <Play size={14} /> },
  { id: 'channel', label: 'Channel', icon: <Store size={14} /> },
  { id: 'campaigns', label: 'Campaigns', icon: <FileText size={14} /> },
  { id: 'geo', label: 'Geo', icon: <MapPin size={14} /> },
  { id: 'device', label: 'Device', icon: <Smartphone size={14} /> },
];

export const SectionTabs = ({ activeTab, onTabChange, children }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid',
              ...(activeTab === tab.id ? {
                background: 'rgba(79,70,229,0.15)',
                borderColor: 'rgba(79,70,229,0.4)',
                color: 'var(--accent-primary)',
              } : {
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'transparent',
                color: 'var(--text-tertiary)',
              })
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
};

// Tab content components - wrap each section
export const TabAudience = ({ demographics, frequency }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
    {demographics}
    {frequency}
  </div>
);

export const TabVideo = ({ videoDropoff, videoPerformance }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
    {videoDropoff}
    {videoPerformance}
  </div>
);

export const TabChannel = ({ retail, product }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
    {retail}
    {product}
  </div>
);

export const TabCampaigns = ({ campaignTable, adTable }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    {campaignTable}
    {adTable}
  </div>
);

export const TabGeo = ({ geo }) => geo;

export const TabDevice = ({ device, dayOfWeek }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
    {device}
    {dayOfWeek}
  </div>
);