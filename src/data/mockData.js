import { tiktokAdsData as realTT, metaAdsData as realMeta, googleAdsData as realGG, kolData as realKOL } from './realAdsData';

const allDates = new Set();
realTT.forEach(d => { if(d["By Day"]) allDates.add(d["By Day"]) });
realMeta.forEach(d => { if(d.Day) allDates.add(d.Day) });
realGG.forEach(d => { if(d.Day) allDates.add(d.Day) });
realKOL.forEach(d => { if(d.normDate) allDates.add(d.normDate) });

export const dates = Array.from(allDates).sort((a,b) => new Date(a) - new Date(b));

// Helper to generate random numbers for the remaining mocked channels
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => (parseInt(Math.random() * (max - min) + min)).toFixed(2);

// Use real data from Google Sheets
export const tiktokAdsData = realTT;
export const googleAdsData = realGG;
export const metaAdsData = realMeta;

// 4. KOL Data
const kolNames = ["KOL_A", "KOL_B", "KOL_C"];
export const kolData = dates.flatMap(date => 
  kolNames.map(kol => ({
    "Date": date,
    "KOL name": kol,
    "spent": randomInt(1000000, 3000000),
    "reach": randomInt(50000, 200000),
    "impression": randomInt(60000, 250000),
    "view": randomInt(40000, 150000),
    "like": randomInt(2000, 10000),
    "komen": randomInt(100, 1000),
    "share": randomInt(50, 500)
  }))
);

// 5. Ecommerce Data
const skus = ["SKU_101", "SKU_202", "SKU_303"];
export const ecommerceData = dates.flatMap(date => 
  skus.map(sku => ({
    "Date": date,
    "SKU": sku,
    "jumlah order": randomInt(5, 50),
    "jumlah revenue": randomInt(500000, 5000000)
  }))
);

// 6. Offsite Traffic Data
export const offsiteData = dates.map(date => ({
  "Date": date, // adding explicit date for ease of matching
  "Shop Name": "OfficialStore",
  "Shop ID": "12345",
  "Terminal": "App",
  "Channel Name": "TikTok",
  "Campaign Description": "External_Traffic_Promo",
  "Campaign Info In Parameter": "utm_source=tiktok",
  "Ad Content": "viral_video_1",
  "Visits": randomInt(1000, 5000),
  "Add To Cart Units": randomInt(100, 500),
  "Buyers": randomInt(20, 100),
  "Orders": randomInt(25, 120),
  "Sales(USD)": randomFloat(50, 500),
  "Sales(Local currency)": randomInt(750000, 7500000), // ~15k rate
  "Item Conversion Rate": randomFloat(1, 5),
  "Unique Visitors": randomInt(800, 4000),
  "New Buyers": randomInt(10, 50),
  "Add To Cart Value(USD)": randomFloat(200, 1000),
  "Add To Cart Value(Local currency)": randomInt(3000000, 15000000),
  "Units Sold": randomInt(30, 150)
}));

// 7. Offline Store Data
export const offlineStoreData = dates.map(date => ({
  "Date": date,
  "Store Visits": randomInt(5, 15)
}));

// 8. Competitor Data
export const competitors = ["Competitor A", "Competitor B", "Competitor C"];

export const competitorData = dates.flatMap(date => 
  competitors.map(comp => ({
    "Date": date,
    "Competitor": comp,
    "Search Volume": randomInt(5000, 25000),      // Absolute search volume
    "Google Trends": randomInt(20, 100),         // Relative search interest (0-100)
    "Estimated Spend": randomInt(5000000, 20000000), // Estimated ad spend
    "Active Ads": randomInt(5, 30),              // Number of active ad creatives
    "Average Price": randomInt(50000, 150000)    // Benchmark product price
  }))
);

// Our own search data for comparison
export const ourSearchData = dates.map(date => ({
  "Date": date,
  "Search Volume": randomInt(15000, 40000),
  "Google Trends": randomInt(50, 100)
}));

// 9. X (Twitter) Monitoring Data
export const xKeywords = ["hanasui", "skintific", "glad2glow"];

export const xMonitoringData = dates.flatMap(date => 
  xKeywords.map(keyword => ({
    "Date": date,
    "Keyword": keyword,
    "Mentions": randomInt(50, 500),
    "Sentiment": {
      "Positive": randomInt(20, 60),
      "Neutral": randomInt(30, 70),
      "Negative": randomInt(5, 20)
    },
    "Reach": randomInt(5000, 50000)
  }))
);

export const xTopPosts = xKeywords.flatMap(keyword => [
  {
    "Keyword": keyword,
    "User": `@user_${randomInt(1, 100)}`,
    "Text": `Baru cobain ${keyword} dan hasilnya oke banget buat kulit sensitif! #skincare`,
    "Likes": randomInt(100, 1000),
    "Retweets": randomInt(10, 200),
    "Sentiment": "Positive"
  },
  {
    "Keyword": keyword,
    "User": `@beauty_guru`,
    "Text": `Jujur lebih suka ${keyword} daripada brand sebelah. Affordable but effective.`,
    "Likes": randomInt(500, 5000),
    "Retweets": randomInt(50, 800),
    "Sentiment": "Positive"
  },
  {
    "Keyword": keyword,
    "User": `@skincare_talk`,
    "Text": `Ada yang tau kenapa ${keyword} susah banget dicarinya sekarang? Sold out dimana-mana.`,
    "Likes": randomInt(50, 300),
    "Retweets": randomInt(5, 50),
    "Sentiment": "Neutral"
  }
]);
