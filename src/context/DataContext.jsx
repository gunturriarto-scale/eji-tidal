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
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
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
    // Heuristic: if exactly 3 digits after the separator, it's thousands (European style 1.000 or 1,000)
    if (charsAfter === 3) return parseFloat(s.replace(/[.,]/g, '')) || 0;
    // Otherwise, treat as decimal
    const thousands = s.substring(0, lastSepPos).replace(/[.,]/g, '');
    const decimals = s.substring(lastSepPos + 1).replace(/[.,]/g, '');
    return parseFloat(thousands + '.' + decimals) || 0;
  };

  const mapPositionalData = (rawRows) => {
    if (!rawRows || rawRows.length < 2) return [];
    const headers = rawRows[0];
    const getIdx = (name) => {
        const i = headers.indexOf(name);
        return i === -1 ? headers.lastIndexOf(name) : i; // fallback to last instance for dupes
    };

    // Correcting indices based on manual check if possible, or using labels
    const M_IDX = getIdx('Month'), BRAND_IDX = getIdx('Brand'), SPENT_VAL = getIdx('Spent');
    const S_META = getIdx('Spent Meta'), I_META = getIdx('Actual Imp Meta'), R_META = getIdx('Actual Reach Meta');
    const S_TT = getIdx('Spent Tiktok'), I_TT = getIdx('Actual Imp Tiktok'), R_TT = getIdx('Actual Reach Tiktok');
    const S_SE = getIdx('Spent segumento'), I_SE = getIdx('Actual Imp segumento'), R_SE = getIdx('Actual Reach segumento');
    const S_CR = getIdx('Spent Criteo'), I_CR = getIdx('Actual Imp Criteo'), R_CR = getIdx('Actual Reach Criteo');
    const S_GO = getIdx('Spent Google'), I_GO = getIdx('Actual Imp Google'), R_GO = getIdx('Actual Reach Google');

    return rawRows.slice(1).map(row => {
      const p = parseNum;
      const spent = p(row[SPENT_VAL]);
      const brand = row[BRAND_IDX] || '';
      if (!brand && !spent) return null;

      const spentCriteo = p(row[S_CR]);
      const reachCriteo = p(row[R_CR]);
      const impCriteo = p(row[I_CR]);

      const spentGoogle = p(row[S_GO]);
      const reachGoogle = p(row[R_GO]);
      const impGoogle = p(row[I_GO]);

      const spentMeta = p(row[S_META]);
      const reachMeta = p(row[R_META]);
      const impMeta = p(row[I_META]);

      return {
        month: row[M_IDX] || '',
        brand: brand,
        pic: row[getIdx('PIC PERFORMANCE TEAM')] || '',
        category: row[getIdx('Category')] || '',
        product: row[getIdx('Product')] || '',
        budgetOverall: p(row[getIdx('Budget Overall')]),
        spent: spent,
        reach: p(row[getIdx('Reach')]),
        impressions: p(row[getIdx('Imp.')]),
        
        spentMeta, actualReachMeta: reachMeta, actualImpMeta: Math.max(impMeta, reachMeta),
        spentTiktok: p(row[S_TT]), actualReachTiktok: p(row[R_TT]), actualImpTiktok: Math.max(p(row[I_TT]), p(row[R_TT])),
        spentSegumento: p(row[S_SE]), actualReachSegumento: p(row[R_SE]), actualImpSegumento: Math.max(p(row[I_SE]), p(row[R_SE])),
        spentCriteo, actualReachCriteo: reachCriteo, actualImpCriteo: Math.max(impCriteo, reachCriteo),
        spentGoogle, actualReachGoogle: reachGoogle, actualImpGoogle: Math.max(impGoogle, reachGoogle),
      };
    }).filter(r => r !== null && (r.spent > 0 || r.budgetOverall > 0));
  };

  const refreshCommandCenter = async () => {
    setData(prev => ({ ...prev, isRefreshing: true }));
    try {
      const url = `https://docs.google.com/spreadsheets/d/${command_center_sheet_id}/gviz/tq?tqx=out:csv&gid=0`;
      const res = await fetch(url);
      const text = await res.text();
      const raw = Papa.parse(text, { header: false }).data;
      const newData = mapPositionalData(raw);
      setData(prev => ({ ...prev, commandCenterData: newData, lastSync: getFormattedDate(), isRefreshing: false }));
    } catch (err) {
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
          return Papa.parse(text, { header: true, skipEmptyLines: true }).data.map(cleanNumbers);
        };

        const fetchSupabaseAll = async (table) => {
          let allData = [];
          let from = 0;
          const pageSize = 1000;
          let hasMore = true;
          while (hasMore) {
            const { data, error } = await supabase.from(table).select('*').order('day', { ascending: true }).range(from, from + pageSize - 1);
            if (error) return [];
            if (data && data.length > 0) {
              allData = [...allData, ...data];
              from += pageSize;
              hasMore = data.length === pageSize;
            } else hasMore = false;
          }
          return allData;
        };

        const [offsiteRaw, kolRaw, ordersRaw, ncoOrdersRaw, metaSupabaseRaw, googleSupabaseRaw, tiktokSupabaseRaw, criteoSupabaseRaw] = await Promise.all([
          fetchCSV(urls.OFFSITE),
          fetchCSV(urls.KOL),
          fetchCSV(urls.DAILY_ORDERS),
          fetchCSV(urls.NCO_ORDERS),
          fetchSupabaseAll('meta_ads_performance'),
          fetchSupabaseAll('google_ads_performance'),
          fetchSupabaseAll('tiktok_ads_performance'),
          fetchSupabaseAll('criteo_ads_performance'),
        ]);

        const url = `https://docs.google.com/spreadsheets/d/${command_center_sheet_id}/gviz/tq?tqx=out:csv&gid=0`;
        const resCC = await fetch(url);
        const textCC = await resCC.text();
        const commandCenterRawArray = Papa.parse(textCC, { header: false }).data;

        setData({
          metaAdsData: metaSupabaseRaw.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), Campaign: d.campaign_name, 'Amount spent (IDR)': d.spend, 'Reach': d.reach, 'Impressions': d.impressions, BRAND: d.brand })),
          googleAdsData: googleSupabaseRaw.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), Campaign: d.campaign_name, Cost: d.spend, 'Impr.': d.impressions, BRAND: d.brand })),
          tiktokAdsData: tiktokSupabaseRaw.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), 'By Day': (d.day || '').substring(0, 10), 'Campaign name': d.campaign_name, Cost: d.spend, BRAND: d.brand })),
          criteoData: criteoSupabaseRaw.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), 'Amount spent (IDR)': d.spend, BRAND: d.brand })),
          offsiteData: offsiteRaw,
          kolData: kolRaw,
          ordersData: ordersRaw.map(r => ({ ...r, orderDate: r.Date || r['By Day'] || r['Day'] || '', grandTotal: parseNum(r['Grand Total']), totalOrders: parseNum(r['Total Orders']) })),
          ncoOrdersData: ncoOrdersRaw.map(r => ({ ...r, orderDate: r.Day || r.Date || '', grandTotal: parseNum(r['Total Grand']), totalOrders: parseNum(r['Total Orders']) })),
          commandCenterData: mapPositionalData(commandCenterRawArray),
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

  return <DataContext.Provider value={{ ...data, refreshCommandCenter }}>{children}</DataContext.Provider>;
};
