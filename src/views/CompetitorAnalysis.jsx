import React, { useState, useEffect } from 'react';
import GoogleTrendsWidget from '../components/GoogleTrendsWidget';
import CompetitorWatch from '../components/CompetitorWatch';

const CompetitorAnalysis = () => {
  const [competitorData, setCompetitorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Mock data to show the UI
        const mockData = [
          {
            timestamp: "Barusan - 13:45 WIB",
            brand: "Glad2Glow",
            platform: "Shopee",
            severity: "Major",
            updateType: "Flash Sale",
            details: "Glad2Glow baru aja pasang banner Flash Sale buat Blueberry Ceramide Moisturizer. Harga turun jadi Rp 39.000 (dari normal Rp 55.000)."
          },
          {
            timestamp: "Hari ini - 10:15 WIB",
            brand: "Skintific",
            platform: "TikTok",
            severity: "Minor",
            updateType: "Bundle Promo",
            details: "Bundle Eksklusif baru di TikTok Shop: 5X Ceramide + MSH Niacinamide dapet free mini cleanser."
          }
        ];
        
        setCompetitorData(mockData);
      } catch (err) {
        console.error("Error loading competitor watch data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h1>Market Intelligence</h1>
        <p>Real-time tracking of brand demand, search interest, and competitor activities.</p>
      </div>

      <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
        <GoogleTrendsWidget 
          keywords={["hanasui", "skintific", "glad2glow"]} 
          geo="ID" 
          time="today 12-m" 
        />
      </div>
      
      {/* Our New Competitor Watch UI */}
      <CompetitorWatch data={competitorData} />

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center' }}>
          Data disediakan oleh Google Trends API & OpenClaw Competitor Watch Agent.
        </p>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
