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
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    const lastSepPos = Math.max(lastDot, lastComma);
    if (lastSepPos === -1) return parseFloat(s) || 0;
    const charsAfter = s.length - 1 - lastSepPos;
    if (charsAfter === 3) return parseFloat(s.replace(/[.,]/g, '')) || 0;
    const thousands = s.substring(0, lastSepPos).replace(/[.,]/g, '');
    const decimals = s.substring(lastSepPos + 1).replace(/[.,]/g, '');
    return parseFloat(thousands + '.' + decimals) || 0;
  };

  const mapPositionalData = (rawRows) => {
    if (!rawRows || rawRows.length < 1) return [];
    const headers = rawRows[0];
    const getIdx = (name) => {
      const target = name.toLowerCase();
      return headers.findIndex(h => h && h.toLowerCase() === target);
    };

    const S_CR = getIdx('Spent Criteo'), R_CR = getIdx('Actual Reach Criteo'), I_CR = getIdx('Actual Imp Criteo');
    const S_GO = getIdx('Spent Google'), R_GO = getIdx('Actual Reach Google'), I_GO = getIdx('Actual Imp Google');
    const S_ME = getIdx('Spent Meta'), R_ME = getIdx('Actual Reach Meta'), I_ME = getIdx('Actual Imp Meta');
    const S_TT = getIdx('Spent Tiktok'), R_TT = getIdx('Actual Reach Tiktok'), I_TT = getIdx('Actual Imp Tiktok');
    const S_SE = getIdx('Spent segumento'), R_SE = getIdx('Actual Reach segumento'), I_SE = getIdx('Actual Imp segumento');

    return rawRows.slice(1).map(row => {
      if (!row || row.length < 5) return null;
      const p = parseNum;
      const brand = row[getIdx('Brand')] || '';
      const spentTotal = p(row[getIdx('Spent')]);
      const budgetOverall = p(row[getIdx('Budget Overall')]);
      if (!brand && !spentTotal && !budgetOverall) return null;

      return {
        month: row[getIdx('Month')] || '',
        monthNum: p(row[getIdx('M')]),
        year: p(row[getIdx('Y')]),
        pic: row[getIdx('PIC PERFORMANCE TEAM')] || row[getIdx('PIC PERFORMANCE')] || '',
        digitalStrat: row[getIdx('DIGITL STRAT')] || '',
        brand: brand,
        category: row[getIdx('Category')] || '',
        categoryProduct: row[getIdx('Category Product')] || '',
        product: row[getIdx('Product')] || '',
        budgetOverall: budgetOverall,
        spent: spentTotal,
        reach: p(row[getIdx('Reach')]),
        impressions: p(row[getIdx('Imp.')]),
        
        spentMeta: S_ME !== -1 ? p(row[S_ME]) : 0, actualReachMeta: R_ME !== -1 ? p(row[R_ME]) : 0, actualImpMeta: Math.max(I_ME !== -1 ? p(row[I_ME]) : 0, R_ME !== -1 ? p(row[R_ME]) : 0),
        spentTiktok: S_TT !== -1 ? p(row[S_TT]) : 0, actualReachTiktok: R_TT !== -1 ? p(row[R_TT]) : 0, actualImpTiktok: Math.max(I_TT !== -1 ? p(row[I_TT]) : 0, R_TT !== -1 ? p(row[R_TT]) : 0),
        spentSegumento: S_SE !== -1 ? p(row[S_SE]) : 0, actualReachSegumento: R_SE !== -1 ? p(row[R_SE]) : 0, actualImpSegumento: Math.max(I_SE !== -1 ? p(row[I_SE]) : 0, R_SE !== -1 ? p(row[R_SE]) : 0),
        spentCriteo: S_CR !== -1 ? p(row[S_CR]) : 0, actualReachCriteo: R_CR !== -1 ? p(row[R_CR]) : 0, actualImpCriteo: Math.max(I_CR !== -1 ? p(row[I_CR]) : 0, R_CR !== -1 ? p(row[R_CR]) : 0),
        spentGoogle: S_GO !== -1 ? p(row[S_GO]) : 0, actualReachGoogle: R_GO !== -1 ? p(row[R_GO]) : 0, actualImpGoogle: Math.max(I_GO !== -1 ? p(row[I_GO]) : 0, R_GO !== -1 ? p(row[R_GO]) : 0),
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

        const parseDateStr = (s) => {
          if (!s) return null;
          const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12',January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12'};
          const parts = s.trim().split('-');
          if (parts.length < 2) return null;
          return `2026-${months[parts[1]] || '01'}-${String(parts[0]).padStart(2,'0')}`;
        };

        const ordersData = ordersCSV.filter(r => {
          const vals = Object.values(r);
          return vals[2] && String(vals[2]).includes('-');
        }).map(r => {
          const vals = Object.values(r);
          return {
            month: vals[0], week: vals[1], date: vals[2], normDate: parseDateStr(vals[2]),
            tiktokShop: { target: parseNum(vals[4]), gmv: parseNum(vals[5]), runRate: parseNum(vals[6]), units: parseNum(vals[7]), orders: parseNum(vals[9]) },
            lazada: { target: parseNum(vals[14]), gmv: parseNum(vals[15]), runRate: parseNum(vals[16]), units: parseNum(vals[17]), orders: parseNum(vals[19]) },
            shopee: { target: parseNum(vals[24]), gmv: parseNum(vals[25]), runRate: parseNum(vals[26]), units: parseNum(vals[27]), orders: parseNum(vals[29]) },
            tokopedia: { target: parseNum(vals[34]), gmv: parseNum(vals[35]), runRate: parseNum(vals[36]), units: parseNum(vals[37]), orders: parseNum(vals[39]) },
            total: { target: parseNum(vals[44]), gmv: parseNum(vals[45]), runRate: parseNum(vals[46]), units: parseNum(vals[47]), orders: parseNum(vals[49]), visitors: parseNum(vals[52]), cr: parseNum(vals[53]) },
          };
        });

        const ncoOrdersData = ncoCSV.filter(r => {
          const vals = Object.values(r);
          return vals[1] && String(vals[1]).includes('-');
        }).map(r => {
          const vals = Object.values(r);
          return {
            month: vals[0], date: vals[1], normDate: parseDateStr(vals[1]),
            tiktokShop: { target: parseNum(vals[3]), gmv: parseNum(vals[4]), orders: parseNum(vals[8]) },
            lazada: { target: parseNum(vals[12]), gmv: parseNum(vals[13]), orders: parseNum(vals[17]) },
            shopee: { target: parseNum(vals[21]), gmv: parseNum(vals[22]), orders: parseNum(vals[26]) },
            tokopedia: { target: parseNum(vals[30]), gmv: parseNum(vals[31]), orders: parseNum(vals[35]) },
            total: { gmv: parseNum(vals[40]), orders: parseNum(vals[44]) }
          };
        });

        const normalizeAds = (list) => list.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), Campaign: d.campaign_name || d['Campaign name'], Cost: d.spend || d['Amount spent (IDR)'] || d.Cost, Reach: d.reach || d.Reach, Impressions: d.impressions || d.Impressions || d['Impr.'], BRAND: d.brand }));

        const metaMap = normalizeAds(metaSup);
        const googleMap = normalizeAds(googleSup);
        const tiktokMap = normalizeAds(tiktokSup);
        const criteoMap = normalizeAds(criteoSup);

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
        setData(prev => ({ ...prev, loading: false, error: e.message }));
      }
    };
    fetchAllData();
  }, []);

  return <DataContext.Provider value={{ ...data, refreshCommandCenter }}>{children}</DataContext.Provider>;
};
