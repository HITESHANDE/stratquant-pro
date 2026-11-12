import React, { useState, useEffect } from 'react';
import { TradingStyle, Market } from '../types/trading';
import { getExchangeMarketStatus } from '../engine/indicators';
import { 
  BarChart3, 
  GitCompare, 
  CandlestickChart, 
  Coins, 
  Radar, 
  Wallet,
  Play,
  Sparkles,
  Cpu,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'signals_hub' | 'buy_signals' | 'sell_signals' | 'tradex' | 'multifactor' | 'ranking' | 'matrix' | 'confluence' | 'terminal' | 'options' | 'scanner' | 'blotter';
  setActiveTab: (tab: 'signals_hub' | 'buy_signals' | 'sell_signals' | 'tradex' | 'multifactor' | 'ranking' | 'matrix' | 'confluence' | 'terminal' | 'options' | 'scanner' | 'blotter') => void;
  selectedMarket: Market;
  setSelectedMarket: (m: Market) => void;
  selectedStyle: TradingStyle;
  setSelectedStyle: (style: TradingStyle) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  openPositionsCount: number;
  confluenceBuyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedMarket,
  setSelectedMarket,
  selectedStyle,
  setSelectedStyle,
  onRunSimulation,
  isSimulating,
  openPositionsCount,
  confluenceBuyCount,
}) => {
  const [marketStatus, setMarketStatus] = useState(() => getExchangeMarketStatus(selectedMarket));

  useEffect(() => {
    const update = () => setMarketStatus(getExchangeMarketStatus(selectedMarket));
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [selectedMarket]);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-950/50">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap leading-tight">
              QuantDesk Pro
            </span>
            <span className="text-[11px] text-sky-400 font-mono tracking-wider">
              INDIAN STOCK MARKET QUANT ENGINE
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1.5 text-sm font-medium">
          
          {/* Main Hub: Indian Market Signals (Intraday, Swing, Positional + Buy/Sale) */}
          <button
            onClick={() => setActiveTab('signals_hub')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0 text-xs font-black relative ${
              activeTab === 'signals_hub'
                ? 'bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 text-white shadow-xl shadow-indigo-950/60 ring-2 ring-white/20'
                : 'text-white hover:bg-slate-800/80 border border-slate-700/80 bg-slate-900/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>🎯 Trade Signals Desk</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60">
              NSE / MCX
            </span>
          </button>

          {/* Dedicated Separate Page: Live Buying Signals */}
          <button
            onClick={() => setActiveTab('buy_signals')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-black relative ${
              activeTab === 'buy_signals'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-300'
                : 'text-emerald-400 hover:text-white hover:bg-emerald-950/40 border border-emerald-800/50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Buying Signals</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-emerald-400 text-slate-950 animate-pulse">
              BUY
            </span>
          </button>

          {/* Dedicated Separate Page: Live Selling Signals */}
          <button
            onClick={() => setActiveTab('sell_signals')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-black relative ${
              activeTab === 'sell_signals'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 ring-1 ring-rose-300'
                : 'text-rose-400 hover:text-white hover:bg-rose-950/40 border border-rose-800/50'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Selling Signals</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-rose-400 text-slate-950 animate-pulse">
              SELL
            </span>
          </button>

          {/* All Live Signals Desk */}
          <button
            onClick={() => setActiveTab('tradex')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-bold relative ${
              activeTab === 'tradex'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 font-black shadow-lg shadow-sky-500/30 ring-1 ring-sky-300'
                : 'text-sky-300 hover:text-white hover:bg-sky-950/40 border border-sky-600/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>All Live Signals</span>
          </button>

          <button
            onClick={() => setActiveTab('multifactor')}
            className={`px-3 py-2 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-bold relative ${
              activeTab === 'multifactor'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md ring-1 ring-indigo-400'
                : 'text-indigo-300 hover:text-white hover:bg-indigo-950/40 border border-indigo-800/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-300" />
            Multi-Factor Engine
          </button>

          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-3.5 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0 text-xs font-semibold ${
              activeTab === 'ranking'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            Performance Ranking
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0 text-xs font-semibold ${
              activeTab === 'matrix'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
            Strategy Comparison
          </button>

          <button
            onClick={() => setActiveTab('confluence')}
            className={`px-3.5 py-2 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-bold relative ${
              activeTab === 'confluence'
                ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            13-Strategy Buy
            {confluenceBuyCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
                activeTab === 'confluence' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500 text-slate-950'
              }`}>
                {confluenceBuyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3.5 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0 text-xs font-semibold ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <CandlestickChart className="w-3.5 h-3.5 text-amber-400" />
            Terminal & Charts
          </button>

          <button
            onClick={() => setActiveTab('options')}
            className={`px-3.5 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0 text-xs font-semibold ${
              activeTab === 'options'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-purple-400" />
            Options Chain & Max Pain
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0 text-xs font-semibold ${
              activeTab === 'scanner'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-sky-400" />
            Signal Scanner
          </button>

          <button
            onClick={() => setActiveTab('blotter')}
            className={`px-3.5 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0 text-xs font-semibold relative ${
              activeTab === 'blotter'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-rose-400" />
            Paper Blotter
            {openPositionsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono bg-indigo-600/80 text-white rounded-full">
                {openPositionsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Market Selector + Trading Style Control + Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Indian Market Badge & Exchange Hours */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-bold text-amber-300 gap-1.5">
              <span>🇮🇳</span>
              <span className="font-mono">NSE / BSE / MCX</span>
            </div>

            {/* Exchange Hours Indicator */}
            <span 
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                marketStatus.isOpen 
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-400' 
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title={`${marketStatus.sessionName} (${marketStatus.sessionTimeStr})`}
            >
              <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
              <span>{marketStatus.isOpen ? 'OPEN' : 'CLOSED'}</span>
            </span>
          </div>

          {/* Trading Style Segmented Selector */}
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800/80">
            <button
              onClick={() => setSelectedStyle('intraday')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedStyle === 'intraday'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="5-Minute intraday candles with session square-off"
            >
              Intraday <span className="font-mono text-[10px] opacity-80">(5m)</span>
            </button>
            <button
              onClick={() => setSelectedStyle('swing')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedStyle === 'swing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="1-Year daily candles with 3-15 day holds"
            >
              Swing <span className="font-mono text-[10px] opacity-80">(Daily)</span>
            </button>
            <button
              onClick={() => setSelectedStyle('positional')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedStyle === 'positional'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="1-Year daily candles macro trend follower"
            >
              Positional <span className="font-mono text-[10px] opacity-80">(Macro)</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-lg transition-all shadow-md shadow-emerald-950/40 flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Computing Backtest...' : 'Run Backtest'}
          </button>
        </div>

      </div>

      {/* Mobile navigation tab strip for smaller screens */}
      <div className="xl:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-800/60 bg-slate-900/60">
        {[
          { id: 'signals_hub', label: '🎯 Trade Signals', icon: Zap },
          { id: 'buy_signals', label: '🟢 Buy Signals', icon: ArrowUpRight },
          { id: 'sell_signals', label: '🔴 Sell Signals', icon: ArrowDownRight },
          { id: 'tradex', label: '⚡ All Signals', icon: Zap },
          { id: 'multifactor', label: 'Multi-Factor', icon: Cpu },
          { id: 'ranking', label: 'Ranking', icon: BarChart3 },
          { id: 'matrix', label: 'Strategy Matrix', icon: GitCompare },
          { id: 'confluence', label: '13-Strategy Buy', icon: Sparkles },
          { id: 'terminal', label: 'Terminal', icon: CandlestickChart },
          { id: 'options', label: 'Options Chain', icon: Coins },
          { id: 'scanner', label: 'Scanner', icon: Radar },
          { id: 'blotter', label: 'Blotter', icon: Wallet },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
