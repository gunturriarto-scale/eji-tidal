import React, { useState, useEffect } from 'react';
import GoogleTrendsWidget from '../components/GoogleTrendsWidget';
import CompetitorWatch from '../components/CompetitorWatch';
import SocialListening from '../components/SocialListening';
import { supabase } from '../lib/supabase';

const CompetitorAnalysis = () => {
  const [competitorData, setCompetitorData] = useState([]);
  const [mentionsData, setMentionsData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Competitor Updates
        const { data: updates, error: errUpdates } = await supabase
          .from('competitor_updates')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(20);
          
        if (errUpdates) console.error("Error fetching updates:", errUpdates);
        
        // Format updates for UI
        const formattedUpdates = (updates || []).map(item => ({
          timestamp: new Date(item.timestamp).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          brand: item.brand,
          platform: item.platform,
          severity: item.severity,
          updateType: item.update_type,
          details: item.details
        }));

        // 2. Fetch Social Mentions (sort by insertion time to guarantee fresh data)
        const { data: mentions, error: errMentions } = await supabase
          .from('social_mentions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(40); // Only show the newly pulled region-specific data
          
        if (errMentions) console.error("Error fetching mentions:", errMentions);

        const formattedMentions = (mentions || []).map(item => ({
          platform: item.platform,
          brand: item.brand,
          date: new Date(item.posted_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
          username: item.username,
          snippet: item.snippet,
          views: item.views || 0,
          likes: item.likes || 0,
          comments: item.comments || 0,
          shares: item.shares || 0,
          url: item.url,
          raw_date: new Date(item.posted_at) // Added for internal sorting
        }));

        // Fallback mock data if DB is completely empty (just for UI preview right after creation)
        if (formattedUpdates.length === 0 && formattedMentions.length === 0) {
          formattedUpdates.push({ timestamp: new Date().toISOString(), brand: "System", platform: "System", severity: "Minor", updateType: "Initialization", details: "Database connected. Waiting for agent to sync data." });
        }

        // 3. Process Trend Data from mentions (Group by date and brand)
        // Sort mentions by raw_date desc before setting
        const sortedMentions = formattedMentions.sort((a, b) => b.raw_date - a.raw_date);

        const trends = {};
        (mentions || []).forEach(m => {
          const dateStr = new Date(m.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const key = `${m.platform}_${dateStr}`;
          if (!trends[key]) {
            trends[key] = { platform: m.platform, date: dateStr, skintific: 0, glad2glow: 0 };
          }
          if (m.brand.toLowerCase() === 'skintific') trends[key].skintific += 1;
          if (m.brand.toLowerCase() === 'glad2glow') trends[key].glad2glow += 1;
        });

        // Convert object to array and sort by date
        const formattedTrends = Object.values(trends).sort((a, b) => new Date(a.date) - new Date(b.date));

        setCompetitorData(formattedUpdates);
        setMentionsData(sortedMentions);
        setTrendData(formattedTrends);
        
      } catch (err) {
        console.error("Error loading data from Supabase:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="view-container fade-in">
      <div className="view-header">
        <h1>Market Intelligence (Supabase Edition)</h1>
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
      <SocialListening mentionsData={mentionsData} trendData={trendData} />

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center' }}>
          Data disediakan oleh Google Trends API, OpenClaw Agent, & Apify (Powered by Supabase).
        </p>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
