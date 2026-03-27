import React, { createContext, useContext, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

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
        let raw = cleaned[key].replace(/[Rp\s]/g, '');
        if (raw.includes('.') && raw.includes(',')) {
            raw = raw.replace(/\./g, '').replace(',', '.');
        } else if (raw.includes('.') && raw.split('.').pop().length === 3) {
            raw = raw.replace(/\./g, '');
        } else if (raw.includes(',') && raw.split(',').pop().length === 3) {
            raw = raw.replace(/,/g, '');
        }
        const val = parseFloat(raw);
        if (!isNaN(val)) cleaned[key] = val;
      } else if (!isNaN(withoutCommas) && withoutCommas.trim() !== '' && !cleaned[key].includes('%')) {
        cleaned[key] = Number(withoutCommas);
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
    return `${day}/${month}/${today.getFullYear()} ${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}`;
  };

  const parseNum = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    let s = String(val).replace(/[Rp$\s%]/g, '').trim();
    if (!s) return 0;
    // Handle European vs US style numbers specifically for Spent
    const lastSepPos = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
    if (lastSepPos === -1) return parseFloat(s) || 0;
    if (s.length - 1 - lastSepPos === 3) return parseFloat(s.replace(/[.,]/g, '')) || 0;
    const thousands = s.substring(0, lastSepPos).replace(/[.,]/g, '');
    const decimals = s.substring(lastSepPos + 1).replace(/[.,]/g, '');
    return parseFloat(thousands + '.' + decimals) || 0;
  };

  const mapPositionalData = (rawRows) => {
    if (!rawRows || rawRows.length < 2) return [];
    
    // POSITIONAL MAPPING V10 (Based on User's A-CX Mapping Table)
    // IMPORTANT: Column addresses are 1-based in User Table (A=1), so we subtract 1.
    return rawRows.slice(1).map(row => {
      const p = parseNum;
      const brand = row[5] || ''; // F=6th column = index 5
      const spentTotal = p(row[75]); // BX=76th column = index 75
      const budgetOverall = p(row[9]); // J=10th column = index 9
      if (!brand && !spentTotal && !budgetOverall) return null;

      const spentCriteo = p(row[94]); // CQ=95 = index 94
      const impCriteo = p(row[96]); // CS=97 = index 96
      const reachCriteo = p(row[95]); // CR=96 = index 95

      return {
        month: row[0] || '',
        monthNum: p(row[1]),
        year: p(row[2]),
        pic: row[3] || '', // D=4 = index 3
        digitalStrat: row[4] || '', // E=5 = index 4
        brand: brand,
        category: row[6] || '', // G=7 = index 6
        categoryProduct: row[7] || '', // H=8 = index 7
        product: row[8] || '', // I=9 = index 8
        budgetOverall: budgetOverall,
        spent: spentTotal,
        reach: p(row[78]), // CA=79 = index 78
        impressions: p(row[80]), // CC=81 = index 80
        estImp: p(row[11]), // L=12 = index 11
        
        // INDIVIDUAL BUDGETS (for Efficiency Matrix)
        budgetMeta: p(row[21]), // V=22 = index 21
        budgetTiktok: p(row[39]), // AN=40 = index 39
        budgetSegumento: p(row[60]), // BI=61 = index 60
        budgetCriteo: p(row[66]), // BO=67 = index 66
        budgetGoogle: p(row[69]), // BR=70 = index 69

        // PERFORMANCE ACTUALS
        spentMeta: p(row[82]), actualReachMeta: p(row[84]), actualImpMeta: Math.max(p(row[83]), p(row[84])), // CE/CF/CG
        spentTiktok: p(row[85]), actualReachTiktok: p(row[87]), actualImpTiktok: Math.max(p(row[86]), p(row[87])), // CH/CI/CJ
        spentSegumento: p(row[88]), actualReachSegumento: p(row[89]), actualImpSegumento: Math.max(p(row[90]), p(row[89])), // CK/CL/CM
        spentCriteo, actualReachCriteo: reachCriteo, actualImpCriteo: Math.max(impCriteo, reachCriteo),
        spentGoogle: p(row[97]), actualReachGoogle: p(row[98]), actualImpGoogle: Math.max(p(row[99]), p(row[98])), // CT/CU/CV
      };
    }).filter(r => r !== null);
  };

  const refreshCommandCenter = async () => {
    setData(prev => ({ ...prev, isRefreshing: true }));
    try {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${command_center_sheet_id}/gviz/tq?tqx=out:csv&gid=0`);
      const text = await res.text();
      const raw = Papa.parse(text, { header: false }).data;
      setData(prev => ({ ...prev, commandCenterData: mapPositionalData(raw), lastSync: getFormattedDate(), isRefreshing: false }));
    } catch (err) {
      setData(prev => ({ ...prev, isRefreshing: false }));
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const fetchCSV = async (url) => {
          const res = await fetch(url);
          const t = await res.text();
          return Papa.parse(t, { header: true, skipEmptyLines: true }).data.map(cleanNumbers);
        };
        const fetchSupabaseAll = async (table) => {
          let { data, error } = await supabase.from(table).select('*').limit(4000);
          return error ? [] : data;
        };

        const [offsite, kol, ordersCSV, ncoCSV, metaSup, googleSup, tiktokSup, criteoSup] = await Promise.all([
          fetchCSV(urls.OFFSITE), fetchCSV(urls.KOL), fetchCSV(urls.DAILY_ORDERS), fetchCSV(urls.NCO_ORDERS),
          fetchSupabaseAll('meta_ads_performance'), fetchSupabaseAll('google_ads_performance'),
          fetchSupabaseAll('tiktok_ads_performance'), fetchSupabaseAll('criteo_ads_performance')
        ]);

        const resCC = await fetch(`https://docs.google.com/spreadsheets/d/${command_center_sheet_id}/gviz/tq?tqx=out:csv&gid=0`);
        const textCC = await resCC.text();
        const ccRows = Papa.parse(textCC, { header: false }).data;

        // Specialized Orders/NCO Parsers
        const parseDateStr = (s) => {
          if (!s) return null;
          const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
          const parts = s.trim().split('-');
          if (parts.length < 2) return null;
          return `2026-${months[parts[1]] || '01'}-${String(parts[0]).padStart(2,'0')}`;
        };

        const ordersData = ordersCSV.filter(r => {
          const vals = Object.values(r);
          return vals[2] && String(vals[2]).includes('-');
        }).map(r => {
          const v = Object.values(r);
          return {
            month: v[0], week: v[1], date: v[2], normDate: parseDateStr(v[2]),
            tiktokShop: { target: parseNum(v[4]), gmv: parseNum(v[5]), runRate: parseNum(v[6]), units: parseNum(v[7]), orders: parseNum(v[9]) },
            lazada: { target: parseNum(v[14]), gmv: parseNum(v[15]), runRate: parseNum(v[16]), units: parseNum(v[17]), orders: parseNum(v[19]) },
            shopee: { target: parseNum(v[24]), gmv: parseNum(v[25]), runRate: parseNum(v[26]), units: parseNum(v[27]), orders: parseNum(v[29]) },
            tokopedia: { target: parseNum(v[34]), gmv: parseNum(v[35]), runRate: parseNum(v[36]), units: parseNum(v[37]), orders: parseNum(v[39]) },
            total: { target: parseNum(v[44]), gmv: parseNum(v[45]), runRate: parseNum(v[46]), units: parseNum(v[47]), orders: parseNum(v[49]), visitors: parseNum(v[52]), cr: parseNum(v[53]) },
          };
        });

        const ncoOrdersData = ncoCSV.filter(r => {
          const vals = Object.values(r);
          return vals[1] && String(vals[1]).includes('-');
        }).map(r => {
          const v = Object.values(r);
          return {
            month: v[0], date: v[1], normDate: parseDateStr(v[1]),
            tiktokShop: { target: parseNum(v[3]), gmv: parseNum(v[4]), orders: parseNum(v[8]) },
            lazada: { target: parseNum(v[12]), gmv: parseNum(v[13]), orders: parseNum(v[17]) },
            shopee: { target: parseNum(v[21]), gmv: parseNum(v[22]), orders: parseNum(v[26]) },
            tokopedia: { target: parseNum(v[30]), gmv: parseNum(v[31]), orders: parseNum(v[35]) },
            total: { gmv: parseNum(v[40]), orders: parseNum(v[44]) }
          };
        });

        const normAds = (list) => list.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), Campaign: d.campaign_name || d['Campaign name'], Cost: d.spend || d['Amount spent (IDR)'] || d.Cost, Reach: d.reach || d.Reach, Impressions: d.impressions || d.Impressions || d['Impr.'], BRAND: d.brand }));

        const metaMap = normAds(metaSup);
        const googleMap = normAds(googleSup);
        const tiktokMap = normAds(tiktokSup);
        const criteoMap = normAds(criteoSup);

        setData({
          tiktokAdsData: tiktokMap,
          metaAdsData: metaMap,
          metaAdsSupabaseData: metaMap,
          googleAdsData: googleMap,
          offsiteData: offsite,
          kolData: kol,
          criteoData: criteoMap,
          ordersData,
          ncoOrdersData,
          commandCenterData: mapPositionalData(ccRows),
          lastSync: getFormattedDate(),
          loading: false,
          error: null
        });
      } catch (e) {
        console.error("Fetch Error:", e);
        setData(prev => ({ ...prev, loading: false, error: e.message }));
      }
    };
    fetchAllData();
  }, []);

  return <DataContext.Provider value={{ ...data, refreshCommandCenter }}>{children}</DataContext.Provider>;
};
