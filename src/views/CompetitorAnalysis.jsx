import React, { useState, useEffect } from 'react';
import GoogleTrendsWidget from '../components/GoogleTrendsWidget';
import CompetitorWatch from '../components/CompetitorWatch';
import SocialListening from '../components/SocialListening';

const CompetitorAnalysis = () => {
  const [competitorData, setCompetitorData] = useState([]);
  const [mentionsData, setMentionsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fake data for Competitor Watch
        const mockWatchData = [
          { timestamp: "2026-03-22T13:45:00", brand: "Skintific", platform: "Shopee", severity: "Major", updateType: "Promo Flash Sale", details: "[NEW PROMO DETECTED] Flash Sale 5X Ceramide Barrier Repair Moisturizer Rp 119.000 (diskon dari Rp 169.000)." },
          { timestamp: "2026-03-21T09:15:00", brand: "Skintific", platform: "Instagram", severity: "Minor", updateType: "New Post", details: "Postingan edukasi: 'Kenapa kulit sensitif butuh Ceramide?' Terdapat ajakan cek Shopee Mall untuk promo bundling." },
          { timestamp: "2026-03-20T16:30:00", brand: "Skintific", platform: "TikTok", severity: "Critical", updateType: "Product Launch", details: "Teaser peluncuran MSH Niacinamide Brightening Moisture Gel baru di TikTok Shop. Banyak interaksi dari KOL." },
          { timestamp: "2026-03-22T14:10:00", brand: "Glad2Glow", platform: "Shopee", severity: "Critical", updateType: "Price Drop", details: "[NEW PROMO DETECTED] Banting harga! Blueberry 5% Ceramide Moisturizer turun drastis ke Rp 39.000 (Flash Sale)." },
          { timestamp: "2026-03-21T11:00:00", brand: "Glad2Glow", platform: "Instagram", severity: "Major", updateType: "Bundle Promo", details: "Promo Payday Sale di IG Story. Bundle Moisturizer + Facial Wash cuma Rp 75.000 (Diskon 50%)." },
          { timestamp: "2026-03-19T18:20:00", brand: "Glad2Glow", platform: "TikTok", severity: "Minor", updateType: "KOL Review", details: "Video viral review Pomegranate 5% Niacinamide dari TikToker Skincare. View tembus 500k." }
        ];
        
        // Mock data for Social Listening / Mentions
        const mockMentions = [];
        const platforms = ['tiktok', 'x', 'youtube'];
        const brands = ['skintific', 'glad2glow'];
        
        // Generate 25 fake rows per brand per platform to test pagination
        brands.forEach(brand => {
          platforms.forEach(platform => {
            for (let i = 1; i <= 25; i++) {
              mockMentions.push({
                platform: platform,
                brand: brand,
                date: `Mar ${Math.floor(Math.random() * 22) + 1}, 2026`,
                username: `user_${Math.floor(Math.random() * 9000) + 1000}`,
                snippet: `Pake ${brand} emang the best sih! Gak nyesel beli pas lagi promo. #skincare #review ${platform} is awesome. Beneran bikin glowing.`,
                engagement: `${Math.floor(Math.random() * 100)}k`,
                url: 'https://google.com'
              });
            }
          });
        });

        setCompetitorData(mockWatchData);
        setMentionsData(mockMentions);
      } catch (err) {
        console.error("Error loading data:", err);
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
      
      {/* Competitor Watch UI (Official Accounts) */}
      <CompetitorWatch data={competitorData} />

      {/* Social Listening UI (UGC Mentions) */}
      <SocialListening mentionsData={mentionsData} />

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center' }}>
          Data disediakan oleh Google Trends API, OpenClaw Competitor Watch Agent, & Apify Social Listeners.
        </p>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
