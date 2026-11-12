import React, { useState, useMemo, useEffect } from 'react';
import { 
  TradeXSignal, 
  TradeXSignalType, 
  TradeXPriority, 
  TradingStyle,
  PortfolioPosition,
  Market
} from '../types/trading';
import { getExchangeMarketStatus, ExchangeMarketStatus } from '../engine/indicators';
import { 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Crosshair, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Pause,
  Calculator,
  Layers,
  LineChart,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Radio,
  BarChart3,
  ListFilter,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

interface TradeXSignalFeedProps {
  signals: TradeXSignal[];
  selectedStyle: TradingStyle;
  onStyleChange: (style: TradingStyle) => void;
  onExecuteSignal: (signal: TradeXSignal) => void;
  onOpenTerminal: (symbol: string) => void;
  onNavigateTab?: (tab: any) => void;
  selectedMarket?: Market;
}

export const TradeXSignalFeed: React.FC<TradeXSignalFeedProps> = ({
  signals: initialSignals,
  selectedStyle,
  onStyleChange,
  onExecuteSignal,
  onOpenTerminal,
  onNavigateTab,
  selectedMarket = 'INDIA',
}) => {
  // Exchange Market & Live State
  const [marketStatus, setMarketStatus] = useState<ExchangeMarketStatus>(() => getExchangeMarketStatus(selectedMarket));
  const [simulationReplayMode, setSimulationReplayMode] = useState<boolean>(false);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [liveCountdown, setLiveCountdown] = useState<number>(3);
  const [signals, setSignals] = useState<TradeXSignal[]>(initialSignals);
  const [lastTickDirection, setLastTickDirection] = useState<Record<string, 'UP' | 'DOWN'>>({});

  // Filter States
  const [filterType, setFilterType] = useState<'ALL' | 'CASH_BUY' | 'CASH_SELL' | 'OPTIONS_BUY' | 'OPTIONS_SELL' | 'NO_TRADE'>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('ALL');
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync when initialSignals update
  useEffect(() => {
    setSignals(initialSignals);
  }, [initialSignals]);

  // Sync market status every second
  useEffect(() => {
    const updateMarket = () => {
      setMarketStatus(getExchangeMarketStatus(selectedMarket));
    };
    updateMarket();
    const timer = setInterval(updateMarket, 1000);
    return () => clearInterval(timer);
  }, [selectedMarket]);

  // Live real-time tick pulse effect
  // Gated: runs only when live is active AND either real exchange is OPEN or user enabled Simulation Replay Mode
  useEffect(() => {
    const isEngineActive = isLiveActive && (marketStatus.isOpen || simulationReplayMode);
    if (!isEngineActive) return;

    const interval = setInterval(() => {
      setLiveCountdown((prev) => {
        if (prev <= 1) {
          // Trigger simulated live market tick
          setSignals((currentSignals) => {
            const nextDirections: Record<string, 'UP' | 'DOWN'> = {};
            const updated = currentSignals.map((sig) => {
              if (sig.scoreBand === 'NO TRADE') return sig;

              // Micro tick: +/- 0.05% to 0.15%
              const isUp = Math.random() > 0.46;
              const deltaPct = (Math.random() * 0.002 + 0.0005) * (isUp ? 1 : -1);
              const currentLtp = sig.currentLtp || sig.triggerPrice;
              const newLtp = parseFloat(Math.max(1, currentLtp * (1 + deltaPct)).toFixed(2));
              nextDirections[sig.id] = isUp ? 'UP' : 'DOWN';

              // Calculate progress towards Target 1
              const totalDistance = Math.abs(sig.target1 - sig.triggerPrice);
              const coveredDistance = Math.abs(newLtp - sig.triggerPrice);
              const progressPct = Math.min(100, Math.max(0, Math.round((coveredDistance / (totalDistance || 1)) * 100)));

              // Determine status
              let status: NonNullable<TradeXSignal['status']> = 'TRIGGERED';
              if (sig.sentiment === 'Bullish' && newLtp >= sig.target1) status = 'TARGET_HIT';
              else if (sig.sentiment === 'Bearish' && newLtp <= sig.target1) status = 'TARGET_HIT';
              else if (sig.sentiment === 'Bullish' && newLtp <= sig.stopLoss) status = 'STOP_HIT';
              else if (sig.sentiment === 'Bearish' && newLtp >= sig.stopLoss) status = 'STOP_HIT';

              return {
                ...sig,
                currentLtp: newLtp,
                progressPct,
                status,
              };
            });

            setLastTickDirection(nextDirections);
            return updated;
          });

          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveActive, marketStatus.isOpen, simulationReplayMode]);

  // Filter signals
  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      // Type Filter
      if (filterType === 'CASH_BUY' && sig.signalType !== 'CASH_BUY') return false;
      if (filterType === 'CASH_SELL' && sig.signalType !== 'CASH_SELL') return false;
      if (filterType === 'OPTIONS_BUY' && sig.signalType !== 'OPTIONS_BUY') return false;
      if (filterType === 'OPTIONS_SELL' && sig.signalType !== 'OPTIONS_SELL') return false;
      if (filterType === 'NO_TRADE' && sig.scoreBand !== 'NO TRADE') return false;
      if (filterType !== 'NO_TRADE' && sig.scoreBand === 'NO TRADE') return false;

      // Priority Filter
      if (filterPriority !== 'ALL' && sig.priority !== filterPriority) return false;

      // Strategy Filter
      if (selectedStrategyFilter !== 'ALL') {
        const stratName = sig.strategyName || sig.opportunityTag;
        if (!stratName.toLowerCase().includes(selectedStrategyFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [signals, filterType, filterPriority, selectedStrategyFilter]);

  const counts = useMemo(() => {
    return {
      all: signals.filter((s) => s.scoreBand !== 'NO TRADE').length,
      cashBuy: signals.filter((s) => s.signalType === 'CASH_BUY' && s.scoreBand !== 'NO TRADE').length,
      cashSell: signals.filter((s) => s.signalType === 'CASH_SELL' && s.scoreBand !== 'NO TRADE').length,
      optionsBuy: signals.filter((s) => s.signalType === 'OPTIONS_BUY' && s.scoreBand !== 'NO TRADE').length,
      optionsSell: signals.filter((s) => s.signalType === 'OPTIONS_SELL' && s.scoreBand !== 'NO TRADE').length,
      noTrade: signals.filter((s) => s.scoreBand === 'NO TRADE').length,
    };
  }, [signals]);

  const handleCopyAlert = (sig: TradeXSignal) => {
    const text = `🚨 LIVE QUANT SIGNAL: ${sig.symbol} (${sig.exchange})\n` +
      `Strategy: ${sig.strategyName || sig.opportunityTag}\n` +
      `Signal: ${sig.triggerLabel} @ ₹${sig.triggerPrice}\n` +
      `Stop Loss: ₹${sig.stopLoss} | Target 1: ₹${sig.target1} | Target 2: ₹${sig.target2}\n` +
      `100-Point Score: ${sig.score}/100 (${sig.scoreBand})\n` +
      `Position Size: ${sig.sizing.calculatedQty} (Risk Budget: ₹${sig.sizing.riskBudget})\n` +
      `Time Stop: ${sig.timeStop}`;
    
    navigator.clipboard?.writeText(text);
    setCopiedId(sig.id);
    setToastMessage(`Copied ${sig.symbol} signal parameters to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2500);
  };

  const handleExecute = (sig: TradeXSignal) => {
    onExecuteSignal(sig);
    setToastMessage(`Executed live paper order: ${sig.symbol} (${sig.sizing.calculatedQty} shares)`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="w-full space-y-5">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-2xl flex items-center gap-2 border border-emerald-300 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Institutional Top Control & Live Strategy Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
        
        {/* Row 1: Workspace Title + Live Engine Status + Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Live Algorithmic Signals Desk
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 uppercase">
                13 Strategies Active
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Real-time multi-factor scanning across NSE Equities, NFO Derivatives & MCX Commodities with ₹1,00,000 risk-budget sizing.
            </p>
          </div>

          {/* Live Engine Stream Controller */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (!marketStatus.isOpen) {
                  if (!simulationReplayMode) {
                    setSimulationReplayMode(true);
                    setIsLiveActive(true);
                    setToastMessage('▶ Activated Strategy Simulation & Replay Mode.');
                    setTimeout(() => setToastMessage(null), 3000);
                  } else {
                    setIsLiveActive(!isLiveActive);
                  }
                } else {
                  setIsLiveActive(!isLiveActive);
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                marketStatus.isOpen && isLiveActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                  : simulationReplayMode && isLiveActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${
                (marketStatus.isOpen ? isLiveActive : (simulationReplayMode && isLiveActive)) ? 'text-emerald-400 animate-spin' : 'text-slate-500'
              }`} />
              <span>
                {marketStatus.isOpen 
                  ? (isLiveActive ? `LIVE ENGINE (${liveCountdown}s)` : 'ENGINE PAUSED')
                  : simulationReplayMode
                  ? (isLiveActive ? `REPLAY ACTIVE (${liveCountdown}s)` : 'REPLAY PAUSED')
                  : '🔴 MARKET CLOSED (EOD SETUPS)'}
              </span>
            </button>

            {/* Trading Style Selector */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              {(['intraday', 'swing', 'positional'] as TradingStyle[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStyleChange(st)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all capitalize ${
                    selectedStyle === st 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'cards' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Expanded Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-slate-800 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Compact Table Blotter View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Signal Category Filter Pills */}
        <div className="flex items-center justify-between gap-3 pt-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'ALL', label: 'All Signals', count: counts.all, color: 'sky' },
              { id: 'CASH_BUY', label: 'Cash BUY (Long)', count: counts.cashBuy, color: 'emerald' },
              { id: 'CASH_SELL', label: 'Cash / Futures SELL', count: counts.cashSell, color: 'rose' },
              { id: 'OPTIONS_BUY', label: 'Options BUY (CE/PE)', count: counts.optionsBuy, color: 'indigo' },
              { id: 'OPTIONS_SELL', label: 'Options SELL (Writing)', count: counts.optionsSell, color: 'purple' },
              { id: 'NO_TRADE', label: 'NO TRADE Filter', count: counts.noTrade, color: 'amber' },
            ].map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-md ring-1 ring-slate-600'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Priority Quick Filter */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Priority:</span>
            {(['ALL', 'High', 'Medium', 'Low'] as const).map((pri) => (
              <button
                key={pri}
                onClick={() => setFilterPriority(pri)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterPriority === pri 
                    ? 'bg-sky-950 text-sky-300 border border-sky-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {pri}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Closed Exchange Explanation & Simulation Mode Banner */}
      {!marketStatus.isOpen && !simulationReplayMode && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
                    EXCHANGE CLOSED: {marketStatus.sessionName}
                  </span>
                  <span className="text-slate-400 font-mono">({marketStatus.sessionTimeStr})</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Why are signals displayed when the market is not running?
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  The Indian Stock Exchanges (NSE / BSE) operate strictly Monday to Friday from <strong>09:15 AM to 03:30 PM IST</strong>. The setups below are <strong className="text-sky-300">verified End-of-Day (EOD) Closing Setups</strong> generated from official 03:30 PM market close data across the 13 quantitative strategies. Live ticks and background discovery are <strong className="text-amber-300">paused</strong> until <strong>{marketStatus.nextSessionStr}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              <button
                onClick={() => {
                  setSimulationReplayMode(true);
                  setIsLiveActive(true);
                  setToastMessage('▶ Activated Strategy Simulation & Replay Mode.');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Simulation / Replay Mode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Simulation Replay Banner */}
      {simulationReplayMode && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
            <div>
              <span className="font-bold text-indigo-200">
                ⚡ Strategy Simulation & Replay Mode Active (Off-Market Practice).
              </span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Simulated micro-ticks, dynamic target progress, and strategy validations are running for practice and backtest inspection.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSimulationReplayMode(false);
              setToastMessage('⏸ Exited simulation replay. Reverted to static EOD setups.');
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[11px] font-bold shrink-0 self-start sm:self-auto border border-slate-700"
          >
            Exit Replay (Keep EOD Static)
          </button>
        </div>
      )}

      {/* Live Market Ticker Tape */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono">
        {[
          { sym: 'NIFTY 50', ltp: '24,140.00', chg: '+0.72%', up: true },
          { sym: 'BANKNIFTY', ltp: '51,800.00', chg: '+1.15%', up: true },
          { sym: 'RELIANCE', ltp: '3,012.40', chg: '+1.65%', up: true },
          { sym: 'HDFCBANK', ltp: '1,762.50', chg: '+1.28%', up: true },
          { sym: 'CRUDEOIL', ltp: '9,180.00', chg: '-2.35%', up: false },
          { sym: 'POLICYBZR', ltp: '928.50', chg: '-1.82%', up: false },
        ].map((item, idx) => (
          <div 
            key={idx} 
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-300 block">{item.sym}</span>
              <span className="text-white font-bold">{item.ltp}</span>
            </div>
            <span className={`text-[11px] font-bold ${item.up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {item.chg}
            </span>
          </div>
        ))}
      </div>

      {/* Content Feed: Cards View vs Table Blotter View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredSignals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-300">No active signals match the selected filter criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try switching to 'All Signals' or toggle 'LIVE ENGINE' above.</p>
            </div>
          ) : (
            filteredSignals.map((sig) => {
              const isExpanded = expandedSignalId === sig.id;
              const isBearish = sig.sentiment === 'Bearish';
              const isNoTrade = sig.scoreBand === 'NO TRADE';
              const tickDir = lastTickDirection[sig.id];

              return (
                <div
                  key={sig.id}
                  className={`bg-slate-900/90 border ${
                    isNoTrade 
                      ? 'border-amber-900/40 bg-amber-950/10' 
                      : sig.score >= 85 
                      ? 'border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-950/20' 
                      : 'border-slate-800 hover:border-slate-700'
                  } rounded-2xl p-4 sm:p-5 transition-all`}
                >
                  
                  {/* Card Header: Symbol, Live Price, Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-100 text-sm shadow-sm shrink-0">
                        {sig.avatar}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-black text-white tracking-tight">
                            {sig.symbol}
                          </h2>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {sig.exchange}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {sig.name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-indigo-400">{sig.strategyName || sig.opportunityTag}</span>
                          <span>•</span>
                          <span>{sig.timeStr} ({sig.elapsedStr})</span>
                        </div>
                      </div>
                    </div>

                    {/* Live LTP & Price Action */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">LIVE LTP:</span>
                        <span className={`text-base sm:text-lg font-black font-mono transition-colors ${
                          tickDir === 'UP' ? 'text-emerald-400' : tickDir === 'DOWN' ? 'text-rose-400' : 'text-white'
                        }`}>
                          ₹{(sig.currentLtp || sig.triggerPrice).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                          isBearish ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          {isBearish ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          <span>{sig.sentiment} ({sig.signalType.replace('_', ' ')})</span>
                        </span>

                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                          sig.score >= 85 
                            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
                            : sig.score >= 75 
                            ? 'bg-sky-950/80 border-sky-700 text-sky-300' 
                            : sig.score >= 60 
                            ? 'bg-slate-800 border-slate-700 text-slate-300' 
                            : 'bg-rose-950/80 border-rose-800 text-rose-300'
                        }`}>
                          Score: {sig.score}/100
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Core Precision Matrix: Trigger Price, Stop Loss, Target 1, Target 2 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 text-xs">
                    
                    {/* Trigger Point */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-0.5">
                        <span>Trigger Point</span>
                        <Crosshair className="w-3 h-3 text-sky-400" />
                      </div>
                      <span className="text-sm font-black font-mono text-white block">
                        ₹{sig.triggerPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {sig.triggerLabel}
                      </span>
                    </div>

                    {/* Accurate Stop Loss */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-rose-900/50">
                      <div className="flex items-center justify-between text-rose-300 text-[10px] uppercase font-mono mb-0.5">
                        <span>Stop Loss (Strict)</span>
                        <ShieldCheck className="w-3 h-3 text-rose-400" />
                      </div>
                      <span className="text-sm font-black font-mono text-rose-400 block">
                        ₹{sig.stopLoss.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Risk/Share: ₹{sig.sizing.perShareRisk}
                      </span>
                    </div>

                    {/* Target 1 */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-900/50">
                      <div className="flex items-center justify-between text-emerald-300 text-[10px] uppercase font-mono mb-0.5">
                        <span>Target 1 (1:2 RR)</span>
                        <span className="text-emerald-400 font-bold">1:2</span>
                      </div>
                      <span className="text-sm font-black font-mono text-emerald-400 block">
                        ₹{sig.target1.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-500/80">
                        Profit: ₹{Math.abs(sig.target1 - sig.triggerPrice)}/sh
                      </span>
                    </div>

                    {/* Target 2 */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-900/50">
                      <div className="flex items-center justify-between text-emerald-300 text-[10px] uppercase font-mono mb-0.5">
                        <span>Target 2 (Runner)</span>
                        <span className="text-emerald-400 font-bold">1:3.3</span>
                      </div>
                      <span className="text-sm font-black font-mono text-emerald-400 block">
                        ₹{sig.target2.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-500/80">
                        Expansion Peak
                      </span>
                    </div>

                  </div>

                  {/* Target 1 Progress Bar */}
                  {!isNoTrade && (
                    <div className="mb-3 px-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>Live Distance to Target 1</span>
                        <span className="font-bold text-sky-400">{sig.progressPct || 0}% covered</span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-full transition-all duration-500"
                          style={{ width: `${sig.progressPct || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Capital Sizing & Lot Model (PDF Section 5) */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 mb-3 text-xs font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-300 font-sans font-bold">
                        <Calculator className="w-3.5 h-3.5 text-sky-400" />
                        <span>Capital Model (₹1,00,000 Equity · 1% Risk = ₹1,000):</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span>Qty: <strong className="text-sky-300 font-bold">{sig.sizing.calculatedQty} {sig.sizing.lotSize ? `(${sig.sizing.contractLots || 1} Lot)` : 'Shares'}</strong></span>
                        <span>Risk Budget: <strong className="text-amber-300">₹{sig.sizing.riskBudget}</strong></span>
                        <span>Margin: <strong className="text-slate-200">₹{(sig.sizing.marginRequired || sig.sizing.calculatedQty * sig.triggerPrice).toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Option Greeks Specs if Option Signal */}
                  {sig.optionsDetail && (
                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 mb-3 text-xs font-mono">
                      <div className="flex items-center justify-between mb-1.5 font-sans font-bold text-purple-300">
                        <span>Option Greeks & Strike Matrix</span>
                        <span className="text-[10px] text-purple-400">
                          {sig.optionsDetail.optionType} {sig.optionsDetail.strike} · Exp: {sig.optionsDetail.expiry}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px]">
                        <div>Delta: <strong className="text-white">{sig.optionsDetail.delta}</strong></div>
                        <div>Gamma: <strong className="text-white">{sig.optionsDetail.gamma}</strong></div>
                        <div>Theta: <strong className="text-emerald-400">{sig.optionsDetail.theta}/day</strong></div>
                        <div>IV: <strong className="text-white">{sig.optionsDetail.iv}%</strong></div>
                        <div>PCR: <strong className="text-sky-300">{sig.optionsDetail.pcr}</strong></div>
                        <div>Max Pain: <strong className="text-amber-300">₹{sig.optionsDetail.maxPain}</strong></div>
                      </div>
                    </div>
                  )}

                  {/* Toggle Deep Details Accordion */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setExpandedSignalId(isExpanded ? null : sig.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isExpanded ? 'Hide 100-Point Score & Invalidation Rules' : 'Inspect 100-Point Score & Invalidation Rules'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyAlert(sig)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        {copiedId === sig.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>

                      <button
                        onClick={() => onOpenTerminal(sig.symbol.split(' ')[0])}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <LineChart className="w-3.5 h-3.5 text-amber-400" />
                        <span>Chart</span>
                      </button>

                      <button
                        onClick={() => handleExecute(sig)}
                        disabled={isNoTrade}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/60 transition-all disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Execute Order</span>
                      </button>
                    </div>
                  </div>

                  {/* Deep Details Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 text-xs">
                      
                      {/* NO TRADE Notice if score < 60 */}
                      {isNoTrade && (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">CAPITAL PRESERVATION TRIGGER (PDF Section 10):</span>
                            <span>{sig.evidence.noTradeReason || 'Score is below 60 minimum filter. Risk/Reward or volume verification failed.'}</span>
                          </div>
                        </div>
                      )}

                      {/* 100-Point Framework Breakdown */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="font-bold text-slate-300 mb-2">100-Point Framework Breakdown (PDF Section 8)</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>Price Action: <strong className="text-white">{sig.scoreBreakdown.priceAction}/20</strong></div>
                          <div>Candlestick: <strong className="text-white">{sig.scoreBreakdown.candlestick}/15</strong></div>
                          <div>Volume Flow: <strong className="text-white">{sig.scoreBreakdown.volume}/15</strong></div>
                          <div>F&O Buildup: <strong className="text-white">{sig.scoreBreakdown.fno}/15</strong></div>
                          <div>Indicators: <strong className="text-white">{sig.scoreBreakdown.indicators}/10</strong></div>
                          <div>News Intel: <strong className="text-white">{sig.scoreBreakdown.news}/10</strong></div>
                          <div>Market Trend: <strong className="text-white">{sig.scoreBreakdown.marketTrend}/10</strong></div>
                          <div>Sector Strength: <strong className="text-white">{sig.scoreBreakdown.sectorStrength}/5</strong></div>
                        </div>
                      </div>

                      {/* Invalidation & Time Stop */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Time Stop Rule</span>
                          <span className="text-slate-300">{sig.timeStop}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-rose-300 uppercase block mb-1">Invalidation Condition</span>
                          <span className="text-slate-300">{sig.invalidationCondition}</span>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Compact Table Blotter View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Instrument</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Live LTP</th>
                  <th className="py-3 px-4">Trigger Price</th>
                  <th className="py-3 px-4">Stop Loss</th>
                  <th className="py-3 px-4">Target 1</th>
                  <th className="py-3 px-4">Qty / Lots</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredSignals.map((sig) => {
                  const isBearish = sig.sentiment === 'Bearish';
                  return (
                    <tr key={sig.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white font-sans flex items-center gap-2">
                        <span>{sig.symbol}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({sig.exchange})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBearish ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {sig.sentiment}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        ₹{(sig.currentLtp || sig.triggerPrice).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sky-400 font-bold">
                        ₹{sig.triggerPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-rose-400">
                        ₹{sig.stopLoss.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-emerald-400">
                        ₹{sig.target1.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {sig.sizing.calculatedQty}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">
                          {sig.score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleExecute(sig)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-all"
                        >
                          Execute
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
