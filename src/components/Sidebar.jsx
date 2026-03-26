import { 
  LayoutDashboard, 
  Facebook, 
  Video, 
  Search,
  Database,
  Users2,
  Activity,
  Target,
  Hash,
  Menu,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Zap
} from 'lucide-react';

const ShopeeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6H17.5V5.5C17.5 2.46243 15.0376 0 12 0C8.96243 0 6.5 2.46243 6.5 5.5V6H5C3.34315 6 2 7.34315 2 9V19C2 21.7614 4.23858 24 7 24H17C19.7614 24 22 21.7614 22 19V9C22 7.34315 20.6569 6 19 6ZM8.5 5.5C8.5 3.567 10.067 2 12 2C13.933 2 15.5 3.567 15.5 5.5V6H8.5V5.5ZM13.8247 16.5913C13.8247 17.575 13.0238 18.0673 12.0163 18.0673C11.0089 18.0673 10.1501 17.5516 10.0247 16.5913H11.2334C11.3115 17.0754 11.6081 17.2628 12.0142 17.2628C12.4206 17.2628 12.6393 17.1065 12.6393 16.8176C12.6393 16.5287 12.5222 16.4272 11.9673 16.2708L10.9836 15.9899C10.3746 15.8179 10.0471 15.5446 10.0471 14.8652C10.0471 14.0064 10.8756 13.5146 11.8361 13.5146C12.7183 13.5146 13.538 13.9363 13.686 14.8885H12.4912C12.4287 14.4984 12.1864 14.3184 11.8127 14.3184C11.4391 14.3184 11.2359 14.4673 11.2359 14.7171C11.2359 14.9669 11.3375 15.0685 11.915 15.2246C11.915 15.2246 12.8755 15.4822 13.0631 15.5369C13.5627 15.6853 13.8247 16.0369 13.8247 16.5913Z" fill="currentColor"/>
  </svg>
);

const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.589 6.686a4.94 4.94 0 0 1-3.778-3.633V2h-3.445v13.647a2.898 2.898 0 1 1-2.897-2.896c.159 0 .312.015.461.042v-3.523a6.354 6.354 0 1 0 5.882 6.324V9.387a8.292 8.292 0 0 0 5.163 1.813V7.754a4.897 4.897 0 0 1-1.386-.145v-.923z" fill="currentColor"/>
  </svg>
);

const LazadaIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.0001 22L4 14.0001L4 10C4 6.13401 7.13401 3 11 3H12C15.866 3 19 6.13401 19 10L19 14.0001L12.0001 22ZM12.0001 18L16 13.1538V10C16 7.79086 14.2091 6 12 6H11C8.79086 6 7 7.79086 7 10V13.1538L12.0001 18Z" fill="currentColor"/>
  </svg>
);

const TokopediaIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12C15 13.66 13.66 15 12 15Z" fill="currentColor"/>
  </svg>
);

export const Sidebar = ({ activeView, setActiveView, isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { type: 'divider', label: 'E-Commerce' },
    { id: 'shopee',     name: 'Shopee',      icon: <ShopeeIcon size={20} />,    color: '#EE4D2D' },
    { id: 'tiktokShop',name: 'TikTok Shop', icon: <TikTokIcon size={20} />,    color: '#4F46E5' },
    { id: 'lazada',    name: 'Lazada',       icon: <LazadaIcon size={20} />,    color: '#1E40AF' },
    { id: 'tokopedia', name: 'Tokopedia',    icon: <TokopediaIcon size={20} />, color: '#059669' },

    { type: 'divider', label: 'Ads Performance' },
    { id: 'overview', name: 'Ads Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'meta',     name: 'Meta Ads', icon: <Facebook size={20} />, color: '#1877f2' },
    { id: 'tiktok',   name: 'Ads TikTok', icon: <Video size={20} /> },
    { id: 'google',   name: 'Google Ads', icon: <Search size={20} /> },
    { id: 'criteo',   name: 'Ads Criteo', icon: <Activity size={20} /> },

    { type: 'divider', label: 'KOL Section' },
    { id: 'kol',      name: 'KOL Track', icon: <Users2 size={20} /> },

    { type: 'divider', label: 'AI Creative' },
    { id: 'creativehub', name: 'Creative Hub', icon: <Zap size={20} />, color: '#14B8A6' },

  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo" style={{ 
        padding: isCollapsed ? '1rem 0.5rem' : '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <img 
          src="/logo.png" 
          alt="EJI Logo" 
          style={{ 
            width: isCollapsed ? '32px' : '120px',
            height: 'auto',
            filter: 'invert(1)', // Making it white for dark theme
            transition: 'all 0.3s ease'
          }} 
        />
        <button 
          className="sidebar-toggle" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ 
            marginLeft: isCollapsed ? '0' : 'auto',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => {
          if (item.type === 'divider') {
            return (
              <div key={`div-${idx}`} style={{ padding: isCollapsed ? '0.5rem 0' : '0.75rem 1rem 0.25rem', color: 'var(--text-tertiary)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.5rem' }}>
                {!isCollapsed && item.label}
              </div>
            );
          }
          return (
            <div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={isCollapsed ? item.name : ''}
              style={item.color ? { '--item-accent': item.color } : {}}
            >
              <span style={{ color: activeView === item.id && item.color ? item.color : undefined }}>{item.icon}</span>
              {!isCollapsed && <span>{item.name}</span>}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className="status-dot"></div>
          {!isCollapsed && <span>System Live: Real Data</span>}
        </div>
      </div>
    </aside>
  );
};
