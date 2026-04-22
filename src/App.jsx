import React, { useState, useMemo } from 'react'
import { ShopeeView } from './views/ShopeeView'
import { TikTokShopView } from './views/TikTokShopView'
import { LazadaView } from './views/LazadaView'
import { TokopediaView } from './views/TokopediaView'
import { EcommerceView } from './views/EcommerceView'
import { Sidebar } from './components/Sidebar'
import { CommandCenterView } from './views/CommandCenterView'
import { useData } from './context/DataContext'
import { useAuth } from './context/AuthContext'
import { LoginView } from './views/LoginView'
import { MetaRaw } from './views/MetaRaw'
import { GmvMaxView } from './views/GmvMaxView'
import { KolView } from './views/KOLView'
import { MetaAnalytics } from './views/MetaAnalytics'

const Header = ({ 
  dateFilter, setDateFilter, 
  customStart, setCustomStart, 
  customEnd, setCustomEnd, 
  activeViewName,
  activeView,
  filterOptions,
  productFilter, setProductFilter,
  categoryBrandFilter, setCategoryBrandFilter,
  categoryFilter, setCategoryFilter,
  brandFilter, setBrandFilter
}) => {
  const { lastSync, isRefreshing, refreshCommandCenter } = useData();

  return (
    <div className="header fade-in" style={{ 
      marginBottom: '2rem', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50, 
      background: 'var(--bg-main)', 
      backdropFilter: 'blur(10px)', 
      padding: '0.75rem 0',
      borderBottom: '1px solid var(--border-color)' 
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="title-section">
            <h1 className="gradient-text" style={{ fontSize: '1.75rem', margin: 0 }}>{activeViewName}</h1>
            <p style={{ margin: 0, opacity: 0.6 }}>Real-time performance distribution & analysis</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {activeView === 'commandCenter' && (
              <button 
                onClick={refreshCommandCenter}
                disabled={isRefreshing}
                style={{
                  background: 'rgba(55, 66, 250, 0.1)',
                  color: '#3742fa',
                  border: '1px solid rgba(55, 66, 250, 0.2)',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: isRefreshing ? 'wait' : 'pointer',
                  opacity: isRefreshing ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {isRefreshing ? 'Refreshing...' : '🔄 Pull Data'}
              </button>
            )}
            <div className="status-indicator" style={{ background: 'rgba(16, 185, 129, 0.03)', padding: '0.5rem 0.85rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.08)' }}>
              <div className="status-dot"></div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                {activeView === 'commandCenter' && lastSync ? `Last Sync: ${lastSync}` : 'Sync: Live Data'}
              </span>
            </div>
          </div>
        </div>

        {!['creativehub', 'commandCenter', 'gmvMax', 'kol', 'metaAnalytics'].includes(activeView) && (
          <div className="filter-deck" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end' }}>
              <div className="filter-group" style={{ flex: 'none', width: '160px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Period</label>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="glass-select"
                  style={{ height: '38px' }}
                >
                  <option value="all">All Time</option>
                  <option value="last7">Last 7 Days</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="custom">Custom Date</option>
                </select>
              </div>

              {dateFilter === 'custom' && (
                <div className="filter-group fade-in" style={{ flex: 'none', width: '300px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Range</label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input 
                      type="date" 
                      value={customStart} 
                      onChange={e => setCustomStart(e.target.value)}
                      className="glass-input"
                      style={{ height: '38px', flex: 1 }}
                      max={customEnd || undefined}
                    />
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>-</span>
                    <input 
                      type="date" 
                      value={customEnd} 
                      onChange={e => setCustomEnd(e.target.value)}
                      className="glass-input"
                      style={{ height: '38px', flex: 1 }}
                      min={customStart || undefined}
                    />
                  </div>
                </div>
              )}
            </div>

            {!['shopee', 'tiktokShop', 'lazada', 'tokopedia'].includes(activeView) && (
              <div style={{ display: 'flex', gap: '1.25rem', flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem 8px', flex: 'none' }}></div>
                <div className="filter-group" style={{ flex: 'none', width: '160px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="glass-select"
                    style={{ height: '38px' }}
                  >
                    <option value="all">All Categories</option>
                    {filterOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="filter-group" style={{ flex: 'none', width: '160px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category Brand</label>
                  <select 
                    value={categoryBrandFilter} 
                    onChange={(e) => setCategoryBrandFilter(e.target.value)}
                    className="glass-select"
                    style={{ height: '38px' }}
                  >
                    <option value="all">All Category Brands</option>
                    {filterOptions.categoryBrands.map(cb => <option key={cb} value={cb}>{cb}</option>)}
                  </select>
                </div>
                <div className="filter-group" style={{ flex: 'none', width: '160px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</label>
                  <select 
                    value={productFilter} 
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="glass-select"
                    style={{ height: '38px' }}
                  >
                    <option value="all">All Products</option>
                    {filterOptions.products.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const { user, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState('commandCenter');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { 
    tiktokAdsData, metaAdsData, metaAdsSupabaseData, googleAdsData, offsiteData, kolData, criteoData, ordersData, ncoOrdersData,
    commandCenterData, gmvMaxData,
    loading, error 
  } = useData();

  const initialFilters = {
    dateFilter: 'all', customStart: '', customEnd: '', productFilter: 'all', categoryBrandFilter: 'all', categoryFilter: 'all', brandFilter: 'all'
  };

  const [viewFilters, setViewFilters] = useState({
    shopee: { ...initialFilters, dateFilter: 'thisMonth' },
    tiktokShop: { ...initialFilters, dateFilter: 'thisMonth' },
    lazada: { ...initialFilters, dateFilter: 'thisMonth' },
    tokopedia: { ...initialFilters, dateFilter: 'thisMonth' },
    shopeeNco: { ...initialFilters, dateFilter: 'thisMonth' },
    tiktokShopNco: { ...initialFilters, dateFilter: 'thisMonth' },
    lazadaNco: { ...initialFilters, dateFilter: 'thisMonth' },
    tokopediaNco: { ...initialFilters, dateFilter: 'thisMonth' },
    commandCenter: { ...initialFilters },
    gmvMax: { ...initialFilters },
    perfMarketing: { ...initialFilters, dateFilter: 'last30' }
  });

  const currentFilters = viewFilters[activeView] || initialFilters;

  const updateFilter = (key, value) => {
    setViewFilters(prev => ({
      ...prev, [activeView]: { ...prev[activeView], [key]: value }
    }));
  };

  const filterOptions = useMemo(() => {
    if (loading) return { products: [], categoryBrands: [], categories: [], brands: [] };
    const products = new Set(); const categoryBrands = new Set(); const categories = new Set(); const brands = new Set();
    const toTitleCase = (str) => (!str || str === '-') ? '-' : str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const addFromArr = (arr) => arr?.forEach(d => {
      if (d.PRODUCTS && d.PRODUCTS !== '-') products.add(toTitleCase(d.PRODUCTS));
      if (d['Category Brand'] && d['Category Brand'] !== '-') categoryBrands.add(toTitleCase(d['Category Brand']));
      if (d.Category && d.Category !== '-') categories.add(toTitleCase(d.Category));
      if (d.BRAND && d.BRAND !== '-') brands.add(toTitleCase(d.BRAND));
    });
    addFromArr(tiktokAdsData); addFromArr(metaAdsData); addFromArr(googleAdsData); addFromArr(metaAdsSupabaseData); addFromArr(criteoData);
    const sort = (s) => Array.from(s).sort();
    return { products: sort(products), categoryBrands: sort(categoryBrands), categories: sort(categories), brands: sort(brands) };
  }, [tiktokAdsData, metaAdsData, googleAdsData, criteoData, loading]);

  const maxDateRaw = useMemo(() => {
    if (loading || !tiktokAdsData) return new Date().toISOString().split('T')[0];
    let max = '2000-01-01';
    const check = (d) => { if (d && d > max) max = d; };
    tiktokAdsData.forEach(d => check(d.normDate));
    metaAdsData.forEach(d => check(d.normDate));
    googleAdsData.forEach(d => check(d.normDate));
    kolData.forEach(d => check(d.normDate));
    metaAdsSupabaseData.forEach(d => check(d.normDate));
    criteoData.forEach(d => check(d.normDate));
    offsiteData.forEach(d => check(d.normDate));
    return max !== '2000-01-01' ? max : new Date().toISOString().split('T')[0];
  }, [tiktokAdsData, metaAdsData, googleAdsData, kolData, criteoData, offsiteData, loading]);

  const dateRange = useMemo(() => {
    const { dateFilter, customStart, customEnd } = currentFilters;
    if (dateFilter === 'all') return { start: '2000-01-01', end: '2099-12-31', compStart: '2000-01-01' };
    if (dateFilter === 'custom') {
      const start = customStart || '2000-01-01'; const end = customEnd || '2099-12-31';
      const s = new Date(start); const e = new Date(end); const diff = e.getTime() - s.getTime();
      const compS = new Date(s.getTime() - diff - 86400000);
      return { start, end, compStart: compS.toISOString().split('T')[0] };
    }
    const today = new Date(maxDateRaw); let start = new Date(today); let end = new Date(today);
    if (dateFilter === 'last7') start.setDate(today.getDate() - 6);
    else if (dateFilter === 'last30') start.setDate(today.getDate() - 29);
    else if (dateFilter === 'thisMonth') { start = new Date(today.getFullYear(), today.getMonth(), 1); end = new Date(today.getFullYear(), today.getMonth() + 1, 0); }
    else if (dateFilter === 'lastMonth') { start = new Date(today.getFullYear(), today.getMonth() - 1, 1); end = new Date(today.getFullYear(), today.getMonth(), 0); }
    const fmt = (d) => d.toISOString().split('T')[0];
    let compS = new Date(start);
    if (dateFilter === 'last7') compS.setDate(start.getDate() - 7);
    else if (dateFilter === 'last30') compS.setDate(start.getDate() - 30);
    else if (dateFilter === 'thisMonth' || dateFilter === 'lastMonth') compS = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    return { start: fmt(start), end: fmt(end), compStart: fmt(compS) };
  }, [currentFilters, maxDateRaw]);

  const matchesAttributes = (d) => {
    if (!d) return false;
    const { productFilter, categoryBrandFilter, categoryFilter, brandFilter } = currentFilters;
    const equalsCI = (val, target) => {
      if (target === 'all') return true;
      if (!val || val === '-') return false;
      return val.trim().toLowerCase() === target.trim().toLowerCase();
    };
    return equalsCI(d.PRODUCTS, productFilter) && equalsCI(d['Category Brand'], categoryBrandFilter) && equalsCI(d.Category, categoryFilter) && equalsCI(d.BRAND, brandFilter);
  };

  const isMatch = (d, isKOL = false) => {
    if (!d) return false;
    const dateMatch = !d.normDate || (d.normDate >= dateRange.start && d.normDate <= dateRange.end);
    if (!dateMatch) return false;
    if (!isKOL && !matchesAttributes(d)) return false;
    return true;
  };

  const filteredData = useMemo(() => {
    if (loading) return null;
    return {
      tiktok: tiktokAdsData.filter(d => isMatch(d, false)), meta: metaAdsSupabaseData.filter(d => isMatch(d, false)),
      google: googleAdsData.filter(d => isMatch(d, false)), kol: kolData.filter(d => isMatch(d, true)),
      criteo: criteoData.filter(d => isMatch(d, false)), offsite: offsiteData.filter(d => isMatch(d, false)),
      orders: ordersData.filter(row => !row.normDate || (row.normDate >= dateRange.start && row.normDate <= dateRange.end)),
      ncoOrders: ncoOrdersData.filter(row => !row.normDate || (row.normDate >= dateRange.start && row.normDate <= dateRange.end)),
      commandCenter: commandCenterData,
      gmvMax: gmvMaxData,
      kpiDates: (() => {
        const all = new Set();
        const check = (arr, isKOL = false) => arr?.forEach(d => { if (isKOL || matchesAttributes(d)) { if (d.normDate >= dateRange.compStart && d.normDate <= dateRange.end) all.add(d.normDate); } });
        check(tiktokAdsData, false); check(metaAdsData, false); check(metaAdsSupabaseData, false); check(googleAdsData, false); check(offsiteData, false); check(criteoData, false);
        return Array.from(all).sort((a,b) => new Date(a) - new Date(b));
      })()
    };
  }, [tiktokAdsData, metaAdsData, metaAdsSupabaseData, googleAdsData, kolData, offsiteData, criteoData, commandCenterData, loading, dateRange, currentFilters]);

  const viewNames = {
    shopee: '🛒 Shopee Performance', tiktokShop: '🎵 TikTok Shop Performance', lazada: '🛍️ Lazada Performance', tokopedia: '🟢 Tokopedia Performance', shopeeNco: '🛒 Shopee NCO Performance', tiktokShopNco: '🎵 TikTok Shop NCO Performance', lazadaNco: '🛍️ Lazada NCO Performance', tokopediaNco: '🟢 Tokopedia NCO Performance', commandCenter: '🎯 Command Center', gmvMax: '⚡ GMV Max Intelligence', perfMarketing: '🚀 Performance Marketing (belum kelar woi yang ini)', kol: '⚡ KOL APIFY System', metaAnalytics: '📊 Meta Analytics'
  };

  const renderView = () => {
    if (!filteredData) return null; const commonProps = { filteredData, dateRange };
    switch (activeView) {
      case 'shopee': return <ShopeeView {...commonProps} />;
      case 'tiktokShop': return <TikTokShopView {...commonProps} />;
      case 'lazada': return <LazadaView {...commonProps} />;
      case 'tokopedia': return <TokopediaView {...commonProps} />;
      case 'shopeeNco': return <EcommerceView ordersData={filteredData.ncoOrders} platform="shopee" dateRange={dateRange} />;
      case 'tiktokShopNco': return <EcommerceView ordersData={filteredData.ncoOrders} platform="tiktokShop" dateRange={dateRange} />;
      case 'lazadaNco': return <EcommerceView ordersData={filteredData.ncoOrders} platform="lazada" dateRange={dateRange} />;
      case 'tokopediaNco': return <EcommerceView ordersData={filteredData.ncoOrders} platform="tokopedia" dateRange={dateRange} />;
      case 'commandCenter': return <CommandCenterView {...commonProps} />;
      case 'gmvMax': return <GmvMaxView {...commonProps} targetBrand="Hanasui" />;
      case 'perfMarketing': return <MetaRaw {...commonProps} />;
      case 'kol': return <KolView />;
      case 'metaAnalytics': return <MetaAnalytics />;
      default: return <CommandCenterView {...commonProps} />;
    }
  };

  // AUTH LOADING
  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: 'white' }}>Initializing...</div>;
  }

  // LOGIN REDIRECT
  if (!user) {
    return <LoginView />;
  }

  // DATA LOADING
  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '2rem', textAlign: 'center', padding: '2rem' }}>
        <img src="/loading_lotr.png" alt="Loading" style={{ width: '200px', borderRadius: '12px' }} />
        <h2 style={{ maxWidth: '600px', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Loading project archives...</h2>
      </div>
    );
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <main className="main-content">
        <Header dateFilter={currentFilters.dateFilter} setDateFilter={(val) => updateFilter('dateFilter', val)} customStart={currentFilters.customStart} setCustomStart={(val) => updateFilter('customStart', val)} customEnd={currentFilters.customEnd} setCustomEnd={(val) => updateFilter('customEnd', val)} activeViewName={viewNames[activeView]} activeView={activeView} filterOptions={filterOptions} productFilter={currentFilters.productFilter} setProductFilter={(val) => updateFilter('productFilter', val)} brandFilter={currentFilters.brandFilter} setBrandFilter={(val) => updateFilter('brandFilter', val)} categoryFilter={currentFilters.categoryFilter} setCategoryFilter={(val) => updateFilter('categoryFilter', val)} categoryBrandFilter={currentFilters.categoryBrandFilter} setCategoryBrandFilter={(val) => updateFilter('categoryBrandFilter', val)} />
        {renderView()}
      </main>
    </div>
  )
}

export default App
