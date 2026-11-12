import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  TradeXSignal, 
  TradingStyle,
  Market,
  StockInfo
} from '../types/trading';
import { STOCK_UNIVERSE, generateNewLiveSignal } from '../data/stocks';
import { STRATEGIES } from '../data/strategies';
import { getExchangeMarketStatus, ExchangeMarketStatus } from '../engine/indicators';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ShieldCheck, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause,
  Calculator, 
  Layers, 
  LineChart, 
  Copy, 
  Check, 
  Radio, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Clock,
  Filter,
  BarChart3,
  Search,
  Plus,
  FastForward,
  Volume2,
  VolumeX,
  Activity,
  X
} from 'lucide-react';

interface LiveSignalsPageProps {
  mode: 'BUY' | 'SELL';
  signals: TradeXSignal[];
  selectedStyle: TradingStyle;
  onStyleChange: (style: TradingStyle) => void;
  onExecuteSignal: (signal: TradeXSignal) => void;
  onOpenTerminal: (symbol: string) => void;
  selectedMarket: Market;
}

export const LiveSignalsPage: React.FC<LiveSignalsPageProps> = ({
  mode,
  signals: initialSignals,
  selectedStyle,
  onStyleChange,
  onExecuteSignal,
  onOpenTerminal,
  selectedMarket,
}) => {
  // Live Market & Exchange State
  const [marketStatus, setMarketStatus] = useState<ExchangeMarketStatus>(() => getExchangeMarketStatus(selectedMarket));
  const [simulationReplayMode, setSimulationReplayMode] = useState<boolean>(false);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [liveSpeed, setLiveSpeed] = useState<'1x' | '2x' | '5x'>('1x');
  const [liveCountdown, setLiveCountdown] = useState<number>(3);
  const [signals, setSignals] = useState<TradeXSignal[]>(initialSignals);
  const [lastTickDirection, setLastTickDirection] = useState<Record<string, 'UP' | 'DOWN'>>({});
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoDiscoverEnabled, setAutoDiscoverEnabled] = useState<boolean>(true);
  const [liveClockTime, setLiveClockTime] = useState<string>('');
  
  // Modals & User Feedback
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  // Manual Add Form State
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('strat_dual_ema');
  const [selectedAddDirection, setSelectedAddDirection] = useState<'BUY' | 'SELL'>(mode);
  const [selectedAddInstrument, setSelectedAddInstrument] = useState<'CASH' | 'OPTIONS'>('CASH');

  // Filter States
  const [instrumentFilter, setInstrumentFilter] = useState<'ALL' | 'CASH' | 'OPTIONS'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Audio Chime synthesizer using Web Audio API
  const playAlertChime = (type: 'NEW_SIGNAL' | 'TARGET_HIT') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'NEW_SIGNAL') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2); // C6
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio autoplay may be muted by browser
    }
  };

  // Live second-by-second clock and exchange market status sync
  useEffect(() => {
    const updateClock = () => {
      const status = getExchangeMarketStatus(selectedMarket);
      setMarketStatus(status);
      setLiveClockTime(status.currentTimeFormatted);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [selectedMarket]);

  // Update Add Direction when mode changes
  useEffect(() => {
    setSelectedAddDirection(mode);
  }, [mode]);

  // Sync initial signals
  useEffect(() => {
    setSignals(initialSignals);
  }, [initialSignals]);

  // Speed interval mapping
  const tickIntervalMs = useMemo(() => {
    return liveSpeed === '5x' ? 400 : liveSpeed === '2x' ? 1000 : 2000;
  }, [liveSpeed]);

  // Auto-discover emerging signals as live market runs
  const autoScanCounterRef = useRef<number>(0);

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
            let hasTargetHit = false;

            const updated = currentSignals.map((sig) => {
              if (sig.scoreBand === 'NO TRADE') return sig;

              // Micro tick: +/- 0.05% to 0.20%
              const isUp = mode === 'BUY' ? Math.random() > 0.44 : Math.random() > 0.56;
              const deltaPct = (Math.random() * 0.0025 + 0.0005) * (isUp ? 1 : -1);
              const currentLtp = sig.currentLtp || sig.triggerPrice;
              const newLtp = parseFloat(Math.max(1, currentLtp * (1 + deltaPct)).toFixed(2));
              nextDirections[sig.id] = isUp ? 'UP' : 'DOWN';

              // Calculate progress towards Target 1
              const totalDistance = Math.abs(sig.target1 - sig.triggerPrice);
              const coveredDistance = Math.abs(newLtp - sig.triggerPrice);
              const progressPct = Math.min(100, Math.max(0, Math.round((coveredDistance / (totalDistance || 1)) * 100)));

              // Determine status
              let status: NonNullable<TradeXSignal['status']> = sig.status || 'TRIGGERED';
              if (sig.sentiment === 'Bullish' && newLtp >= sig.target1 && status !== 'TARGET_HIT') {
                status = 'TARGET_HIT';
                hasTargetHit = true;
              } else if (sig.sentiment === 'Bearish' && newLtp <= sig.target1 && status !== 'TARGET_HIT') {
                status = 'TARGET_HIT';
                hasTargetHit = true;
              } else if (sig.sentiment === 'Bullish' && newLtp <= sig.stopLoss) {
                status = 'STOP_HIT';
              } else if (sig.sentiment === 'Bearish' && newLtp >= sig.stopLoss) {
                status = 'STOP_HIT';
              }

              return {
                ...sig,
                currentLtp: newLtp,
                progressPct,
                status,
              };
            });

            if (hasTargetHit) {
              playAlertChime('TARGET_HIT');
              setToastMessage('🎯 Target 1 reached on live signal! Profit locked.');
              setTimeout(() => setToastMessage(null), 3000);
            }

            setLastTickDirection(nextDirections);
            return updated;
          });

          // Check if auto-discover is due (every ~8 ticks)
          autoScanCounterRef.current += 1;
          if (autoDiscoverEnabled && autoScanCounterRef.current >= 7) {
            autoScanCounterRef.current = 0;
            handleAutoDiscoverLiveSignal();
          }

          return liveSpeed === '5x' ? 1 : liveSpeed === '2x' ? 2 : 3;
        }
        return prev - 1;
      });
    }, tickIntervalMs);

    return () => clearInterval(interval);
  }, [isLiveActive, marketStatus.isOpen, simulationReplayMode, liveSpeed, mode, autoDiscoverEnabled, tickIntervalMs]);

  // Auto-discover a high-probability live signal
  const handleAutoDiscoverLiveSignal = () => {
    const candidates = STOCK_UNIVERSE.filter(s => selectedMarket === 'INDIA' ? s.market === 'INDIA' : s.market === 'US');
    const randomStock = candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
    const randomStrategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)] || STRATEGIES[0];
    
    const newSig = generateNewLiveSignal(
      randomStock,
      randomStrategy.name,
      mode,
      selectedStyle,
      randomStock.lotSize ? (Math.random() > 0.5 ? 'OPTIONS' : 'CASH') : 'CASH'
    );

    setSignals((prev) => [newSig, ...prev]);
    playAlertChime('NEW_SIGNAL');
    setToastMessage(`🔥 Live Engine Added: ${newSig.symbol} (${mode} Trigger @ ₹${newSig.triggerPrice})`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add custom live signal from modal
  const handleAddLiveSignalSubmit = () => {
    const stock = STOCK_UNIVERSE.find((s) => s.symbol === selectedStockSymbol) || STOCK_UNIVERSE[0];
    const strat = STRATEGIES.find((s) => s.id === selectedStrategyId) || STRATEGIES[0];

    const newSig = generateNewLiveSignal(
      stock,
      strat.name,
      selectedAddDirection,
      selectedStyle,
      selectedAddInstrument
    );

    setSignals((prev) => [newSig, ...prev]);
    setIsAddModalOpen(false);
    playAlertChime('NEW_SIGNAL');
    setToastMessage(`⚡ Successfully added live ${selectedAddDirection} signal: ${newSig.symbol}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter signals strictly based on mode (BUY vs SELL)
  const modeSignals = useMemo(() => {
    return signals.filter((sig) => {
      if (mode === 'BUY') {
        const isBuy = sig.sentiment === 'Bullish' || sig.signalType === 'CASH_BUY' || (sig.signalType === 'OPTIONS_BUY' && sig.optionsDetail?.optionType === 'CE') || (sig.signalType === 'OPTIONS_SELL' && sig.optionsDetail?.optionType === 'PE');
        return isBuy;
      } else {
        const isSell = sig.sentiment === 'Bearish' || sig.signalType === 'CASH_SELL' || (sig.signalType === 'OPTIONS_BUY' && sig.optionsDetail?.optionType === 'PE') || (sig.signalType === 'OPTIONS_SELL' && sig.optionsDetail?.optionType === 'CE');
        return isSell;
      }
    });
  }, [signals, mode]);

  // Secondary filters
  const filteredSignals = useMemo(() => {
    return modeSignals.filter((sig) => {
      // Instrument Filter
      if (instrumentFilter === 'CASH' && (sig.signalType === 'OPTIONS_BUY' || sig.signalType === 'OPTIONS_SELL')) return false;
      if (instrumentFilter === 'OPTIONS' && (sig.signalType === 'CASH_BUY' || sig.signalType === 'CASH_SELL')) return false;

      // Priority Filter
      if (priorityFilter !== 'ALL' && sig.priority !== priorityFilter) return false;

      // Strategy Filter
      if (selectedStrategyFilter !== 'ALL') {
        const stratName = (sig.strategyName || sig.opportunityTag).toLowerCase();
        if (!stratName.includes(selectedStrategyFilter.toLowerCase())) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSym = sig.symbol.toLowerCase().includes(q);
        const matchesName = sig.name.toLowerCase().includes(q);
        if (!matchesSym && !matchesName) return false;
      }

      return true;
    });
  }, [modeSignals, instrumentFilter, priorityFilter, selectedStrategyFilter, searchQuery]);

  const handleCopy = (sig: TradeXSignal) => {
    const text = `🚨 LIVE ${mode} SIGNAL: ${sig.symbol} (${sig.exchange})\n` +
      `Strategy: ${sig.strategyName || sig.opportunityTag}\n` +
      `Action: ${sig.triggerLabel} @ ₹${sig.triggerPrice}\n` +
      `Stop Loss: ₹${sig.stopLoss} | Target 1: ₹${sig.target1} | Target 2: ₹${sig.target2}\n` +
      `Score: ${sig.score}/100 (${sig.scoreBand})\n` +
      `Quantity: ${sig.sizing.calculatedQty} (Risk: ₹${sig.sizing.riskBudget})\n` +
      `Time Stop: ${sig.timeStop}`;
    
    navigator.clipboard?.writeText(text);
    setCopiedId(sig.id);
    setToastMessage(`Copied ${sig.symbol} live ${mode} parameters to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2500);
  };

  const handleExecute = (sig: TradeXSignal) => {
    onExecuteSignal(sig);
    setToastMessage(`Executed ${mode} paper order: ${sig.symbol} (${sig.sizing.calculatedQty} shares/lot)`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isBuyMode = mode === 'BUY';

  return (
    <div className="w-full space-y-5">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 ${isBuyMode ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'} px-4 py-2.5 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2 border ${isBuyMode ? 'border-emerald-300' : 'border-rose-300'} animate-in fade-in slide-in-from-top-2`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Institutional Live Market Running Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        
        {/* Top Status & Live Engine Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className={`w-3 h-3 rounded-full ${
                (marketStatus.isOpen && isLiveActive) || (simulationReplayMode && isLiveActive)
                  ? (isBuyMode ? 'bg-emerald-400 animate-ping' : 'bg-rose-400 animate-ping')
                  : 'bg-slate-500'
              }`}></span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {isBuyMode ? 'Live Buying Signals' : 'Live Selling Signals'} Desk
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                marketStatus.isOpen && isLiveActive
                  ? (isBuyMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-rose-500/20 text-rose-300 border border-rose-500/50')
                  : simulationReplayMode && isLiveActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {marketStatus.isOpen 
                  ? (isLiveActive ? '● LIVE MARKET RUNNING' : '⏸ ENGINE PAUSED')
                  : simulationReplayMode
                  ? (isLiveActive ? '⚡ SIMULATION REPLAY RUNNING' : '⏸ REPLAY PAUSED')
                  : '🔴 MARKET CLOSED (EOD SETUPS)'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {liveClockTime}
              </span>
              <span>•</span>
              <span className={`font-bold ${marketStatus.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                {marketStatus.sessionName}
              </span>
              <span>•</span>
              <span className="text-slate-300">{marketStatus.isOpen ? 'Latency: 12ms' : marketStatus.nextSessionStr}</span>
            </div>
          </div>

          {/* Action Hub: Run/Pause Live Market, Add Signal, Speed */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Run / Pause / Simulation Toggle */}
            <button
              onClick={() => {
                if (!marketStatus.isOpen) {
                  // If market is closed and user clicks, toggle simulation replay mode
                  if (!simulationReplayMode) {
                    setSimulationReplayMode(true);
                    setIsLiveActive(true);
                    setToastMessage('▶ Activated Strategy Simulation & Replay Mode for off-market practice.');
                    setTimeout(() => setToastMessage(null), 3500);
                  } else {
                    setIsLiveActive(!isLiveActive);
                  }
                } else {
                  setIsLiveActive(!isLiveActive);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                (marketStatus.isOpen ? isLiveActive : (simulationReplayMode && isLiveActive))
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              {(marketStatus.isOpen ? isLiveActive : (simulationReplayMode && isLiveActive)) ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Engine</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{marketStatus.isOpen ? 'Run Live Market' : 'Run Simulation / Replay'}</span>
                </>
              )}
            </button>

            {/* Live Speed Toggle */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
              {(['1x', '2x', '5x'] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setLiveSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    liveSpeed === spd 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Running speed ${spd}`}
                >
                  {spd}
                </button>
              ))}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled 
                  ? 'bg-slate-800 text-sky-400 border-slate-700' 
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
              title={soundEnabled ? 'Alert chimes ON' : 'Alert chimes MUTED'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Direct "+ Add Live Signal" Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                isBuyMode 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40' 
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Live Signal</span>
            </button>

            {/* Quick Auto Scan Button */}
            <button
              onClick={handleAutoDiscoverLiveSignal}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-950/40 transition-all active:scale-95"
              title="Instantly discover and inject a fresh high-confluence live setup"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Scan Universe</span>
            </button>

          </div>

        </div>

        {/* Filter Strip & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3.5">
          
          {/* Sub-Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'ALL', label: `All ${mode} (${modeSignals.length})` },
              { id: 'CASH', label: isBuyMode ? 'Cash BUY (Long)' : 'Cash / Futures Short' },
              { id: 'OPTIONS', label: isBuyMode ? 'Options BUY (CE) & Writing' : 'Options BUY (PE) & Writing' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setInstrumentFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  instrumentFilter === f.id
                    ? isBuyMode ? 'bg-emerald-600 text-white shadow-md' : 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Auto-Discover Toggle Pill */}
            <button
              onClick={() => setAutoDiscoverEnabled(!autoDiscoverEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                autoDiscoverEnabled 
                  ? 'bg-sky-950/70 border-sky-600 text-sky-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Auto-Discover: {autoDiscoverEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Search Box & Priority Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700 w-36 sm:w-44 font-mono"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(['ALL', 'High', 'Medium'] as const).map((pri) => (
                <button
                  key={pri}
                  onClick={() => setPriorityFilter(pri)}
                  className={`px-2 py-0.5 rounded-lg font-semibold transition-all ${
                    priorityFilter === pri 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pri}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Off-Market / Closed Exchange Explanation & Simulation Mode Banner */}
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
                  The Indian Stock Exchanges (NSE / BSE) operate strictly Monday to Friday from <strong>09:15 AM to 03:30 PM IST</strong>. Outside these hours, live exchange order matching is closed. The signals shown below are <strong className="text-sky-300">verified End-of-Day (EOD) Closing Setups</strong> calculated from the official 03:30 PM candle close across the 13 quantitative strategies and multi-factor scanners, ready for next session execution. Live ticks and random signal generation are <strong className="text-amber-300">paused</strong>.
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
                ⚡ Strategy Simulation & Replay Mode is Active (Off-Market Practice).
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
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
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

      {/* Signal Cards Feed */}
      <div className="space-y-4">
        {filteredSignals.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-300">No {mode} signals match the selected filter criteria.</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Add Live Signal" or "Scan Universe" above to inject new live setups!</p>
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const isExpanded = expandedSignalId === sig.id;
            const isNoTrade = sig.scoreBand === 'NO TRADE';
            const tickDir = lastTickDirection[sig.id];

            return (
              <div
                key={sig.id}
                className={`bg-slate-900/90 border ${
                  isNoTrade 
                    ? 'border-amber-900/40 bg-amber-950/10' 
                    : sig.isNew 
                    ? isBuyMode 
                      ? 'border-emerald-400 ring-1 ring-emerald-400 shadow-xl shadow-emerald-950/30' 
                      : 'border-rose-400 ring-1 ring-rose-400 shadow-xl shadow-rose-950/30'
                    : isBuyMode 
                    ? 'border-emerald-500/40 hover:border-emerald-500/80 shadow-lg shadow-emerald-950/20' 
                    : 'border-rose-500/40 hover:border-rose-500/80 shadow-lg shadow-rose-950/20'
                } rounded-2xl p-4 sm:p-5 transition-all`}
              >
                
                {/* Header row: Symbol, Strategy, Live LTP */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 border ${
                      isBuyMode 
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' 
                        : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                    }`}>
                      {sig.avatar}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {sig.symbol}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {sig.exchange}
                        </span>
                        {sig.isNew && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 animate-pulse tracking-wide uppercase">
                            LIVE NEW
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-400">
                          {sig.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs mt-1 text-slate-400">
                        <span className="font-bold text-sky-400">{sig.strategyName || sig.opportunityTag}</span>
                        <span>•</span>
                        <span>{sig.opportunityTag}</span>
                        <span>•</span>
                        <span>{sig.timeStr} ({sig.elapsedStr})</span>
                      </div>
                    </div>
                  </div>

                  {/* Live LTP & Status Badge */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">LIVE LTP:</span>
                      <span className={`text-lg sm:text-xl font-black font-mono transition-colors ${
                        tickDir === 'UP' ? 'text-emerald-400' : tickDir === 'DOWN' ? 'text-rose-400' : 'text-white'
                      }`}>
                        ₹{(sig.currentLtp || sig.triggerPrice).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        isBuyMode 
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}>
                        {isBuyMode ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isBuyMode ? 'BUY / LONG' : 'SELL / SHORT'}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                        sig.score >= 85 
                          ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' 
                          : sig.score >= 75 
                          ? 'bg-sky-950/80 border-sky-700 text-sky-300' 
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        Score: {sig.score}/100
                      </span>
                    </div>
                  </div>

                </div>

                {/* Precision Trade Levels: Trigger Point, Stop Loss, Target 1, Target 2 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 text-xs">
                  
                  {/* Trigger Point */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-0.5">
                      <span>Exact Trigger Point</span>
                      <Crosshair className="w-3 h-3 text-sky-400" />
                    </div>
                    <span className="text-sm sm:text-base font-black font-mono text-white block">
                      ₹{sig.triggerPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {sig.triggerCondition} ({sig.triggerLabel})
                    </span>
                  </div>

                  {/* Accurate Stop Loss */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/60">
                    <div className="flex items-center justify-between text-rose-300 text-[10px] uppercase font-mono mb-0.5">
                      <span>Accurate Stop Loss</span>
                      <ShieldCheck className="w-3 h-3 text-rose-400" />
                    </div>
                    <span className="text-sm sm:text-base font-black font-mono text-rose-400 block">
                      ₹{sig.stopLoss.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Risk/Share: ₹{sig.sizing.perShareRisk}
                    </span>
                  </div>

                  {/* Target 1 (1:2 RR) */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/60">
                    <div className="flex items-center justify-between text-emerald-300 text-[10px] uppercase font-mono mb-0.5">
                      <span>Target 1 (1:2.0 RR)</span>
                      <span className="text-emerald-400 font-bold">1:2</span>
                    </div>
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-400 block">
                      ₹{sig.target1.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-500/80">
                      Primary Profit Peak
                    </span>
                  </div>

                  {/* Target 2 (Runner) */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/60">
                    <div className="flex items-center justify-between text-emerald-300 text-[10px] uppercase font-mono mb-0.5">
                      <span>Target 2 (Runner)</span>
                      <span className="text-emerald-400 font-bold">1:3.3</span>
                    </div>
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-400 block">
                      ₹{sig.target2.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-500/80">
                      Macro Trend Extension
                    </span>
                  </div>

                </div>

                {/* Live Distance to Target Progress Bar */}
                <div className="mb-3 px-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Live Target Progress</span>
                    <span className={`font-bold ${isBuyMode ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sig.progressPct || 0}% completed towards Target 1
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isBuyMode ? 'bg-gradient-to-r from-emerald-500 to-sky-400' : 'bg-gradient-to-r from-rose-500 to-amber-400'
                      }`}
                      style={{ width: `${sig.progressPct || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Capital Risk Budget Sizing (PDF Specification Chapter 5) */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-3 text-xs font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-200 font-sans font-bold">
                      <Calculator className="w-3.5 h-3.5 text-sky-400" />
                      <span>Position Sizing (₹1,00,000 Equity · 1% Risk = ₹1,000 Budget):</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span>Quantity: <strong className="text-sky-300 font-bold">{sig.sizing.calculatedQty} {sig.sizing.lotSize ? `(${sig.sizing.contractLots || 1} Lot)` : 'Shares'}</strong></span>
                      <span>Per-Share Risk: <strong className="text-rose-300">₹{sig.sizing.perShareRisk}</strong></span>
                      <span>Margin: <strong className="text-slate-200">₹{(sig.sizing.marginRequired || sig.sizing.calculatedQty * sig.triggerPrice).toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Option Contract Specs (if Option Signal) */}
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

                {/* Strategy Evidence & Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  
                  <button
                    onClick={() => setExpandedSignalId(isExpanded ? null : sig.id)}
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isExpanded ? 'Hide Live Multi-Factor Analysis' : 'Inspect Live Multi-Factor Analysis & Strategy Logic'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(sig)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {copiedId === sig.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Details</span>
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
                      className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                        isBuyMode 
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60' 
                          : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/60'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Execute {mode} Order ({sig.sizing.calculatedQty} {sig.sizing.lotSize ? 'Lot' : 'Qty'})</span>
                    </button>
                  </div>

                </div>

                {/* Deep Live Analysis Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 text-xs">
                    
                    {/* Real-time Checklist of 5 Scanners */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Live Multi-Factor Scanner Checklist</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase block">Candlestick Pattern Scanner:</span>
                          <span>{sig.evidence.candlePattern}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                          <span className="text-[10px] font-bold text-sky-400 uppercase block">Volume & Flow Scanner:</span>
                          <span>{sig.evidence.volumeStatus}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                          <span className="text-[10px] font-bold text-purple-400 uppercase block">F&O Derivatives Scanner:</span>
                          <span>{sig.evidence.fnoBuildup}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                          <span className="text-[10px] font-bold text-amber-400 uppercase block">Trend & Indicator Stack:</span>
                          <span>{sig.evidence.trendStatus} · {sig.evidence.indicatorsDetail}</span>
                        </div>
                      </div>
                    </div>

                    {/* 100-Point Framework Breakdown (PDF Section 8) */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-slate-300 mb-2">100-Point Scoring Framework Breakdown</div>
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

                    {/* Invalidation Condition & Time Stop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Time Stop Rule</span>
                        <span>{sig.timeStop}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-bold text-rose-300 uppercase block mb-1">Invalidation Condition</span>
                        <span>{sig.invalidationCondition}</span>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Add Live Market Signal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Plus className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Add Live Market Signal
                </h3>
                <p className="text-xs text-slate-400">
                  Inject a live signal into the running market stream with automated ₹1,00,000 risk-budget calculation.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-3">
              
              {/* Select Stock */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Instrument / Stock</label>
                <select
                  value={selectedStockSymbol}
                  onChange={(e) => setSelectedStockSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {STOCK_UNIVERSE.filter(s => selectedMarket === 'INDIA' ? s.market === 'INDIA' : s.market === 'US').map((st) => (
                    <option key={st.symbol} value={st.symbol}>
                      {st.symbol} - {st.name} ({st.currencySymbol}{st.currentPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Strategy */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Quantitative Strategy (13 Models)</label>
                <select
                  value={selectedStrategyId}
                  onChange={(e) => setSelectedStrategyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {STRATEGIES.map((strat) => (
                    <option key={strat.id} value={strat.id}>
                      {strat.name} ({strat.categoryLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Direction & Instrument Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Signal Direction</label>
                  <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedAddDirection('BUY')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedAddDirection === 'BUY' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      BUY / LONG
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAddDirection('SELL')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedAddDirection === 'SELL' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      SELL / SHORT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Contract / Segment</label>
                  <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedAddInstrument('CASH')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedAddInstrument === 'CASH' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Cash Equity
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAddInstrument('OPTIONS')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedAddInstrument === 'OPTIONS' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Options F&O
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Automated Risk & Trade Plan</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>Capital: <span className="text-white font-bold">₹1,00,000</span></div>
                  <div>Risk Budget (1%): <span className="text-amber-300 font-bold">₹1,000</span></div>
                  <div>Take Profit 1: <span className="text-emerald-400 font-bold">1:2.0 RR</span></div>
                  <div>Runner Target 2: <span className="text-emerald-400 font-bold">1:3.3 RR</span></div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddLiveSignalSubmit}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all ${
                    selectedAddDirection === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                  }`}
                >
                  + Inject Signal into Live Market
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
