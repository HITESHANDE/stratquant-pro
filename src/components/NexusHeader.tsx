import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  Clock, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Settings, 
  AlertTriangle,
  ChevronRight,
  Globe2,
  Radio,
  Zap
} from 'lucide-react';
import { SmartApiConfig } from '../types/nexus';
import { getIndianMarketSessionInfo, MarketSessionInfo } from '../services/smartApiService';
import { MarketDataProvider } from '../services/marketDataService';

interface NexusHeaderProps {
  smartApiConfig: SmartApiConfig;
  dataProvider: MarketDataProvider;
  onNavigateTab: (tab: any) => void;
  activeSignalsCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lastLiveSyncTime?: string;
  onOpenConnectionModal?: () => void;
}

export const NexusHeader: React.FC<NexusHeaderProps> = ({
  smartApiConfig,
  dataProvider,
  onNavigateTab,
  activeSignalsCount,
  soundEnabled,
  onToggleSound,
  lastLiveSyncTime,
  onOpenConnectionModal,
}) => {
  const [sessionInfo, setSessionInfo] = useState<MarketSessionInfo>(getIndianMarketSessionInfo());

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionInfo(getIndianMarketSessionInfo());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#070B14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 transition-colors">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Market Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={() => onNavigateTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  NEXUS <span className="text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  Trading Signals
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Indian Market Intelligence · NSE & MCX
              </p>
            </div>
          </div>

          {/* Quick Active Signals Badge for Mobile */}
          <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-mono font-semibold text-emerald-400">{activeSignalsCount}</span>
            <span className="text-slate-400 text-[10px]">Active</span>
          </div>
        </div>

        {/* Center: Live IST Market Clock & Session Status */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {/* Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-white tracking-wide">{sessionInfo.istTimeString}</span>
          </div>

          {/* Market Session Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold ${
            sessionInfo.isNseOpen || sessionInfo.isMcxOpen
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              sessionInfo.isNseOpen || sessionInfo.isMcxOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}></span>
            <span>{sessionInfo.sessionTitle}</span>
          </div>

          {/* Capital Risk Rule Flag */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>₹1,00,000 Model · ₹1,000 Max Risk (1%)</span>
          </div>
        </div>

        {/* Right: Data Provider Feed Status (Free Live Feed / Angel One), Audio Toggle & Settings */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          
          {/* Active Data Feed Provider Badge */}
          {dataProvider === 'FREE_LIVE' ? (
            <div 
              onClick={() => onOpenConnectionModal ? onOpenConnectionModal() : onNavigateTab('settings')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-emerald-950/40 text-emerald-400 border-emerald-500/40 text-xs font-mono font-medium cursor-pointer hover:bg-emerald-900/30 transition-colors shadow-sm"
              title="Real-time live NSE & MCX data active. Click to manage connection."
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-bold">● LIVE DATA: CONNECTED</span>
              <span className="text-[10px] text-emerald-300 opacity-90 hidden sm:inline">
                {lastLiveSyncTime ? `(${lastLiveSyncTime})` : '(NSE/MCX)'}
              </span>
            </div>
          ) : dataProvider === 'ANGEL_ONE' ? (
            <div 
              onClick={() => onOpenConnectionModal ? onOpenConnectionModal() : onNavigateTab('settings')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono font-medium cursor-pointer transition-colors shadow-sm ${
                smartApiConfig.status === 'LIVE'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                  : smartApiConfig.status === 'DELAYED'
                  ? 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                  : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
              }`}
              title="Click to view Angel One SmartAPI connection & session status"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span className="font-bold">SMARTAPI: {smartApiConfig.status}</span>
              {smartApiConfig.clientCode && (
                <span className="text-[10px] opacity-80 uppercase hidden sm:inline">
                  ({smartApiConfig.clientCode})
                </span>
              )}
            </div>
          ) : (
            <div 
              onClick={() => onOpenConnectionModal ? onOpenConnectionModal() : onNavigateTab('settings')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono font-medium cursor-pointer bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              title="Simulation Feed Active"
            >
              <span>Feed: Simulation</span>
            </div>
          )}

          {/* Dedicated Connect Live Data Button */}
          {onOpenConnectionModal && (
            <button
              onClick={onOpenConnectionModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition-colors"
              title="Open Live Data Connection Manager"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Connect Live Data</span>
            </button>
          )}

          {/* Sound Notification Alert Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-md border transition-colors ${
              soundEnabled 
                ? 'bg-slate-900 text-indigo-400 border-slate-700 hover:bg-slate-800' 
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Mute Signal Audio Alerts' : 'Enable Signal Audio Alerts'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Shortcut */}
          <button
            onClick={() => onNavigateTab('settings')}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Settings & Data Feed Selection"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Live Feed Confirmation Bar */}
      <div className="mt-2 pt-1 border-t border-slate-900/60 flex items-center justify-between text-[10px] text-slate-400 max-w-[1720px] mx-auto overflow-hidden">
        <div className="flex items-center gap-1.5 truncate">
          <Globe2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate text-slate-300">
            {dataProvider === 'FREE_LIVE'
              ? 'LIVE MARKET FEED ACTIVE: Streaming real-time NSE Equity, NIFTY/BANK NIFTY & MCX Crude Oil quotes without Angel One.'
              : 'BROKER SMARTAPI FEED ACTIVE: Direct Angel One connection.'}
          </span>
        </div>
        <button 
          onClick={() => onNavigateTab('signals')} 
          className="shrink-0 text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 ml-2 font-medium"
        >
          <span>Open AI Signals</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};
