import React, { useState } from 'react';
import { Menu, X, RefreshCcw, Settings } from 'lucide-react';
import Clock from './Clock';

export type ViewId = 'HOME' | 'UNITS' | 'ATTENDANCE' | 'DOCS' | 'SOULS' | 'ACTU' | 'CAMPAIGN' | 'CHAT' | 'ADMIN_UNITS';

interface HeaderProps {
  currentView: ViewId;
  onViewChange: (view: ViewId) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  currentLogo: string | null;
  isAdmin: boolean;
}

const NAVIGATION_ITEMS: Array<{ id: ViewId; label: string; adminOnly?: boolean }> = [
  { id: 'HOME', label: 'Accueil' },
  { id: 'UNITS', label: 'Unités & Comités' },
  { id: 'ATTENDANCE', label: 'Présences' },
  { id: 'DOCS', label: 'Archives' },
  { id: 'SOULS', label: 'Suivi des Âmes' },
  { id: 'ACTU', label: 'Actu' },
  { id: 'CAMPAIGN', label: 'TAFIRE 2026' },
  { id: 'ADMIN_UNITS', label: 'Gestion Unités', adminOnly: true },
  { id: 'CHAT', label: 'Chat' }
];

const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onRefresh,
  isRefreshing,
  currentLogo,
  isAdmin
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const handleNavClick = (viewId: ViewId) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#0f172a] text-white sticky top-0 z-50 shadow-2xl border-b-4 border-orange-500">
      {/* Top Row: Logo & Title | Spacer | Time & Refresh */}
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo & Title (left) */}
        <div className="flex items-center gap-3 min-w-max">
          <div className="w-11 h-11 rounded-full border-2 border-indigo-500 shadow-lg overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0">
            <img
              src={currentLogo || 'https://images.unsplash.com/photo-1635326445353-888915467417?q=80&w=200&auto=format&fit=crop'}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase leading-none hidden sm:block">
            DEVAC <span className="text-indigo-400 font-light">CONNECT</span>
          </h1>
        </div>

        {/* Center Spacer */}
        <div className="flex-1" />

        {/* Right Section: Time & Controls */}
        <div className="flex items-center gap-3">
          <Clock />
          <button
            onClick={onRefresh}
            className={`p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10 ${
              isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-300'
            }`}
            title="Rafraîchir les données"
          >
            <RefreshCcw size={16} />
          </button>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/10 text-slate-300"
            title="Menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav
        className={`border-t border-white/5 bg-slate-900 overflow-x-auto md:overflow-visible ${
          isMobileMenuOpen ? 'block' : 'hidden md:block'
        }`}
      >
        <div className="px-2 py-2 flex gap-1 md:gap-0.5 flex-nowrap md:flex-wrap md:justify-center">
          {NAVIGATION_ITEMS.map(item => {
            // Hide admin-only items if not admin
            if (item.adminOnly && !isAdmin) return null;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider
                  whitespace-nowrap transition-all duration-200 flex items-center gap-1.5
                  ${
                    currentView === item.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-white/10'
                  }
                  ${item.adminOnly ? 'border-orange-500/30 border' : ''}
                `}
              >
                {item.id === 'ADMIN_UNITS' && <Settings size={14} />}
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

export default Header;
