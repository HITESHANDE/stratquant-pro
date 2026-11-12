import React from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  ScanLine, 
  Layers, 
  Bookmark, 
  Cpu, 
  History, 
  Archive, 
  Settings,
  Sparkles
} from 'lucide-react';
import { NavigationTab } from '../types/nexus';

interface NexusSidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeSignalsCount: number;
}

export const NexusSidebar: React.FC<NexusSidebarProps> = ({
  activeTab,
  onSelectTab,
  activeSignalsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'signals' as NavigationTab,
      label: 'AI Signals',
      icon: Zap,
      badge: activeSignalsCount > 0 ? `${activeSignalsCount} LIVE` : 'LIVE',
      isPrimary: true,
      hint: 'Primary Feature',
    },
    {
      id: 'scanner' as NavigationTab,
      label: 'Market Scanner',
      icon: ScanLine,
      badge: '5 Scanners',
    },
    {
      id: 'options' as NavigationTab,
      label: 'Options Analytics',
      icon: Layers,
      badge: 'PCR / Pain',
    },
    {
      id: 'watchlist' as NavigationTab,
      label: 'Watchlist',
      icon: Bookmark,
      badge: null,
    },
    {
      id: 'strategies' as NavigationTab,
      label: 'Strategy Engine',
      icon: Cpu,
      badge: '13 Strats',
    },
    {
      id: 'backtesting' as NavigationTab,
      label: 'Backtesting',
      icon: History,
      badge: '1-Yr Sim',
    },
    {
      id: 'history' as NavigationTab,
      label: 'Trade History',
      icon: Archive,
      badge: null,
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#070B14] border-r border-slate-800/80 p-3 shrink-0 min-h-[calc(100vh-65px)]">
        
        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Core Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isPrimary = item.isPrimary;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? isPrimary
                      ? 'bg-gradient-to-r from-indigo-600/30 via-indigo-600/20 to-transparent text-white border-l-2 border-indigo-400 font-semibold shadow-sm'
                      : 'bg-slate-800/80 text-white border-l-2 border-indigo-500 font-semibold'
                    : isPrimary
                    ? 'text-indigo-300 hover:text-white hover:bg-indigo-950/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive 
                      ? 'text-indigo-400' 
                      : isPrimary 
                      ? 'text-indigo-400 group-hover:text-indigo-300' 
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    isPrimary
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* AI Confluence Feature Callout */}
        <div className="mt-auto pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-lg bg-gradient-to-b from-slate-900/90 to-indigo-950/40 border border-indigo-500/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Factor AI Check</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every signal requires 3+ strategy confluences and calculated stop-loss before publication.
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Capital: ₹1,00,000</span>
              <span className="text-emerald-400 font-semibold">Max Risk: 1%</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Horizontal Navigation Tab Bar */}
      <nav className="lg:hidden flex items-center gap-1 overflow-x-auto bg-[#070B14] border-b border-slate-800 px-3 py-2 scrollbar-none sticky top-[57px] z-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : item.isPrimary
                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.isPrimary && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
