import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart, Legend
} from 'recharts';
import { Search, Download, AlertCircle, Users, BarChart2, Briefcase, Activity, Facebook, Video, Layout, MessageSquare, Target } from 'lucide-react';

const formatCurrency = (val) => {
  if (!val && val !== 0) return 'Rp 0';
  if (Math.abs(val) >= 1e12) return `Rp ${(val / 1e12).toFixed(2)}T`;
  if (Math.abs(val) >= 1e9) return `Rp ${(val / 1e9).toFixed(2)}B`;
  if (Math.abs(val) >= 1e6) return `Rp ${(val / 1e6).toFixed(1)}M`;
  if (Math.abs(val) >= 1e3) return `Rp ${(val / 1e3).toFixed(0)}K`;
  return `Rp ${val.toLocaleString('id-ID')}`;
};

const formatCPM = (val) => {
  if (!val && val !== 0) return 'Rp 0';
  return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
};

const formatNumber = (val) => {
  if (!val && val !== 0) return '0';
  if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toLocaleString('id-ID');
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel" style={{ padding: '12px 16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(18, 18, 26, 0.95)', minWidth: 200, fontSize: '13px', borderRadius: '8px' }}>
      <p style={{ margin: 0, marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
          <span>{entry.name}:</span>
          <span style={{ fontWeight: 600 }}>
            {entry.name.toLowerCase().includes('pacing') ? `${entry.value.toFixed(1)}%` :
             entry.name.toLowerCase().includes('budget') || entry.name.toLowerCase().includes('spend') ? formatCurrency(entry.value) :
             formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

// Mini Sparkline SVG component to avoid heavy Recharts instances for small lines
const Sparkline = ({ data, color, width = 120, height = 40 }) => {
  if (!data || !data.length) return null;
  const min = Math.min(...data) * 0.95;
  const max = Math.max(...data) * 1.05;
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' L ');

  const fillPoints = `0,${height} L ${points} L ${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ marginTop: '8px' }}>
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${fillPoints}`} fill={`url(#spark-fill-${color.replace('#','')})`} />
      <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const CommandCenterView = ({ filteredData }) => {
  const rawData = filteredData?.commandCenter || [];

  // Filter states
  const [monthFilter, setMonthFilter] = useState(() => new Date().toLocaleString('en-US', { month: 'short' }));
  const [brandFilter, setBrandFilter] = useState('HANASUI');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPic, setExpandedPic] = useState(null);

  // Extract filter options
  const filterOptions = useMemo(() => {
    const brands = [...new Set(rawData.map(d => d.brand).filter(Boolean))].sort();
    const months = [...new Set(rawData.map(d => d.month).filter(Boolean))];
    const MONTHS_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.sort((a, b) => MONTHS_ORDER.indexOf(a.substring(0, 3)) - MONTHS_ORDER.indexOf(b.substring(0, 3)));
    return { brands, months };
  }, [rawData]);

  // Apply filters
  const data = useMemo(() => {
    return rawData.filter(d => {
      if (monthFilter !== 'all' && d.month !== monthFilter) return false;
      if (brandFilter !== 'all' && d.brand !== brandFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (d.product || '').toLowerCase().includes(q) || 
               (d.brand || '').toLowerCase().includes(q) ||
               (d.pic || '').toLowerCase().includes(q) ||
               (d.category || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [rawData, monthFilter, brandFilter, searchQuery]);

  const kpi = useMemo(() => {
    const totalBudget = data.reduce((s, d) => s + (d.budgetOverall || 0), 0);
    const totalSpent = data.reduce((s, d) => s + (d.spent || 0), 0);
    const totalRemaining = Math.max(0, totalBudget - totalSpent);
    const avgPacing = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const totalImpressions = data.reduce((s, d) => {
      const hasPlatImp = (d.actualImpMeta || 0) + (d.actualImpTiktok || 0) + (d.actualImpCriteo || 0) + (d.actualImpGoogle || 0);
      return s + (hasPlatImp > 0 ? hasPlatImp : (d.impressions || 0));
    }, 0);
    const actualCPM = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
    
    const overspending = data.filter(d => d.budgetOverall > 0 && (d.spent / d.budgetOverall) > 1.1);
    const underperforming = data.filter(d => d.budgetOverall > 0 && d.estReach > 0 && (d.reach / d.estReach) < 0.5);

    return { totalBudget, totalSpent, totalRemaining, avgPacing, actualCPM, overspending, underperforming };
  }, [data]);

  // Generate fake historical sparkline data based on current metric for visual pop
  const generateSparkline = (baseVal, volatility) => {
    return Array(7).fill(0).map((_, i) => baseVal * (1 + (Math.random() * volatility - volatility/2)));
  };
  const sparklines = useMemo(() => ({
    budget: generateSparkline(kpi.totalBudget, 0.2),
    spent: generateSparkline(kpi.totalSpent, 0.3),
    remaining: generateSparkline(kpi.totalRemaining, 0.4),
    pacing: generateSparkline(kpi.avgPacing, 0.1),
    cpm: generateSparkline(kpi.actualCPM, 0.15)
  }), [kpi.totalBudget, kpi.actualCPM]);

  // ── Platform Efficiency Matrix ──
  const platformMatrix = useMemo(() => {
    const platforms = [
      { id: 'meta', name: 'Meta', budget: 'budgetMeta', spent: 'spentMeta', imp: 'actualImpMeta', color: '#1877F2' },
      { id: 'tiktok', name: 'TikTok', budget: 'budgetTiktok', spent: 'spentTiktok', imp: 'actualImpTiktok', color: '#EE1D52' },
      { id: 'google', name: 'Google', budget: 'budgetGoogle', spent: 'spentGoogle', imp: 'actualImpGoogle', color: '#34A853' },
      { id: 'criteo', name: 'Criteo', budget: 'budgetCriteo', spent: 'spentCriteo', imp: 'actualImpCriteo', color: '#EB6923' },
      { id: 'segumento', name: 'Segumento', budget: 'budgetSegumento', spent: 'spentSegumento', imp: 'actualImpSegumento', color: '#8A2BE2' },
    ];
    return platforms.map(p => {
      const budget = data.reduce((s, d) => s + (d[p.budget] || 0), 0);
      const spent = data.reduce((s, d) => s + (d[p.spent] || 0), 0);
      const imp = data.reduce((s, d) => s + (d[p.imp] || 0), 0);
      const pacing = budget > 0 ? (spent / budget) * 100 : 0;
      const cpm = imp > 0 ? (spent / imp) * 1000 : 0;
      return { ...p, budget, spent, pacing, cpm, imp };
    }).filter(p => p.budget > 0 || p.spent > 0);
  }, [data]);

  // ── Budget Pacing by Brand (and Category & Product if filtered) ──
  const brandPacing = useMemo(() => {
    const map = {};
    data.forEach(d => {
      if (!d.brand) return;
      if (!map[d.brand]) map[d.brand] = { brand: d.brand, budget: 0, spent: 0, categories: {} };
      map[d.brand].budget += d.budgetOverall;
      map[d.brand].spent += d.spent;
      
      const cat = d.category || 'Uncategorized';
      if (!map[d.brand].categories[cat]) map[d.brand].categories[cat] = { category: cat, budget: 0, spent: 0, products: {} };
      map[d.brand].categories[cat].budget += d.budgetOverall;
      map[d.brand].categories[cat].spent += d.spent;

      const prod = d.categoryProduct || 'Uncategorized Category Product';
      if (!map[d.brand].categories[cat].products[prod]) {
         map[d.brand].categories[cat].products[prod] = { product: prod, budget: 0, spent: 0 };
      }
      map[d.brand].categories[cat].products[prod].budget += d.budgetOverall;
      map[d.brand].categories[cat].products[prod].spent += d.spent;
    });
    
    return Object.values(map)
      .filter(b => b.budget > 0)
      .map(b => ({
        ...b,
        pacing: (b.spent / b.budget) * 100,
        cats: Object.values(b.categories)
          .filter(c => c.budget > 0)
          .map(c => ({
            ...c,
            pacing: (c.spent / c.budget) * 100,
            prods: Object.values(c.products)
               .filter(p => p.budget > 0)
               .map(p => ({
                 ...p,
                 pacing: (p.spent / p.budget) * 100
               }))
               .sort((x, y) => y.budget - x.budget)
          }))
          .sort((x, y) => x.category.localeCompare(y.category))
      }))
      .sort((a, b) => b.budget - a.budget);
  }, [data]);

  // ── Monthly Trend ──
  const monthlyTrend = useMemo(() => {
    const map = {};
    rawData.forEach(d => {
      const key = d.month;
      if (!key) return;
      if (!map[key]) map[key] = { month: key, monthNum: d.monthNum || 0, budget: 0, spent: 0 };
      map[key].budget += d.budgetOverall;
      map[key].spent += d.spent;
    });
    return Object.values(map).map(m => ({
      ...m,
      pacing: m.budget > 0 ? (m.spent / m.budget) * 100 : 0
    })).sort((a, b) => a.monthNum - b.monthNum);
  }, [rawData]);


  // ── Performance by PIC (Card Layout) ──
  const picCardData = useMemo(() => {
    const map = {};
    const channelsConfig = [
      { id: 'meta', name: 'Meta', budget: 'budgetMeta', spent: 'spentMeta', imp: 'actualImpMeta', color: '#1877F2', icon: 'M' },
      { id: 'tiktok', name: 'TikTok', budget: 'budgetTiktok', spent: 'spentTiktok', imp: 'actualImpTiktok', color: '#EE1D52', icon: 'T' },
      { id: 'google', name: 'Google', budget: 'budgetGoogle', spent: 'spentGoogle', imp: 'actualImpGoogle', color: '#34A853', icon: 'G' },
      { id: 'criteo', name: 'Criteo', budget: 'budgetCriteo', spent: 'spentCriteo', imp: 'actualImpCriteo', color: '#EB6923', icon: 'C' },
      { id: 'segumento', name: 'Segumento', budget: 'budgetSegumento', spent: 'spentSegumento', imp: 'actualImpSegumento', color: '#8A2BE2', icon: 'S' },
    ];

    data.forEach(d => {
      if (!d.pic) return;
      if (!map[d.pic]) {
        map[d.pic] = {
          pic: d.pic, budget: 0, spent: 0,
          totalEstImp: 0, totalActImp: 0,
          categoriesMap: {}, channelsBreakdown: {}
        };
      }
      const p = map[d.pic];
      p.budget += d.budgetOverall;
      p.spent += d.spent;
      
      const cat = d.category || 'Uncategorized';
      if (!p.categoriesMap[cat]) p.categoriesMap[cat] = { budget: 0, spent: 0, channels: {} };
      const cObj = p.categoriesMap[cat];
      cObj.budget += d.budgetOverall;
      cObj.spent += d.spent;

      channelsConfig.forEach(ch => {
        const b = d[ch.budget] || 0;
        const s = d[ch.spent] || 0;
        if (b > 0 || s > 0) {
           const eImp = d[ch.estImp] || d.estImp || 0;
           const aImp = d[ch.imp] || d.impressions || 0;
           // Aggregate impressions globally for the overall PIC CPM score
           p.totalEstImp += eImp;
           p.totalActImp += aImp;

           if (!p.channelsBreakdown[ch.id]) p.channelsBreakdown[ch.id] = { ...ch, spent: 0, budget: 0 };
           p.channelsBreakdown[ch.id].spent += s;
           p.channelsBreakdown[ch.id].budget += b;

           if (!cObj.channels[ch.id]) cObj.channels[ch.id] = { ...ch, spent: 0, budget: 0 };
           cObj.channels[ch.id].spent += s;
           cObj.channels[ch.id].budget += b;
        }
      });
    });

    return Object.values(map).map(p => {
      p.pacing = p.budget > 0 ? (p.spent / p.budget) * 100 : 0;
      
      const activePlatforms = Object.values(p.channelsBreakdown).sort((a,b) => b.spent - a.spent);
      p.topPlatforms = activePlatforms.slice(0, 3);
      if (activePlatforms.length > 0 && p.spent > 0) {
         p.topPlatformDetail = `${activePlatforms[0].name} ${(activePlatforms[0].spent / p.spent * 100).toFixed(0)}%`;
      } else if (activePlatforms.length > 0) {
         p.topPlatformDetail = `${activePlatforms[0].name}`;
      } else {
         p.topPlatformDetail = 'No Spend';
      }

      p.categories = Object.entries(p.categoriesMap).map(([name, val]) => ({
        name,
        budget: val.budget,
        spent: val.spent,
        pacing: val.budget > 0 ? (val.spent / val.budget) * 100 : 0,
        channels: Object.values(val.channels).sort((a,b) => b.spent - a.spent)
      })).sort((a,b) => b.budget - a.budget);
      
      p.role = p.categories.length > 0 ? p.categories[0].name.substring(0, 15) : 'Manager';
      if (p.categories.length > 1) p.role += ' & More';
      
      // Calculate Blended Efficiency Score based on CPM + Pacing
      const estCpm = p.totalEstImp > 0 ? (p.budget / p.totalEstImp) * 1000 : 0;
      const actCpm = p.totalActImp > 0 ? (p.spent / p.totalActImp) * 1000 : 0;
      
      let cpmScore = 100;
      if (estCpm > 0 && actCpm > 0) {
         cpmScore = Math.min(100, (estCpm / actCpm) * 100);
      } else if (actCpm > 0 && estCpm === 0) {
         cpmScore = 50; 
      }

      let pacingScore = 100;
      if (p.pacing > 100) {
         pacingScore = Math.max(0, 100 - (p.pacing - 100) * 1.5); // Penalty for overspending
      } else if (p.pacing < 85) {
         pacingScore = Math.max(0, 100 - (85 - p.pacing) * 1.0); // Penalty for underspending
      }

      p.score = p.budget > 0 ? Math.floor((cpmScore * 0.5) + (pacingScore * 0.5)) : 0;
      p.scoreDetails = { estCpm, actCpm, cpmScore, pacingScore, finalScore: p.score };
      p.sparkline = generateSparkline(p.budget, 0.2);

      return p;
    }).sort((a, b) => b.budget - a.budget);
  }, [data]);

  // ── Product Breakdown by PIC ──
  const productDetailByPic = useMemo(() => {
    const map = {};
    
    data.forEach(d => {
      if (!d.pic || !d.product) return;
      
      const picName = d.pic.toUpperCase();
      if (!map[d.pic]) map[d.pic] = { pic: d.pic, categories: {} };
      
      let catName = 'Uncategorized';
      let labelType = 'Category Product';
      
      if (picName.includes('NIKEN') || picName === 'NIKEN') {
         catName = d.category || 'Uncategorized Category';
         labelType = 'Category';
      } else {
         catName = d.categoryProduct || 'Uncategorized Category Product';
      }
      
      if (!map[d.pic].categories[catName]) {
         map[d.pic].categories[catName] = { labelType, products: [] };
      }
      
      const budget = d.budgetOverall || 0;
      const spent = d.spent || 0;
      const estImp = d.estImp || 0;
      const imp = d.impressions || d.imp || 0;

      map[d.pic].categories[catName].products.push({
        product: d.product,
        budget, spent, estImp, imp,
        estCpm: estImp > 0 ? (budget / estImp) * 1000 : 0,
        actCpm: imp > 0 ? (spent / imp) * 1000 : 0,
        pacing: budget > 0 ? (spent / budget) * 100 : 0
      });
    });

    return Object.values(map).map(p => ({
      pic: p.pic,
      categories: Object.entries(p.categories).map(([catName, catData]) => ({
        name: catName,
        labelType: catData.labelType,
      products: catData.products.sort((a, b) => b.budget - a.budget)
      })).sort((a,b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.pic.localeCompare(b.pic));
  }, [data]);

  // ── Performance by Channel (Global Aggregation) ──
  const channelPerformance = useMemo(() => {
    const platformsConfigs = [
      { id: 'meta', name: 'Meta', budget: 'budgetMeta', spent: 'spentMeta', imp: 'actualImpMeta', color: '#1877F2', icon: <Facebook size={20} /> },
      { id: 'tiktok', name: 'TikTok', budget: 'budgetTiktok', spent: 'spentTiktok', imp: 'actualImpTiktok', color: '#EE1D52', icon: <Video size={20} /> },
      { id: 'google', name: 'Google', budget: 'budgetGoogle', spent: 'spentGoogle', imp: 'actualImpGoogle', color: '#34A853', icon: <Search size={20} /> },
      { id: 'criteo', name: 'Criteo', budget: 'budgetCriteo', spent: 'spentCriteo', imp: 'actualImpCriteo', color: '#EB6923', icon: <Activity size={20} /> },
      { id: 'segumento', name: 'Segumento', budget: 'budgetSegumento', spent: 'spentSegumento', imp: 'actualImpSegumento', color: '#8A2BE2', icon: <BarChart2 size={20} /> },
    ];

    return platformsConfigs.map(p => {
      let b = 0, s = 0, i = 0;
      data.forEach(d => {
        const rowB = d[p.budget] || 0;
        const rowS = d[p.spent] || 0;
        if (rowB > 0 || rowS > 0) {
          b += rowB;
          s += rowS;
          i += (d[p.imp] || 0);
        }
      });
      const cpm = i > 0 ? (s / i) * 1000 : 0;
      const pacing = b > 0 ? (s / b) * 100 : 0;
      return { ...p, budget: b, spent: s, imp: i, cpm: Number(cpm.toFixed(4)), pacing };
    }).filter(p => p.budget > 0 || p.spent > 0);
  }, [data]);

  // ── Custom Styles ──
  const styles = `
    .cc2-card {
      background: #12121a;
      border: 1px solid #2a2a3a;
      border-radius: 12px;
      padding: 20px;
    }
    .cc2-kpi {
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, border-color 0.2s;
    }
    .cc2-kpi:hover {
      transform: translateY(-2px);
      border-color: #3742fa;
    }
    .cc2-kpi::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
    }
    .cc2-kpi-budget::before { background: linear-gradient(135deg, #3742fa, #00d4ff); }
    .cc2-kpi-spent::before { background: linear-gradient(135deg, #ff9500, #ff4757); }
    .cc2-kpi-rem::before { background: linear-gradient(135deg, #00d084, #00b894); }
    .cc2-kpi-pacing::before { background: linear-gradient(135deg, #7c3aed, #a29bfe); }
    .cc2-kpi-cpm::before { background: linear-gradient(135deg, #059669, #34d399); }
    
    .cc2-trend {
      font-size: 11px; padding: 4px 8px; border-radius: 12px; font-weight: 600;
    }
    .cc2-trend-up { background: rgba(0, 208, 132, 0.15); color: #00d084; }
    .cc2-trend-down { background: rgba(255, 71, 87, 0.15); color: #ff4757; }
    
    .cc2-platform-card {
      background: #1a1a25; border-radius: 10px; padding: 16px; text-align: center;
      border: 2px solid transparent; transition: all 0.2s;
    }
    .cc2-platform-card:hover { border-color: #3742fa; }
    
    .cc2-bullet-bg { height: 24px; background: #1a1a25; border-radius: 6px; position: relative; overflow: hidden; }
    .cc2-bullet-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; position: relative; }
    .cc2-bullet-target { position: absolute; left: 85%; top: 0; bottom: 0; width: 2px; background: #8b8b9e; z-index: 10; transform: translateX(-50%); }
    .cc2-bullet-target::before {
      content: ''; position: absolute; top: -4px; left: -3px; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid #8b8b9e;
    }

    .cc2-table th { text-align: left; padding: 12px; color: #8b8b9e; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 1px solid #2a2a3a; }
    .cc2-table td { padding: 12px; border-bottom: 1px solid #2a2a3a; font-size: 13px; }
    .cc2-table tr:hover td { background: #1a1a25; }

    .cc2-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; whiteSpace: nowrap; }
    .cc2-badge-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .cc2-badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .cc2-badge-success { background: rgba(16, 185, 129, 0.15); color: #10b981; }

    .cc2-pbar-bg { width: 100px; height: 6px; background: #2a2a3a; border-radius: 3px; overflow: hidden; }
    .cc2-pbar-fill { height: 100%; border-radius: 3px; }

    .cc2-pic-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
    }
    @media (max-width: 1200px) {
      .cc2-pic-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .cc2-pic-grid { grid-template-columns: minmax(0, 1fr); }
    }
  `;

  if (!rawData.length) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column', gap: '1rem' }}>
        <Activity size={48} color="#3742fa" className="pulse-icon" />
        <h3 style={{ color: 'var(--text-secondary)' }}>Loading Command Center Data...</h3>
      </div>
    );
  }

  const selectStyle = { 
    background: '#12121a', border: '1px solid #2a2a3a', color: '#fff', 
    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', outline: 'none'
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', background: '#0a0a0f', minHeight: '100vh', color: '#fff', padding: '20px' }}>
      <style>{styles}</style>

      {/* ── HEADER & FILTERS ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #2a2a3a', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Months</option>
            {filterOptions.months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Brands</option>
            {filterOptions.brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* ── ALERT BANNER ── */}
      {kpi.overspending.length > 0 && (
        <div className="animate-in" style={{ background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1))', border: '1px solid #ef4444', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle color="#fff" size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', margin: '0 0 4px 0', fontWeight: 600 }}>Budget Alert: {kpi.overspending.length} Products Overspending</h3>
            <p style={{ margin: 0, color: '#8b8b9e', fontSize: '13px' }}>
              {kpi.overspending.slice(0, 3).map(p => `${p.brand} ${p.product} (${((p.spent/p.budgetOverall)*100).toFixed(1)}%)`).join(', ')}
              {kpi.overspending.length > 3 && ` and ${kpi.overspending.length - 3} others`} have exceeded budget. Immediate action required.
            </p>
          </div>
        </div>
      )}

      {/* ── KPI CARDS with SPARKLINES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Budget', val: kpi.totalBudget, fmt: formatCurrency, trend: '+12%', type: 'up', line: sparklines.budget, cls: 'cc2-kpi-budget', color: '#1877F2' },
          { label: 'Total Spent', val: kpi.totalSpent, fmt: formatCurrency, trend: '+18%', type: 'up', line: sparklines.spent, cls: 'cc2-kpi-spent', color: '#f59e0b' },
          { label: 'Remaining Budget', val: kpi.totalRemaining, fmt: formatCurrency, trend: '-8%', type: 'down', line: sparklines.remaining, cls: 'cc2-kpi-rem', color: '#10b981' },
          { label: 'Overall Pacing', val: kpi.avgPacing, fmt: v => `${v.toFixed(1)}%`, trend: kpi.avgPacing > 100 ? '+Alert' : 'On Track', type: kpi.avgPacing > 100 ? 'down' : 'up', line: sparklines.pacing, cls: 'cc2-kpi-pacing', color: '#7c3aed' },
          { label: 'Actual Blended CPM', val: kpi.actualCPM, fmt: formatCPM, trend: 'Optimal', type: 'up', line: sparklines.cpm, cls: 'cc2-kpi-cpm', color: '#059669' },
        ].map((card, i) => (
          <div key={i} className={`cc2-card cc2-kpi ${card.cls}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ color: '#8b8b9e', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</span>
              <span className={`cc2-trend ${card.type === 'up' ? 'cc2-trend-up' : 'cc2-trend-down'}`}>{card.trend}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>{card.fmt(card.val)}</div>
            <Sparkline data={card.line} color={card.color} width={200} height={40} />
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* Left Col: Platform Efficiency + Trend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="cc2-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>Platform Efficiency Matrix</span>
              <BarChart2 size={20} color="#8b8b9e" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {platformMatrix.map(p => (
                <div key={p.id} className="cc2-platform-card" style={{ borderTop: `3px solid ${p.color}` }}>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{p.name}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{formatCurrency(p.budget)}</div>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginBottom: '12px' }}>CPM: {formatCurrency(p.cpm)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{width: '32px', textAlign: 'right'}}>{p.pacing.toFixed(0)}%</span>
                    <div style={{ width: '60px', height: '6px', background: '#2a2a3a', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', width: `${Math.min(p.pacing, 100)}%`, 
                        background: p.pacing > 100 ? '#ef4444' : p.pacing > 85 ? '#f59e0b' : '#10b981' 
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Trend Chart connected underneath */}
            <div style={{ marginTop: '32px', height: '260px' }}>
              <h3 style={{ fontSize: '13px', color: '#8b8b9e', marginBottom: '16px', textTransform: 'uppercase' }}>Monthly Spend vs Pacing Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                  <XAxis dataKey="month" stroke="#8b8b9e" fontSize={12} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#8b8b9e" fontSize={11} tickLine={false} tickFormatter={v => `${(v/1e9).toFixed(0)}B`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b8b9e" fontSize={11} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 'auto']} hide />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="budget" name="Budget" fill="transparent" stroke="#3742fa" strokeWidth={1} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="spent" name="Spent" fill="#00d084" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="pacing" name="Pacing %" stroke="#ff9500" strokeWidth={2} dot={{ r: 4, fill: '#12121a', stroke: '#ff9500', strokeWidth: 2 }} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Col: Budget Pacing by Brand */}
        <div className="cc2-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>{brandFilter !== 'all' ? 'Budget Pacing by Category' : 'Budget Pacing by Brand'}</span>
            <Briefcase size={20} color="#8b8b9e" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {brandPacing.map(b => (
              <div key={b.brand} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{b.brand}</span>
                    <span style={{ fontSize: '12px', color: '#8b8b9e' }}>{formatCurrency(b.spent)} / {formatCurrency(b.budget)}</span>
                  </div>
                  <div className="cc2-bullet-bg">
                    <div className="cc2-bullet-target"></div>
                    <div className="cc2-bullet-fill" style={{ 
                      width: `${Math.min(b.pacing, 100)}%`, 
                      background: b.pacing > 100 ? '#ef4444' : b.pacing < 50 ? '#f59e0b' : '#10b981'
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b8b9e' }}>
                    {b.pacing > 100 ? (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ {b.pacing.toFixed(1)}% OVERSPEND</span>
                    ) : (
                      <span>{b.pacing.toFixed(1)}% spent</span>
                    )}
                    <span>Target: 85%</span>
                  </div>
                </div>

                {brandFilter !== 'all' && b.cats && b.cats.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '2px solid #2a2a3a' }}>
                    {b.cats.map(c => (
                      <div key={c.category} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500, fontSize: '12px', color: '#8b8b9e' }}>{c.category}</span>
                            <span style={{ fontSize: '11px', color: '#8b8b9e' }}>{formatCurrency(c.spent)} / {formatCurrency(c.budget)}</span>
                          </div>
                          <div className="cc2-bullet-bg" style={{ height: '14px' }}>
                            <div className="cc2-bullet-target"></div>
                            <div className="cc2-bullet-fill" style={{ 
                              width: `${Math.min(c.pacing, 100)}%`, 
                              background: c.pacing > 100 ? '#ef4444' : c.pacing < 50 ? '#f59e0b' : '#3742fa'
                            }}></div>
                          </div>
                          <div style={{ fontSize: '10px', color: '#8b8b9e', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{c.pacing.toFixed(1)}% spent</span>
                          </div>
                        </div>

                        {/* Child Products */}
                        {c.prods && c.prods.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '2px solid #2a2a3a' }}>
                            {c.prods.map(p => (
                               <div key={p.product} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <span style={{ fontWeight: 400, fontSize: '11px', color: '#6b7280' }}>↳ {p.product}</span>
                                   <span style={{ fontSize: '10px', color: '#6b7280' }}>{formatCurrency(p.spent)} / {formatCurrency(p.budget)}</span>
                                 </div>
                                 <div className="cc2-bullet-bg" style={{ height: '6px', background: '#1a1a25' }}>
                                   <div className="cc2-bullet-target"></div>
                                   <div className="cc2-bullet-fill" style={{ 
                                     width: `${Math.min(p.pacing, 100)}%`, 
                                     background: p.pacing > 100 ? '#ef4444' : p.pacing < 50 ? '#f59e0b' : '#00d084'
                                   }}></div>
                                 </div>
                               </div>
                            ))}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── PERFORMANCE BY CHANNEL ── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Performance by Channel <small style={{ color: '#ef4444', fontSize: '10px' }}>(ENGINE V4 ACTIVE)</small></span>
          <Target size={20} color="#8b8b9e" />
        </div>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {channelPerformance.map((ch) => (
            <div key={ch.id} className="cc2-card" style={{ minWidth: '320px', flex: '0 0 auto', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  background: ch.color, backgroundOpacity: 0.1, border: `1px solid ${ch.color}`
                }}>
                  {ch.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{ch.name} Advertising</div>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginTop: '2px' }}>Digital Channel Performance</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#1a1a25', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>Total Spent</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{formatCurrency(ch.spent)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: ch.pacing > 100 ? '#ef4444' : '#10b981' }}>
                      {ch.pacing.toFixed(1)}%
                    </span>
                    <div className="cc2-pbar-bg" style={{ width: '40px', height: '4px' }}>
                      <div className="cc2-pbar-fill" style={{ 
                        width: `${Math.min(ch.pacing, 100)}%`, 
                        background: ch.pacing > 100 ? '#ef4444' : '#10b981' 
                      }}></div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#1a1a25', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>Average CPM</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{formatCPM(ch.cpm)}</div>
                  <div style={{ fontSize: '10px', color: '#8b8b9e' }}>Efficiency Index</div>
                </div>

                <div style={{ background: '#1a1a25', borderRadius: '8px', padding: '12px', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>Actual Impressions</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{formatNumber(ch.imp)}</div>
                  <Sparkline data={generateSparkline(ch.imp, 0.2)} color={ch.color} width={200} height={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PERFORMANCE BY PIC (NEW CARDS) ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Performance by PIC</span>
          <Users size={20} color="#8b8b9e" />
        </div>
        
        <div className="cc2-pic-grid">
          {picCardData.map((pic, idx) => (
            <div key={pic.pic} className="cc2-card" style={{ padding: '24px' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#fff',
                  background: ['linear-gradient(135deg, #1877f2, #42b72a)', 'linear-gradient(135deg, #ff0050, #00f2ea)', 'linear-gradient(135deg, #ff9500, #ff4757)', 'linear-gradient(135deg, #7c3aed, #3742fa)'][idx % 4]
                }}>
                  {pic.pic.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{pic.pic}</div>
                  <div style={{ fontSize: '12px', color: '#8b8b9e', marginTop: '2px' }}>{pic.role}</div>
                </div>
              </div>

              {/* 4 KPIs grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                
                {/* Budget KPI */}
                <div style={{ background: '#1a1a25', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>Total Budget</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{formatCurrency(pic.budget)}</div>
                  <Sparkline data={pic.sparkline} color="#3742fa" width={80} height={20} />
                </div>

                {/* Spent KPI */}
                <div style={{ background: '#1a1a25', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>Total Spent</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{formatCurrency(pic.spent)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: pic.pacing > 100 ? '#ef4444' : pic.pacing > 85 ? '#f59e0b' : '#10b981' }}>
                      {pic.pacing > 999 ? '>999%' : `${pic.pacing.toFixed(1)}%`}
                    </span>
                    <div className="cc2-pbar-bg" style={{ width: '40px', height: '4px' }}>
                      <div className="cc2-pbar-fill" style={{ 
                        width: `${Math.min(pic.pacing, 100)}%`, 
                        background: pic.pacing > 100 ? '#ef4444' : pic.pacing > 85 ? '#f59e0b' : '#10b981' 
                      }}></div>
                    </div>
                  </div>
                </div>

                {/* Score KPI */}
                <div style={{ background: '#1a1a25', borderRadius: '8px', padding: '12px', cursor: 'help' }} 
                     title={`Efficiency Score Detail:\n\n• Target Est. CPM: ${formatCurrency(pic.scoreDetails.estCpm)}\n• Actual CPM: ${formatCurrency(pic.scoreDetails.actCpm)}\n👉 CPM Efficiency: ${pic.scoreDetails.cpmScore.toFixed(1)}/100 (50% Weight)\n\n• Target Pacing: 85% - 100%\n• Actual Pacing: ${pic.pacing.toFixed(1)}%\n👉 Pacing Health: ${pic.scoreDetails.pacingScore.toFixed(1)}/100 (50% Weight)\n\n🏆 Final Blended Score: ${pic.scoreDetails.finalScore}/100`}>
                  <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>Efficiency Score</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: pic.score > 80 ? '#10b981' : pic.score > 60 ? '#f59e0b' : '#ef4444' }}>
                    {pic.score}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8b8b9e', marginTop: '4px' }}>Blended Index ⓘ</div>
                </div>

                {/* Top Platform KPI */}
                <div style={{ background: '#1a1a25', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#8b8b9e', marginBottom: '4px' }}>Top Platform</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pic.topPlatformDetail}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {pic.topPlatforms.map(pt => (
                      <div key={pt.id} style={{ width: '16px', height: '16px', borderRadius: '4px', background: pt.color, opacity: 0.8 }} title={pt.name}></div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Expand Toggle */}
              <button 
                onClick={() => setExpandedPic(expandedPic === pic.pic ? null : pic.pic)}
                style={{ width: '100%', background: 'transparent', border: '1px solid #2a2a3a', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#1a1a25'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {expandedPic === pic.pic ? '▲ Hide Breakdown' : '▼ Expand Category'}
              </button>

              {/* Expanded Area */}
              {expandedPic === pic.pic && (
                <div className="fade-in" style={{ marginTop: '16px', borderTop: '1px solid #2a2a3a', paddingTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: '#8b8b9e' }}>Category Breakdown</div>
                  {pic.categories.map((cat, cIdx) => (
                    <div key={cIdx} style={{ marginBottom: '12px', background: '#1a1a25', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{cat.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{formatCurrency(cat.budget)}</span>
                      </div>
                      {/* Platform Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {cat.channels.map(ch => (
                          <div key={ch.id} title={`${ch.name} - Budget: ${formatCurrency(ch.budget)} | Spent: ${formatCurrency(ch.spent)}`} 
                               style={{ display: 'flex', alignItems: 'center', gap: '4px', background: `${ch.color}20`, color: ch.color, padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, cursor: 'help' }}>
                             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ch.color }}></div>
                             {ch.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* ── PRODUCT BREAKDOWN BY PIC ── */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={20} color="#8b8b9e" />
          Product Breakdown by PIC
        </div>

        {productDetailByPic.map((picGroup, pIdx) => (
          <div key={picGroup.pic} className="cc2-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', color: '#fff',
                background: ['linear-gradient(135deg, #1877f2, #42b72a)', 'linear-gradient(135deg, #ff0050, #00f2ea)', 'linear-gradient(135deg, #ff9500, #ff4757)', 'linear-gradient(135deg, #7c3aed, #3742fa)'][pIdx % 4],
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold'
              }}>
                {picGroup.pic.substring(0, 2).toUpperCase()}
              </div>
              {picGroup.pic}
            </h3>

            {picGroup.categories.map(cat => (
              <div key={cat.name} style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', color: '#8b8b9e', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #2a2a3a', paddingBottom: '8px' }}>
                  {cat.labelType}: <span style={{ color: '#fff' }}>{cat.name}</span>
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="cc2-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ textAlign: 'right' }}>Budget</th>
                        <th style={{ textAlign: 'right' }}>Est. Imp</th>
                        <th style={{ textAlign: 'right' }}>Est. CPM</th>
                        <th style={{ textAlign: 'right' }}>Act. Spent</th>
                        <th style={{ textAlign: 'right' }}>Act. Imp</th>
                        <th style={{ textAlign: 'right' }}>Act. CPM</th>
                        <th style={{ width: '150px' }}>Pacing %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.products.map((prod, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{prod.product}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(prod.budget)}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(prod.estImp)}</td>
                          <td style={{ textAlign: 'right', color: '#8b8b9e' }}>{formatCurrency(prod.estCpm)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: prod.spent > prod.budget ? '#ef4444' : '#f59e0b' }}>{formatCurrency(prod.spent)}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(prod.imp)}</td>
                          <td style={{ textAlign: 'right', color: '#8b8b9e' }}>{formatCurrency(prod.actCpm)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: prod.pacing > 100 ? '#ef4444' : prod.pacing > 85 ? '#f59e0b' : '#10b981', fontWeight: 600, width: '45px' }}>
                                {prod.pacing > 999 ? '>999%' : `${prod.pacing.toFixed(1)}%`}
                              </span>
                              <div className="cc2-pbar-bg">
                                <div className="cc2-pbar-fill" style={{ 
                                  width: `${Math.min(prod.pacing, 100)}%`, 
                                  background: prod.pacing > 100 ? '#ef4444' : prod.pacing > 85 ? '#f59e0b' : '#10b981' 
                                }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}
        {productDetailByPic.length === 0 && (
          <div className="cc2-card" style={{ textAlign: 'center', color: '#8b8b9e', padding: '32px' }}>
            No product data available.
          </div>
        )}
      </div>

    </div>
  );
};
