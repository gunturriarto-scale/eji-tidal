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
    const year = today.getFullYear();
    let hours = today.getHours();
    return `${day}/${month}/${year} ${hours}:${String(today.getMinutes()).padStart(2, '0')}`;
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
      const i = headers.indexOf(name);
      return i === -1 ? headers.lastIndexOf(name) : i;
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

      const spentCriteo = S_CR !== -1 ? p(row[S_CR]) : 0;
      const reachCriteo = R_CR !== -1 ? p(row[R_CR]) : 0;
      const impCriteo = I_CR !== -1 ? p(row[I_CR]) : 0;

      return {
        month: row[getIdx('Month')] || '',
        brand: brand,
        pic: row[getIdx('PIC PERFORMANCE TEAM')] || '',
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
        spentCriteo, actualReachCriteo: reachCriteo, actualImpCriteo: Math.max(impCriteo, reachCriteo),
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
          let { data, error } = await supabase.from(table).select('*').limit(3000);
          return error ? [] : data;
        };

        const [offsite, kol, orders, nco, metaSupVal, googleSupVal, tiktokSupVal, criteoSupVal] = await Promise.all([
          fetchCSV(urls.OFFSITE), fetchCSV(urls.KOL), fetchCSV(urls.DAILY_ORDERS), fetchCSV(urls.NCO_ORDERS),
          fetchSupabaseAll('meta_ads_performance'), fetchSupabaseAll('google_ads_performance'),
          fetchSupabaseAll('tiktok_ads_performance'), fetchSupabaseAll('criteo_ads_performance')
        ]);

        const resCC = await fetch(`https://docs.google.com/spreadsheets/d/${command_center_sheet_id}/gviz/tq?tqx=out:csv&gid=0`);
        const textCC = await resCC.text();
        const ccRows = Papa.parse(textCC, { header: false }).data;

        const metaMap = metaSupVal.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), Campaign: d.campaign_name, 'Amount spent (IDR)': d.spend, 'Reach': d.reach, 'Impressions': d.impressions, BRAND: d.brand }));
        const googleMap = googleSupVal.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), Campaign: d.campaign_name, Cost: d.spend, 'Impr.': d.impressions, BRAND: d.brand }));
        const tiktokMap = tiktokSupVal.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), 'By Day': (d.day || '').substring(0, 10), 'Campaign name': d.campaign_name, Cost: d.spend, Impressions: d.impressions, BRAND: d.brand }));
        const criteoMap = criteoSupVal.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), 'Amount spent (IDR)': d.spend, 'Impressions': d.impressions, BRAND: d.brand }));

        setData({
          tiktokAdsData: tiktokMap,
          metaAdsData: metaMap,
          metaAdsSupabaseData: metaMap,
          googleAdsData: googleMap,
          offsiteData: offsite,
          kolData: kol,
          criteoData: criteoMap,
          ordersData: orders.map(r => ({ ...r, orderDate: r.Date || r['By Day'] || '', grandTotal: parseNum(r['Grand Total']), totalOrders: parseNum(r['Total Orders']) })),
          ncoOrdersData: nco.map(r => ({ ...r, orderDate: r.Day || '', grandTotal: parseNum(r['Total Grand']), totalOrders: parseNum(r['Total Orders']) })),
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
