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
        // Fallback to fetch real data from Sheets if you add your context later
        // For now, these are the force-run backdated mock updates requested
        const mockData = [
          // SKINTIFIC
          {
            timestamp: "2026-03-22T13:45:00",
            brand: "Skintific",
            platform: "Shopee",
            severity: "Major",
            updateType: "Promo Flash Sale",
            details: "[NEW PROMO DETECTED] Flash Sale 5X Ceramide Barrier Repair Moisturizer Rp 119.000 (diskon dari Rp 169.000)."
          },
          {
            timestamp: "2026-03-21T09:15:00",
            brand: "Skintific",
            platform: "Instagram",
            severity: "Minor",
            updateType: "New Post",
            details: "Postingan edukasi: 'Kenapa kulit sensitif butuh Ceramide?' Terdapat ajakan cek Shopee Mall untuk promo bundling."
          },
          {
            timestamp: "2026-03-20T16:30:00",
            brand: "Skintific",
            platform: "TikTok",
            severity: "Critical",
            updateType: "Product Launch",
            details: "Teaser peluncuran MSH Niacinamide Brightening Moisture Gel baru di TikTok Shop. Banyak interaksi dari KOL."
          },
          
          // GLAD2GLOW
          {
            timestamp: "2026-03-22T14:10:00",
            brand: "Glad2Glow",
            platform: "Shopee",
            severity: "Critical",
            updateType: "Price Drop",
            details: "[NEW PROMO DETECTED] Banting harga! Blueberry 5% Ceramide Moisturizer turun drastis ke Rp 39.000 (Flash Sale)."
          },
          {
            timestamp: "2026-03-21T11:00:00",
            brand: "Glad2Glow",
            platform: "Instagram",
            severity: "Major",
            updateType: "Bundle Promo",
            details: "Promo Payday Sale di IG Story. Bundle Moisturizer + Facial Wash cuma Rp 75.000 (Diskon 50%)."
          },
          {
            timestamp: "2026-03-19T18:20:00",
            brand: "Glad2Glow",
            platform: "TikTok",
            severity: "Minor",
            updateType: "KOL Review",
            details: "Video viral review Pomegranate 5% Niacinamide dari TikToker Skincare. View tembus 500k."
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
