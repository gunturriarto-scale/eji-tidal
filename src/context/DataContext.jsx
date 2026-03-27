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
  const dateField = cleaned['Date(DD/MM/YYYY)'] || cleaned['Date Posting'] || cleaned['Aim Date Posting'] || cleaned['By Day'] || cleaned['Day'] || cleaned['normDate'];
  if (dateField && typeof dateField === 'string') {
      const parts = dateField.split('/');
      const dashParts = dateField.split('-');
      const spaceParts = dateField.split(' ');
      if (parts.length === 3) {
          cleaned.normDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (dashParts.length === 3) {
          cleaned.normDate = dateField.substring(0, 10);
      } else if (spaceParts.length === 3) {
          const months = { 'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06', 'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12' };
          const day = spaceParts[0].padStart(2, '0');
          const month = months[spaceParts[1].toLowerCase()];
          const year = spaceParts[2];
          if (month) cleaned.normDate = `${year}-${month}-${day}`;
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

  const getRawSheetData = async (gid) => {
    const url = `https://docs.google.com/spreadsheets/d/${command_center_sheet_id}/gviz/tq?tqx=out:csv&gid=${gid}`;
    const response = await fetch(url);
    const text = await response.text();
    return Papa.parse(text, { header: false }).data;
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
    return rawRows.slice(2).map(row => {
      const p = parseNum;
      // Index Mapping: A=0, B=1, ... CQ=94, CR=95, CS=96, CT=97, CU=98, CV=99
      const rowBase = {
        month: row[0] || '',
        monthNum: p(row[1]),
        year: p(row[2]),
        pic: row[3] || '',
        digitalStrat: row[4] || '',
        brand: row[5] || '',
        budgetOverall: p(row[12]),
        spent: p(row[92]),
        impressions: p(row[90]),
        reach: p(row[88]),
      };

      // Platform pairs: Spent, Reach, Imp
      // Meta: 69, 70, 71 | Tiktok: 75, 76, 77 | Segu: 81, 82, 83 | Criteo: 94, 95, 96 | Google: 100, 101, 102
      return {
        ...rowBase,
        spentMeta: p(row[69]), actualReachMeta: p(row[70]), actualImpMeta: Math.max(p(row[71]), p(row[70])),
        spentTiktok: p(row[75]), actualReachTiktok: p(row[76]), actualImpTiktok: Math.max(p(row[77]), p(row[76])),
        spentSegumento: p(row[81]), actualReachSegumento: p(row[82]), actualImpSegumento: Math.max(p(row[83]), p(row[82])),
        spentCriteo: p(row[94]), actualReachCriteo: p(row[95]), actualImpCriteo: Math.max(p(row[96]), p(row[95])),
        spentGoogle: p(row[100]), actualReachGoogle: p(row[101]), actualImpGoogle: Math.max(p(row[102]), p(row[101])),
      };
    }).filter(r => r.spent > 0 || r.budgetOverall > 0 || r.brand !== '');
  };

  const refreshCommandCenter = async () => {
    setData(prev => ({ ...prev, isRefreshing: true }));
    try {
      const rawData = await getRawSheetData(0); 
      const newData = mapPositionalData(rawData);
      setData(prev => ({ ...prev, commandCenterData: newData, lastSync: getFormattedDate(), isRefreshing: false }));
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

        const [ordersRaw, ncoOrdersRaw, metaSupabaseRaw, googleSupabaseRaw, tiktokSupabaseRaw, criteoSupabaseRaw, commandCenterRaw] = await Promise.all([
          fetchCSV(urls.DAILY_ORDERS),
          fetchCSV(urls.NCO_ORDERS),
          fetchSupabaseAll('meta_ads_performance'),
          fetchSupabaseAll('google_ads_performance'),
          fetchSupabaseAll('tiktok_ads_performance'),
          fetchSupabaseAll('criteo_ads_performance'),
          getRawSheetData(0)
        ]);

        const parseOrdersData = (raw) => raw.map(r => ({ ...r, orderDate: r.Date || r['By Day'] || r['Day'] || '', grandTotal: parseNum(r['Grand Total']), totalOrders: parseNum(r['Total Orders']), brand: r.Brand || '-' }));
        const parseNcoOrdersData = (raw) => raw.map(r => ({ ...r, orderDate: r.Day || r.Date || '', brand: 'NCO', grandTotal: parseNum(r['Total Grand']), totalOrders: parseNum(r['Total Orders']) }));

        setData({
          metaAdsData: metaSupabaseRaw.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), Campaign: d.campaign_name, 'Amount spent (IDR)': d.spend, 'Reach': d.reach, 'Impressions': d.impressions, 'Frequency': d.frequency, 'Link clicks': d.link_clicks, 'PRODUCTS': d.product, 'Category': d.category, 'Category Brand': d.category_group, 'BRAND': d.brand })),
          googleAdsData: googleSupabaseRaw.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), Campaign: d.campaign_name, Cost: d.spend, 'Impr.': d.impressions, Clicks: d.clicks, Conversions: d.conversions, 'Conv. value': d.conversion_value, PRODUCTS: d.product, BRAND: d.brand })),
          tiktokAdsData: tiktokSupabaseRaw.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), 'By Day': (d.day || '').substring(0, 10), 'Campaign name': d.campaign_name, Cost: d.spend, Reach: d.reach, Impressions: d.impressions, 'Clicks (all)': d.clicks, PRODUCTS: d.product, BRAND: d.brand })),
          criteoData: criteoSupabaseRaw.map(d => ({ ...d, normDate: (d.day || '').substring(0, 10), Day: (d.day || '').substring(0, 10), 'Campaign name': d.campaign_name, 'Amount spent (IDR)': d.spend, 'Impressions': d.impressions, 'Clicks': d.clicks, 'BRAND': d.brand })),
          ordersData: parseOrdersData(ordersRaw),
          ncoOrdersData: parseNcoOrdersData(ncoOrdersRaw),
          commandCenterData: mapPositionalData(commandCenterRaw),
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
