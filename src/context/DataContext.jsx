import React, { createContext, useContext, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
// import { 
//   competitorData as mockCompetitorData, 
//   ourSearchData as mockOurSearchData,
//   xMonitoringData as mockXData,
//   xTopPosts as mockXPosts
// } from '../data/mockData';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const sheet_id = '1jl0wFIfNEWYofEHN27Wb9UM1bdmoxzt5e2NUGyFijHY';
const command_center_sheet_id = '1IBX2WsOdSn0rDDSBQFG1ZK9Ihp7AoSKU5NX3AbAqPmI';
const urls = {
  TIKTOK: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=TIKTOK`,
  META:   `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=META`,
  GOOGLE: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=GOOGLE%20ADS`,
  OFFSITE: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=OFFSITE`,
  KOL: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=KOL`,
  CRITEO: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=CRITEO`,
  DAILY_ORDERS: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&sheet=Daily%20Performance%20Orders`,
  NCO_ORDERS: `https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?tqx=out:csv&gid=1823027242`,
  COMMAND_CENTER: `https://docs.google.com/spreadsheets/d/${command_center_sheet_id}/gviz/tq?tqx=out:csv&gid=0`
};

const cleanNumbers = (row) => {
  const cleaned = { ...row };
  for (let key in cleaned) {
    if (typeof cleaned[key] === 'string') {
      const withoutCommas = cleaned[key].replace(/,/g, '');
      if (cleaned[key].includes('Rp') || /^-?[\d,.]+$/.test(cleaned[key])) {
        // Remove currency symbols, spaces, and handle both . and , as separators
        let raw = cleaned[key].replace(/[Rp\s]/g, '');
        // If it has both . and , (e.g. 1.234,56), it's European/ID style
        if (raw.includes('.') && raw.includes(',')) {
            raw = raw.replace(/\./g, '').replace(',', '.');
        } else if (raw.includes('.') && raw.split('.').pop().length === 3) {
            // Likely 1.000 style
            raw = raw.replace(/\./g, '');
        } else if (raw.includes(',') && raw.split(',').pop().length === 3) {
            // Likely 1,000 style
            raw = raw.replace(/,/g, '');
        }
        const val = parseFloat(raw);
        if (!isNaN(val)) cleaned[key] = val;
      } else if (!isNaN(withoutCommas) && withoutCommas.trim() !== '' && !cleaned[key].includes('%')) {
        cleaned[key] = Number(withoutCommas);
      }
    }
  }
  // Normalize Date formats
  const dateField = cleaned['Date(DD/MM/YYYY)'] || cleaned['Date Posting'] || cleaned['Aim Date Posting'] || cleaned['By Day'] || cleaned['Day'] || cleaned['normDate'];
  if (dateField && typeof dateField === 'string') {
      const parts = dateField.split('/');
      const dashParts = dateField.split('-');
      const spaceParts = dateField.split(' ');
      
      if (parts.length === 3) {
          // DD/MM/YYYY
          cleaned.normDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (dashParts.length === 3) {
          // YYYY-MM-DD
          cleaned.normDate = dateField.substring(0, 10);
      } else if (spaceParts.length === 3) {
          // D MMMM YYYY
          const months = {
              'january': '01', 'february': '02', 'march': '03', 'april': '04',
              'may': '05', 'june': '06', 'july': '07', 'august': '08',
              'september': '09', 'october': '10', 'november': '11', 'december': '12'
          };
          const day = spaceParts[0].padStart(2, '0');
          const month = months[spaceParts[1].toLowerCase()];
          const year = spaceParts[2];
          if (month) {
              cleaned.normDate = `${year}-${month}-${day}`;
          }
      }
  }
  return cleaned;
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    tiktokAdsData: [],
    metaAdsData: [],
    metaAdsSupabaseData: [],
    googleAdsData: [],
    offsiteData: [],
    kolData: [],
    criteoData: [],
    ordersData: [],
    ncoOrdersData: [],
    commandCenterData: [],
    lastSync: null,
    loading: true,
    error: null
  });

  const getFormattedDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    let hours = today.getHours();
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const refreshCommandCenter = async () => {
    setData(prev => ({ ...prev, isRefreshing: true }));
    try {
      const res = await fetch(urls.COMMAND_CENTER);
      const text = await res.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      
      const parseNum = (val) => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[,%]/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };
      
      const parsePct = (val) => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        let cleaned = String(val).replace(/,/g, '').trim();
        let num = parseFloat(cleaned);
        if (cleaned.includes('%')) {
           return isNaN(num) ? 0 : num;
        } else {
           return isNaN(num) ? 0 : num * 100;
        }
      };

      const newData = parsed.data.map(row => {
        return {
          month: row['Month'] || '',
          monthNum: parseNum(row['M']),
          year: parseNum(row['Y']),
          pic: row['PIC PERFORMANCE TEAM'] || row['PIC PERFORMANCE'] || '',
          digitalStrat: row['DIGITL STRAT'] || '',
          brand: row['Brand'] || '',
          category: row['Category'] || '',
          categoryProduct: row['Category Product'] || row['category product'] || row['category proposal'] || '',
          product: row['Product'] || '',
          budgetOverall: parseNum(row['Budget Overall']),
          estReach: parseNum(row['Est. Reach']),
          estImp: parseNum(row['Est. Imp']),
          estCPM: parseNum(row['Est CPM']),
          budgetMeta: parseNum(row['Budget Meta']),
          estReachMeta: parseNum(row['Est. Reach Meta']),
          estImpMeta: parseNum(row['Est. Imp Meta']),
          budgetTiktok: parseNum(row['Budget Tiktok']),
          estReachTiktok: parseNum(row['Est. Reach Tiktok']),
          estImpTiktok: parseNum(row['Est. Imp Tiktok']),
          budgetSegumento: parseNum(row['Budget Segumento']),
          budgetDisplay: parseNum(row['Budget Display']),
          budgetCriteo: parseNum(row['Budget Criteo']),
          budgetGoogle: parseNum(row['Budget Google']),
          budgetPinterest: parseNum(row['Budget pinterest']),
          spent: parseNum(row['Spent']),
          remainingBudget: parseNum(row['Remaining Budget']),
          pacing: parsePct(row['% Pacing']),
          reach: parseNum(row['Reach']),
          reachPct: parsePct(row['% Reach']),
          impressions: parseNum(row['Imp.']),
          impPct: parsePct(row['% Imp.']),
          spentMeta: parseNum(row['Spent Meta']),
          actualImpMeta: parseNum(row['Actual Imp Meta']),
          actualReachMeta: parseNum(row['Actual Reach Meta']),
          spentTiktok: parseNum(row['Spent Tiktok']),
          actualImpTiktok: parseNum(row['Actual Imp Tiktok']),
          actualReachTiktok: parseNum(row['Actual Reach Tiktok']),
          spentSegumento: parseNum(row['Spent segumento']),
          spentCriteo: parseNum(row['Spent Criteo']),
          spentGoogle: parseNum(row['Spent Google']),
        };
      }).filter(r => r.budgetOverall > 0 || r.spent > 0);
      
      setData(prev => ({
        ...prev,
        commandCenterData: newData,
        lastSync: getFormattedDate(),
        isRefreshing: false
      }));
    } catch (err) {
      console.error('Failed to sync Command Center:', err);
      setData(prev => ({ ...prev, isRefreshing: false }));
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const fetchCSV = async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          const text = await res.text();
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          return parsed.data.map(cleanNumbers);
        };

        const normalizeAdData = (data) => data.map(cleaned => {
          let brand = cleaned.BRAND || cleaned.brand || '-';
          if (brand === '-' && cleaned['Campaign name']) {
            const parts = cleaned['Campaign name'].split('//').map(p => p.trim());
            // Most campaign names follow EJI // [OBJECTIVE] // [BRAND] // ...
            if (parts.length >= 3) {
              const possibleBrand = parts[2].toUpperCase();
              if (['HANASUI', 'NCO', 'FYNE', 'EOMMA BABY'].includes(possibleBrand)) {
                brand = possibleBrand;
              } else if (parts[1] && ['HANASUI', 'NCO', 'FYNE', 'EOMMA BABY'].includes(parts[1].toUpperCase())) {
                brand = parts[1].toUpperCase();
              }
            }
          }
          return {
            ...cleaned,
            PRODUCTS: cleaned.PRODUCTS || cleaned.products || '-',
            ['Category Brand']: cleaned['Category Brand'] || cleaned['category brand'] || '-',
            Category: cleaned.Category || cleaned.category || '-',
            BRAND: brand
          };
        });

        const parseOrdersData = (rawRows) => {
          // The sheet has a flat-wide format. We find the header row (first row with 'Date').
          // Column indices (0-indexed): Month=0, Week=1, Date=2, Contribution=3,
          // TikTok (40%): Target=4, GMV=5, RunRate=6, Units=7, ASP=8, Orders=9, ABS=10, PageViews=11, Visitors=12, CR=13
          // Lazada (10%): Target=14, GMV=15, RunRate=16, Units=17, ASP=18, Orders=19, ABS=20, PageViews=21, Visitors=22, CR=23
          // Shopee (45%): Target=24, GMV=25, RunRate=26, Units=27, ASP=28, Orders=29, ABS=30, ProductViews=31, Visitors=32, CR=33
          // Tokopedia(5%): Target=34, GMV=35, RunRate=36, Units=37, ASP=38, Orders=39, ABS=40, ProductViews=41, Visitors=42, CR=43
          // Grand Total:   Target=44, GMV=45, RunRate=46, Units=47, ASP=48, Orders=49, ABS=50, Views=51, Visitors=52, CR=53
          const cleanNum = (v) => {
            if (!v && v !== 0) return 0;
            const s = String(v).replace(/[Rp\s%,]/g, '');
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
          };
          const parseDateStr = (s) => {
            if (!s) return null;
            // Format: "1-Jan", "15-Mar", etc.
            const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
            const [d, m] = s.trim().split('-');
            if (!d || !m) return null;
            const year = 2026; // Year context from current date
            return `${year}-${months[m]}-${String(d).padStart(2,'0')}`;
          };
          return rawRows
            .filter(row => {
              const keys = Object.keys(row);
              const dateVal = row[keys[2]];
              return dateVal && String(dateVal).includes('-');
            })
            .map(row => {
              const vals = Object.values(row);
              const normDate = parseDateStr(String(vals[2] || ''));
              return {
                month: String(vals[0] || ''),
                week: String(vals[1] || ''),
                date: String(vals[2] || ''),
                normDate,
                tiktokShop: { target: cleanNum(vals[4]), gmv: cleanNum(vals[5]), runRate: cleanNum(vals[6]), units: cleanNum(vals[7]), asp: cleanNum(vals[8]), orders: cleanNum(vals[9]), abs: cleanNum(vals[10]), pageViews: cleanNum(vals[11]), visitors: cleanNum(vals[12]), cr: cleanNum(vals[13]) },
                lazada:     { target: cleanNum(vals[14]), gmv: cleanNum(vals[15]), runRate: cleanNum(vals[16]), units: cleanNum(vals[17]), asp: cleanNum(vals[18]), orders: cleanNum(vals[19]), abs: cleanNum(vals[20]), pageViews: cleanNum(vals[21]), visitors: cleanNum(vals[22]), cr: cleanNum(vals[23]) },
                shopee:     { target: cleanNum(vals[24]), gmv: cleanNum(vals[25]), runRate: cleanNum(vals[26]), units: cleanNum(vals[27]), asp: cleanNum(vals[28]), orders: cleanNum(vals[29]), abs: cleanNum(vals[30]), pageViews: cleanNum(vals[31]), visitors: cleanNum(vals[32]), cr: cleanNum(vals[33]) },
                tokopedia:  { target: cleanNum(vals[34]), gmv: cleanNum(vals[35]), runRate: cleanNum(vals[36]), units: cleanNum(vals[37]), asp: cleanNum(vals[38]), orders: cleanNum(vals[39]), abs: cleanNum(vals[40]), pageViews: cleanNum(vals[41]), visitors: cleanNum(vals[42]), cr: cleanNum(vals[43]) },
                total:      { target: cleanNum(vals[44]), gmv: cleanNum(vals[45]), runRate: cleanNum(vals[46]), units: cleanNum(vals[47]), asp: cleanNum(vals[48]), orders: cleanNum(vals[49]), abs: cleanNum(vals[50]), pageViews: cleanNum(vals[51]), visitors: cleanNum(vals[52]), cr: cleanNum(vals[53]) },
              };
            });
        };

        const parseNcoOrdersData = (rawRows) => {
          const cleanNum = (v) => {
            if (!v && v !== 0) return 0;
            const n = parseFloat(String(v).replace(/[Rp\s%,]/g, ''));
            return isNaN(n) ? 0 : n;
          };
          const parseDateStr = (s) => {
            if (!s) return null;
            const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
            const [d, m] = s.trim().split('-');
            if (!d || !m) return null;
            const year = 2026;
            return `${year}-${months[m]}-${String(d).padStart(2,'0')}`;
          };
          return rawRows
            .filter(row => {
              const keys = Object.keys(row);
              const dateVal = row[keys[1]]; // NCO format has Date at index 1
              return dateVal && String(dateVal).includes('-');
            })
            .map(row => {
              const vals = Object.values(row);
              const normDate = parseDateStr(String(vals[1] || ''));
              return {
                month: String(vals[0] || ''),
                week: '-',
                date: String(vals[1] || ''),
                normDate,
                tiktokShop: { target: cleanNum(vals[3]), gmv: cleanNum(vals[4]), runRate: cleanNum(vals[5]), units: cleanNum(vals[6]), asp: cleanNum(vals[7]), orders: cleanNum(vals[8]), abs: cleanNum(vals[9]), visitors: cleanNum(vals[10]), pageViews: cleanNum(vals[10]), cr: cleanNum(vals[11]) },
                lazada:     { target: cleanNum(vals[12]), gmv: cleanNum(vals[13]), runRate: cleanNum(vals[14]), units: cleanNum(vals[15]), asp: cleanNum(vals[16]), orders: cleanNum(vals[17]), abs: cleanNum(vals[18]), visitors: cleanNum(vals[19]), pageViews: cleanNum(vals[19]), cr: cleanNum(vals[20]) },
                shopee:     { target: cleanNum(vals[21]), gmv: cleanNum(vals[22]), runRate: cleanNum(vals[23]), units: cleanNum(vals[24]), asp: cleanNum(vals[25]), orders: cleanNum(vals[26]), abs: cleanNum(vals[27]), visitors: cleanNum(vals[28]), pageViews: cleanNum(vals[28]), cr: cleanNum(vals[29]) },
                tokopedia:  { target: cleanNum(vals[30]), gmv: cleanNum(vals[31]), runRate: cleanNum(vals[32]), units: cleanNum(vals[33]), asp: cleanNum(vals[34]), orders: cleanNum(vals[35]), abs: cleanNum(vals[36]), visitors: cleanNum(vals[37]), pageViews: cleanNum(vals[37]), cr: cleanNum(vals[38]) },
                total:      { target: cleanNum(vals[39]), gmv: cleanNum(vals[40]), runRate: cleanNum(vals[41]), units: cleanNum(vals[42]), asp: cleanNum(vals[43]), orders: cleanNum(vals[44]), abs: cleanNum(vals[45]), visitors: cleanNum(vals[46]), pageViews: cleanNum(vals[46]), cr: cleanNum(vals[47]) },
              };
            });
        };

        const fetchSupabaseAll = async (table) => {
          try {
            let allData = [];
            let from = 0;
            const pageSize = 1000;
            let hasMore = true;
            
            while (hasMore) {
              const { data, error } = await supabase
                .from(table)
                .select('*')
                .order('day', { ascending: true })
                .range(from, from + pageSize - 1);
              if (error) {
                console.warn(`Supabase fetch failed for ${table}:`, error.message);
                return [];
              }
              if (data && data.length > 0) {
                allData = [...allData, ...data];
                from += pageSize;
                hasMore = data.length === pageSize;
              } else {
                hasMore = false;
              }
            }
            console.log(`Fetched ${allData.length} rows from ${table}`);
            return allData;
          } catch (e) {
            console.warn(`Supabase fetch failed (exception) for ${table}:`, e);
            return [];
          }
        };

        const [tiktokAdsDataRaw, metaAdsDataRaw, googleAdsDataRaw, offsiteData, kolData, criteoDataRaw, ordersRaw, ncoOrdersRaw, metaSupabaseRaw, googleSupabaseRaw, tiktokSupabaseRaw, criteoSupabaseRaw, commandCenterRaw] = await Promise.all([
          fetchCSV(urls.TIKTOK),
          fetchCSV(urls.META),
          fetchCSV(urls.GOOGLE),
          fetchCSV(urls.OFFSITE),
          fetchCSV(urls.KOL),
          fetchCSV(urls.CRITEO),
          fetchCSV(urls.DAILY_ORDERS),
          fetchCSV(urls.NCO_ORDERS),
          fetchSupabaseAll('meta_ads_performance'),
          fetchSupabaseAll('google_ads_performance'),
          fetchSupabaseAll('tiktok_ads_performance'),
          fetchSupabaseAll('criteo_ads_performance'),
          fetchCSV(urls.COMMAND_CENTER)
        ]);
        const metaAdsSupabaseData = metaSupabaseRaw.map(d => ({
          ...d,
          normDate: (d.day || '').substring(0, 10),
          Day: (d.day || '').substring(0, 10),
          'Account name': d.account_name,
          'Campaign name': d.campaign_name,
          'Ad name': d.ad_name,
          'Amount spent (IDR)': d.spend,
          'Reach': d.reach,
          'Impressions': d.impressions,
          'Frequency': d.frequency,
          'Link clicks': d.link_clicks,
          'Video plays at 25%': d.video_p25,
          'Video plays at 50%': d.video_p50,
          'Video plays at 75%': d.video_p75,
          'Video plays at 100%': d.video_p100,
          'Post comments': d.post_comments,
          'Post engagements': d.post_engagements,
          'Post reactions': d.post_reactions,
          'Facebook likes': d.page_likes,
          'Page engagement': d.page_engagements,
          'Views': d.views,
          'PRODUCTS': d.product,
          'Category': d.category,
          'Category Brand': d.category_group,
          'BRAND': d.brand
        }));

        const googleAdsSupabaseData = googleSupabaseRaw.map(d => ({
          ...d,
          normDate: (d.day || '').substring(0, 10),
          Day: (d.day || '').substring(0, 10),
          Campaign: d.campaign_name,
          Cost: d.spend,
          'Impr.': d.impressions,
          Clicks: d.clicks,
          'TrueView views': d.video_views,
          Conversions: d.conversions,
          'Conv. value': d.conversion_value,
          'Video played to 50%': d.video_p50,
          PRODUCTS: d.product,
          BRAND: d.brand
        }));

        const tiktokAdsSupabaseData = tiktokSupabaseRaw.map(d => ({
          ...d,
          normDate: (d.day || '').substring(0, 10),
          'By Day': (d.day || '').substring(0, 10),
          'Campaign name': d.campaign_name,
          'Account name': d.account_name,
          'Ad name': d.ad_name,
          'Advertising objective': d.advertising_objective,
          Cost: d.spend,
          Reach: d.reach,
          Impressions: d.impressions,
          'Clicks (all)': d.clicks,
          'Video views': d.video_views,
          '2-second video views': d.video_2s_views,
          '6-second video views': d.video_6s_views,
          PRODUCTS: d.product,
          BRAND: d.brand
        }));

        // Map Criteo Supabase data to match expected shape
        const criteoSupabaseData = criteoSupabaseRaw.map(d => ({
          ...d,
          normDate: (d.day || '').substring(0, 10),
          Day: (d.day || '').substring(0, 10),
          'Campaign name': d.campaign_name,
          'Ad name': d.ad_name,
          'Amount spent (IDR)': d.spend,
          'Impressions': d.impressions,
          'Clicks': d.clicks,
          'Exposed Users': d.exposed_users,
          'CPC': d.cpc,
          'CPM': d.cpm,
          'Viewability': d.viewability,
          'PRODUCTS': d.product,
          'Category': d.category,
          'Category Brand': d.category_group,
          'BRAND': d.brand
        }));

        // Parse Command Center data with normalized field names
        const commandCenterData = commandCenterRaw.map(row => {
          const parseNum = (val) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return val;
            const cleaned = String(val).replace(/[Rp$\s,]/g, '').replace(/%/g, '').trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          };
          const parsePct = (val) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return val;
            const cleaned = String(val).replace(/[%,]/g, '').trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
          };
          return {
            month: row['Month'] || '',
            monthNum: parseNum(row['M']),
            year: parseNum(row['Y']),
            pic: row['PIC PERFORMANCE TEAM'] || row['PIC PERFORMANCE'] || '',
            digitalStrat: row['DIGITL STRAT'] || '',
            brand: row['Brand'] || '',
            category: row['Category'] || '',
            categoryProduct: row['Category Product'] || row['category product'] || row['category proposal'] || '',
            product: row['Product'] || '',
            budgetOverall: parseNum(row['Budget Overall']),
            estReach: parseNum(row['Est. Reach']),
            estImp: parseNum(row['Est. Imp']),
            estCPM: parseNum(row['Est CPM']),
            budgetMeta: parseNum(row['Budget Meta']),
            estReachMeta: parseNum(row['Est. Reach Meta']),
            estImpMeta: parseNum(row['Est. Imp Meta']),
            budgetTiktok: parseNum(row['Budget Tiktok']),
            estReachTiktok: parseNum(row['Est. Reach Tiktok']),
            estImpTiktok: parseNum(row['Est. Imp Tiktok']),
            budgetSegumento: parseNum(row['Budget Segumento']),
            budgetDisplay: parseNum(row['Budget Display']),
            budgetCriteo: parseNum(row['Budget Criteo']),
            budgetGoogle: parseNum(row['Budget Google']),
            budgetPinterest: parseNum(row['Budget pinterest']),
            spent: parseNum(row['Spent']),
            remainingBudget: parseNum(row['Remaining Budget']),
            pacing: parsePct(row['% Pacing']),
            reach: parseNum(row['Reach']),
            reachPct: parsePct(row['% Reach']),
            impressions: parseNum(row['Imp.']),
            impPct: parsePct(row['% Imp.']),
            spentMeta: parseNum(row['Spent Meta']),
            actualImpMeta: parseNum(row['Actual Imp Meta']),
            actualReachMeta: parseNum(row['Actual Reach Meta']),
            spentTiktok: parseNum(row['Spent Tiktok']),
            actualImpTiktok: parseNum(row['Actual Imp Tiktok']),
            actualReachTiktok: parseNum(row['Actual Reach Tiktok']),
            spentSegumento: parseNum(row['Spent segumento']),
            spentCriteo: parseNum(row['Spent Criteo']),
            spentGoogle: parseNum(row['Spent Google']),
          };
        }).filter(r => r.budgetOverall > 0 || r.spent > 0);
        console.log(`Parsed ${commandCenterData.length} command center rows`);

        setData({
          tiktokAdsData: tiktokAdsSupabaseData.length > 0 ? normalizeAdData(tiktokAdsSupabaseData) : normalizeAdData(tiktokAdsDataRaw),
          metaAdsData: metaAdsSupabaseData.length > 0 ? normalizeAdData(metaAdsSupabaseData) : normalizeAdData(metaAdsDataRaw),
          metaAdsSupabaseData: metaAdsSupabaseData.length > 0 ? normalizeAdData(metaAdsSupabaseData) : normalizeAdData(metaAdsDataRaw),
          googleAdsData: googleAdsSupabaseData.length > 0 ? normalizeAdData(googleAdsSupabaseData) : normalizeAdData(googleAdsDataRaw),
          offsiteData: normalizeAdData(offsiteData),
          kolData,
          criteoData: criteoSupabaseData.length > 0 ? normalizeAdData(criteoSupabaseData) : normalizeAdData(criteoDataRaw),
          ordersData: parseOrdersData(ordersRaw),
          ncoOrdersData: parseNcoOrdersData(ncoOrdersRaw),
          commandCenterData,
          lastSync: getFormattedDate(),
          loading: false,
          error: null
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setData(prev => ({ ...prev, loading: false, error: error.message }));
      }
    };

    fetchAllData();
  }, []);

  return (
    <DataContext.Provider value={{ ...data, refreshCommandCenter }}>
      {children}
    </DataContext.Provider>
  );
};
