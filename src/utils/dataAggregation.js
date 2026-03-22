// Helper to sum an array of objects by a specific key
const sumBy = (data, key) => data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);

// Combine all marketing spend and performance by Date
export const getAggregatedByDate = (tiktokAdsData, googleAdsData, metaAdsData, offsiteData, kolData, criteoData, dates) => dates.map(date => {
  // TikTok
  const dailyTikTok = tiktokAdsData.filter(d => d.normDate === date);
  const ttSpend = sumBy(dailyTikTok, "Cost");
  const ttViews = sumBy(dailyTikTok, "Video views");
  const ttClicks = sumBy(dailyTikTok, "Clicks (all)");
  const ttReach = sumBy(dailyTikTok, "Reach");
  const ttImp = sumBy(dailyTikTok, "Impressions");

  // Google
  const dailyGoogle = googleAdsData.filter(d => d.normDate === date);
  const ggSpend = sumBy(dailyGoogle, "Cost") || sumBy(dailyGoogle, "Amount spent (IDR)");
  const ggClicks = sumBy(dailyGoogle, "Clicks") || sumBy(dailyGoogle, "Link clicks");
  const ggImp = sumBy(dailyGoogle, "Impr.") || sumBy(dailyGoogle, "Impressions");
  const ggReach = sumBy(dailyGoogle, "Reach") || 0;
  const ggViews = sumBy(dailyGoogle, "TrueView views") || sumBy(dailyGoogle, "Views");

  // Meta
  const dailyMeta = metaAdsData.filter(d => d.normDate === date);
  const metaSpend = sumBy(dailyMeta, "Amount spent (IDR)");
  const metaReach = sumBy(dailyMeta, "Reach");
  const metaImp = sumBy(dailyMeta, "Impressions");
  const metaClicks = sumBy(dailyMeta, "Link clicks");
  const metaViews = sumBy(dailyMeta, "Views");
  
  // KOL (Real Data)
  const dailyKOL = kolData.filter(d => d.normDate === date);
  const kolSpend = sumBy(dailyKOL, "Ratecard");
  const kolViews = sumBy(dailyKOL, "Views");
  const kolReach = kolViews; // Proxy since reach isn't in KOL sheet
  const kolImp = kolViews;   // Proxy

  // Criteo
  const dailyCriteo = criteoData.filter(d => d.normDate === date);
  const criSpend = sumBy(dailyCriteo, "Cost");
  const criImp = sumBy(dailyCriteo, "Displays");
  const criReach = sumBy(dailyCriteo, "Exposed Users");
  const criClicks = sumBy(dailyCriteo, "Clicks");

  // Offsite
  const dailyOffsite = offsiteData.filter(d => d.normDate === date);
  const offsiteRevenue = sumBy(dailyOffsite, "Sales(Local currency)");
  const offsiteOrders = sumBy(dailyOffsite, "Orders");
  const offsiteVisits = sumBy(dailyOffsite, "Visits");
  const offsiteUniqueVisitors = sumBy(dailyOffsite, "Unique Visitors");
  const offsiteNewBuyers = sumBy(dailyOffsite, "New Buyers");
  const offsiteATC = sumBy(dailyOffsite, "Add To Cart Units");
  const offsiteATCValue = sumBy(dailyOffsite, "Add To Cart Value(Local currency)");

  // Aggregates
  const totalAdsSpend = ttSpend + ggSpend + metaSpend + criSpend;
  const totalSpend = totalAdsSpend; // Removed kolSpend from global total
  const totalRevenue = offsiteRevenue;
  const totalOrders = offsiteOrders;
  const totalTraffic = ttClicks + ggClicks + metaClicks + criClicks + offsiteVisits; 
  
  // Awareness
  const totalReach = ttReach + metaReach + ggReach + criReach; // Removed kolReach
  const totalImpressions = ttImp + ggImp + metaImp + criImp; // Removed kolImp
  
  // Consideration
  const totalATC = offsiteATC;
  const totalATCValue = offsiteATCValue;

  return {
    date,
    ttSpend, ggSpend, metaSpend, kolSpend, criSpend,
    ttImp, ggImp, metaImp, kolImp, criImp,
    ttClicks, ggClicks, metaClicks, criClicks,
    totalAdsSpend, totalSpend,
    totalRevenue,
    totalOrders,
    totalTraffic,
    ttViews, kolViews, ggViews, metaViews, totalViews: ttViews + ggViews + metaViews, // Removed kolViews from total
    totalReach, totalImpressions,
    offsiteVisits, offsiteUniqueVisitors, offsiteNewBuyers, totalATC, totalATCValue,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    avgCpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  };
});

// Helper to calculate percentage change
export const calculateTrend = (current, previous, inverse = false) => {
  if (!previous || previous === 0) return { label: current > 0 ? "+100%" : "0%", isPositive: current >= 0 };
  const change = ((current - previous) / previous) * 100;
  const formatted = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  
  const isPositive = inverse ? change <= 0 : change >= 0;
  
  return {
    label: formatted,
    isPositive
  };
};

// Calculate Overall KPIs with comparison logic
export const getOverallKPIs = (tiktokAdsData, metaAdsData, googleAdsData, kolData, aggregatedByDate) => {
  if (!aggregatedByDate || aggregatedByDate.length === 0) return null;

  // Split data into two halves for comparison
  const mid = Math.floor(aggregatedByDate.length / 2);
  const currentPeriod = aggregatedByDate.slice(mid);
  const previousPeriod = aggregatedByDate.slice(0, mid);

  const getStats = (data) => {
    const stats = {
      totalSpend: sumBy(data, "totalSpend"),
      totalReach: sumBy(data, "totalReach"),
      totalImpressions: sumBy(data, "totalImpressions"),
      totalViews: sumBy(data, "totalViews"),
      totalOffsiteVisits: sumBy(data, "offsiteVisits"),
      totalUniqueVisitors: sumBy(data, "offsiteUniqueVisitors"),
      totalNewBuyers: sumBy(data, "offsiteNewBuyers"),
      totalATC: sumBy(data, "totalATC"),
      totalATCValue: sumBy(data, "totalATCValue"),
    };
    
    stats.avgCpm = stats.totalImpressions > 0 ? (stats.totalSpend / stats.totalImpressions) * 1000 : 0;
    stats.avgCpv = stats.totalViews > 0 ? (stats.totalSpend / stats.totalViews) : 0;
    
    return stats;
  };

  const current = getStats(currentPeriod);
  const previous = getStats(previousPeriod);

  return {
    ...current,
    trends: {
      totalSpend: calculateTrend(current.totalSpend, previous.totalSpend),
      totalReach: calculateTrend(current.totalReach, previous.totalReach),
      totalImpressions: calculateTrend(current.totalImpressions, previous.totalImpressions),
      totalViews: calculateTrend(current.totalViews, previous.totalViews),
      avgCpm: calculateTrend(current.avgCpm, previous.avgCpm, true),
      avgCpv: calculateTrend(current.avgCpv, previous.avgCpv, true),
      totalOffsiteVisits: calculateTrend(current.totalOffsiteVisits, previous.totalOffsiteVisits),
      totalATC: calculateTrend(current.totalATC, previous.totalATC),
      totalUniqueVisitors: calculateTrend(current.totalUniqueVisitors, previous.totalUniqueVisitors),
      totalNewBuyers: calculateTrend(current.totalNewBuyers, previous.totalNewBuyers),
      totalATCValue: calculateTrend(current.totalATCValue, previous.totalATCValue),
    }
  };
};

export const getKOLPerformance = (kolData) => {
  const kolBreakdown = {};
  kolData.forEach(entry => {
    const name = entry["Username"];
    if (!name) return;
    if (!kolBreakdown[name]) {
      kolBreakdown[name] = { impressions: 0, views: 0, spend: 0, reach: 0, like: 0, komen: 0, share: 0, save: 0 };
    }
    const v = Number(entry["Views"]) || 0;
    kolBreakdown[name].views += v;
    kolBreakdown[name].impressions += v;
    kolBreakdown[name].spend += Number(entry["Ratecard"]) || 0;
    kolBreakdown[name].reach += v;
    kolBreakdown[name].like += Number(entry["Likes"]) || 0;
    kolBreakdown[name].komen += Number(entry["Comment"]) || 0;
    kolBreakdown[name].share += Number(entry["Share"]) || 0;
    kolBreakdown[name].save += Number(entry["Save"]) || 0;
  });

  return Object.keys(kolBreakdown).map(name => {
    const spend = kolBreakdown[name].spend;
    const views = kolBreakdown[name].views;
    return {
      name, views, impressions: views, spend, reach: views,
      like: kolBreakdown[name].like, komen: kolBreakdown[name].komen,
      share: kolBreakdown[name].share, save: kolBreakdown[name].save,
      cpm: views > 0 ? (spend / views) * 1000 : 0,
      cpv: views > 0 ? (spend / views) : 0
    };
  }).sort((a,b) => b.views - a.views);
};

export const getTikTokCreativePerformance = (tiktokAdsData) => {
  const creativeBreakdown = {};
  tiktokAdsData.forEach(entry => {
    const name = entry["Ad name"];
    if (!creativeBreakdown[name]) {
      creativeBreakdown[name] = { impressions: 0, views: 0, spend: 0, reach: 0 };
    }
    creativeBreakdown[name].impressions += entry["Impressions"] || 0;
    creativeBreakdown[name].views += entry["Video views"] || 0;
    creativeBreakdown[name].spend += entry["Cost"] || 0;
    creativeBreakdown[name].reach += entry["Reach"] || 0;
  });

  return Object.keys(creativeBreakdown).map(name => {
    const spend = creativeBreakdown[name].spend;
    const impressions = creativeBreakdown[name].impressions;
    const views = creativeBreakdown[name].views;
    return {
      name, impressions, views, spend, reach: creativeBreakdown[name].reach,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      cpv: views > 0 ? (spend / views) : 0
    };
  }).sort((a,b) => b.impressions - a.impressions);
};

export const getMetaCreativePerformance = (metaAdsData) => {
  const creativeBreakdown = {};
  metaAdsData.forEach(entry => {
    const name = entry["Campaign name"];
    if (!creativeBreakdown[name]) {
      creativeBreakdown[name] = { impressions: 0, spend: 0, reach: 0 };
    }
    creativeBreakdown[name].impressions += entry["Impressions"] || 0;
    creativeBreakdown[name].spend += entry["Amount spent (IDR)"] || 0;
    creativeBreakdown[name].reach += entry["Reach"] || 0;
  });

  return Object.keys(creativeBreakdown).map(name => {
    const spend = creativeBreakdown[name].spend;
    const impressions = creativeBreakdown[name].impressions;
    return {
      name, impressions, spend, reach: creativeBreakdown[name].reach,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0
    };
  }).sort((a,b) => b.impressions - a.impressions);
};

export const getProductPerformance = (tiktokAdsData, metaAdsData, googleAdsData, offsiteData, kolData, criteoData) => {
  const productMap = {};
  const processEntry = (productName, data) => {
    if (!productName) return;
    if (!productMap[productName]) {
      productMap[productName] = { spend: 0, impressions: 0, visits: 0, atcUnits: 0, atcValue: 0 };
    }
    productMap[productName].spend += (data.spend || 0);
    productMap[productName].impressions += (data.impressions || 0);
    productMap[productName].visits += (data.visits || 0);
    productMap[productName].atcUnits += (data.atcUnits || 0);
    productMap[productName].atcValue += (data.atcValue || 0);
  };

  tiktokAdsData.forEach(entry => processEntry(entry.PRODUCTS, { spend: entry.Cost, impressions: entry.Impressions }));
  metaAdsData.forEach(entry => processEntry(entry.PRODUCTS, { spend: entry["Amount spent (IDR)"], impressions: entry.Impressions }));
  googleAdsData.forEach(entry => processEntry(entry.PRODUCTS, { spend: entry.Cost || entry["Amount spent (IDR)"], impressions: entry["Impr."] || entry.Impressions }));
  criteoData.forEach(entry => processEntry(entry.PRODUCTS, { spend: entry.Cost, impressions: entry.Displays }));
  offsiteData.forEach(entry => processEntry(entry.PRODUCTS, { visits: entry.Visits, atcUnits: entry["Add To Cart Units"], atcValue: entry["Add To Cart Value(Local currency)"] }));
  // Removed KOL from product mapping

  return Object.keys(productMap).map(name => ({ name, ...productMap[name] })).sort((a,b) => b.spend - a.spend);
};

export const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value);

export const getChannelPerformance = (tiktokAdsData, metaAdsData, googleAdsData, kolData, criteoData) => {
  const ttSpend = sumBy(tiktokAdsData, "Cost");
  const ttImp = sumBy(tiktokAdsData, "Impressions");
  const metaSpend = sumBy(metaAdsData, "Amount spent (IDR)");
  const metaImp = sumBy(metaAdsData, "Impressions");
  const ggSpend = sumBy(googleAdsData, "Cost") || sumBy(googleAdsData, "Amount spent (IDR)");
  const ggImp = sumBy(googleAdsData, "Impr.") || sumBy(googleAdsData, "Impressions");
  const kolSpend = sumBy(kolData, "Ratecard");
  const kolImp = sumBy(kolData, "Views");
  const criSpend = sumBy(criteoData, "Cost");
  const criImp = sumBy(criteoData, "Displays");

  return [
    { name: 'TikTok', cpm: ttImp > 0 ? (ttSpend / ttImp) * 1000 : 0, color: '#00f2fe' },
    { name: 'Meta', cpm: metaImp > 0 ? (metaSpend / metaImp) * 1000 : 0, color: '#1877f2' },
    { name: 'Google', cpm: ggImp > 0 ? (ggSpend / ggImp) * 1000 : 0, color: '#ea4335' },
    { name: 'Criteo', cpm: criImp > 0 ? (criSpend / criImp) * 1000 : 0, color: '#33b3ff' },
  ];
};

/**
 * Competitor Analysis Aggregations
 */

export const getCompetitorAggregation = (competitorData, ourSearchData, dates) => {
  if (!competitorData || !ourSearchData) return [];
  
  return dates.map(date => {
    const dailyCompetitors = competitorData.filter(d => d.Date === date);
    const ourDailySearch = ourSearchData.find(d => d.Date === date) || { "Search Volume": 0, "Google Trends": 0 };
    
    const row = {
      date,
      "Our Brand": ourDailySearch["Search Volume"],
      "Our Brand Trends": ourDailySearch["Google Trends"]
    };
    
    dailyCompetitors.forEach(c => {
      row[`${c.Competitor} Volume`] = c["Search Volume"];
      row[`${c.Competitor} Trends`] = c["Google Trends"];
      row[`${c.Competitor} Spend`] = c["Estimated Spend"];
      row[`${c.Competitor} Price`] = c["Average Price"];
      row[c.Competitor] = c["Search Volume"]; // For simplified chart
    });
    
    return row;
  });
};

export const getLatestCompetitorStats = (competitorData) => {
  if (!competitorData || competitorData.length === 0) return [];
  
  const competitors = [...new Set(competitorData.map(d => d.Competitor))];
  const latestDate = competitorData[competitorData.length - 1].Date;
  
  return competitors.map(name => {
    const latest = competitorData.find(d => d.Competitor === name && d.Date === latestDate);
    return {
      name,
      searchVolume: latest?.["Search Volume"] || 0,
      trendsIndex: latest?.["Google Trends"] || 0,
      estSpend: latest?.["Estimated Spend"] || 0,
      activeAds: latest?.["Active Ads"] || 0,
      avgPrice: latest?.["Average Price"] || 0
    };
  });
};
