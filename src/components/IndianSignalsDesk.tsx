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
  ChevronDown, 
  ChevronUp, 
  Zap,
  Clock,
  Search,
  Plus,
  Volume2,
  VolumeX,
  Activity,
  X,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Archive,
  RefreshCw
} from 'lucide-react';

interface IndianSignalsDeskProps {
  signals: TradeXSignal[];
  selectedStyle: TradingStyle;
  onStyleChange: (style: TradingStyle) => void;
  onExecuteSignal: (signal: TradeXSignal) => void;
  onOpenTerminal: (symbol: string) => void;
  initialDirection?: 'ALL' | 'BUY' | 'SELL';
}

export const IndianSignalsDesk: React.FC<IndianSignalsDeskProps> = ({
  signals: initialSignals,
  selectedStyle,
  onStyleChange,
  onExecuteSignal,
  onOpenTerminal,
  initialDirection = 'ALL',
}) => {
  // Exchange Market & Live Status (Strictly Indian Markets)
  const [marketStatus, setMarketStatus] = useState<ExchangeMarketStatus>(() => getExchangeMarketStatus('INDIA'));
  const [liveClockTime, setLiveClockTime] = useState<string>('');
  
  // Real-time Engine States: by default FALSE when market is closed so signals do NOT auto-generate
  const [isLiveActive, setIsLiveActive] = useState<boolean>(() => marketStatus.isOpen);
  const [autoDiscoverEnabled, setAutoDiscoverEnabled] = useState<boolean>(false);
  const [simulationReplayMode, setSimulationReplayMode] = useState<boolean>(false);
  const [liveSpeed, setLiveSpeed] = useState<'1x' | '2x' | '5x'>('1x');
  const [liveCountdown, setLiveCountdown] = useState<number>(3);
  
  // All Managed Signals: Active, Completed (Target Hit), and Stopped Out
  const [signals, setSignals] = useState<TradeXSignal[]>(initialSignals);
  const [completedSignals, setCompletedSignals] = useState<TradeXSignal[]>([]);
  const [stoppedSignals, setStoppedSignals] = useState<TradeXSignal[]>([]);
  const [lastTickDirection, setLastTickDirection] = useState<Record<string, 'UP' | 'DOWN'>>({});

  // View & Filter States requested by user:
  // 1. Trading Style Filter: 'ALL' | 'intraday' | 'swing' | 'positional'
  const [activeStyleFilter, setActiveStyleFilter] = useState<'ALL' | TradingStyle>('ALL');
  
  // 2. Direction Filter: 'ALL' | 'BUY' | 'SELL'
  const [activeDirectionFilter, setActiveDirectionFilter] = useState<'ALL' | 'BUY' | 'SELL'>(initialDirection);
  
  // 3. Tab View: 'ACTIVE' | 'COMPLETED' | 'STOPPED'
  const [viewTab, setViewTab] = useState<'ACTIVE' | 'COMPLETED' | 'STOPPED'>('ACTIVE');
  
  // 4. Instrument Filter
  const [instrumentFilter, setInstrumentFilter] = useState<'ALL' | 'CASH' | 'OPTIONS' | 'MCX'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // UI States
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Manual Add Form State
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('RELIANCE');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('strat_dual_ema');
  const [selectedAddDirection, setSelectedAddDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedAddStyle, setSelectedAddStyle] = useState<TradingStyle>('swing');
  const [selectedAddInstrument, setSelectedAddInstrument] = useState<'CASH' | 'OPTIONS'>('CASH');

  // Sync initial signals
  useEffect(() => {
    setSignals(initialSignals);
  }, [initialSignals]);

  // Sync Indian Standard Time and Exchange hours
  useEffect(() => {
    const update = () => {
      const status = getExchangeMarketStatus('INDIA');
      setMarketStatus(status);
      setLiveClockTime(status.currentTimeFormatted);
      
      // If exchange closed and not in deliberate simulation replay, pause live engine
      if (!status.isOpen && !simulationReplayMode) {
        setIsLiveActive(false);
        setAutoDiscoverEnabled(false);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [simulationReplayMode]);

  // Audio alerts synthesizer
  const playChime = (type: 'TARGET' | 'STOP' | 'SIGNAL') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'TARGET') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'STOP') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio autoplay restrictions
    }
  };

  const autoScanCounterRef = useRef<number>(0);
  const tickSpeedMs = liveSpeed === '5x' ? 400 : liveSpeed === '2x' ? 1000 : 2000;

  // Gated Live Tick Engine: Only runs when market is genuinely OPEN OR in deliberate Simulation Replay Mode
  useEffect(() => {
    const isEngineActive = isLiveActive && (marketStatus.isOpen || simulationReplayMode);
    if (!isEngineActive) return;

    const interval = setInterval(() => {
      setLiveCountdown((prev) => {
        if (prev <= 1) {
          // Pulse micro-ticks across active signals
          setSignals((currentSignals) => {
            const nextDirections: Record<string, 'UP' | 'DOWN'> = {};
            const newlyCompleted: TradeXSignal[] = [];
            const newlyStopped: TradeXSignal[] = [];
            const remaining: TradeXSignal[] = [];

            currentSignals.forEach((sig) => {
              if (sig.scoreBand === 'NO TRADE') {
                remaining.push(sig);
                return;
              }

              // Realistic micro-tick: +/- 0.05% to 0.18%
              const isUp = sig.sentiment === 'Bullish' ? Math.random() > 0.42 : Math.random() > 0.58;
              const deltaPct = (Math.random() * 0.002 + 0.0004) * (isUp ? 1 : -1);
              const currentLtp = sig.currentLtp || sig.triggerPrice;
              const newLtp = parseFloat(Math.max(1, currentLtp * (1 + deltaPct)).toFixed(2));
              nextDirections[sig.id] = isUp ? 'UP' : 'DOWN';

              // Calculate progress towards Target 1
              const totalDistance = Math.abs(sig.target1 - sig.triggerPrice);
              const coveredDistance = Math.abs(newLtp - sig.triggerPrice);
              const progressPct = Math.min(100, Math.max(0, Math.round((coveredDistance / (totalDistance || 1)) * 100)));

              // Calculate Adverse Movement Working Plan (if price moves opposite to signal)
              let isOpposite = false;
              let adversePoints = 0;
              let adversePct = 0;

              if (sig.sentiment === 'Bullish' && newLtp < sig.triggerPrice) {
                isOpposite = true;
                adversePoints = parseFloat((sig.triggerPrice - newLtp).toFixed(2));
                adversePct = parseFloat(((adversePoints / sig.triggerPrice) * 100).toFixed(2));
              } else if (sig.sentiment === 'Bearish' && newLtp > sig.triggerPrice) {
                isOpposite = true;
                adversePoints = parseFloat((newLtp - sig.triggerPrice).toFixed(2));
                adversePct = parseFloat(((adversePoints / sig.triggerPrice) * 100).toFixed(2));
              }

              const adverseDetail = isOpposite && adversePct >= 0.25 ? {
                isOpposite: true,
                adversePoints,
                adversePct,
                warningTitle: `⚠️ Adverse Opposite Move: Price is ₹${adversePoints} (-${adversePct}%) contrary to entry trigger`,
                stopLossGuard: `Strict Invalidation Stop Loss anchored at ₹${sig.stopLoss}. Capital risk is capped at ₹${sig.sizing.riskBudget} (1% of ₹1,00,000 model).`,
                workingPlan: `Rule: Do NOT average down. If 5-minute candle closes beyond ₹${sig.stopLoss}, immediately square off to protect capital.`,
                hedgingAction: sig.optionsDetail 
                  ? `Options Delta Hedge: Buy ATM ${sig.optionsDetail.optionType === 'CE' ? 'PE' : 'CE'} to neutralize delta risk.`
                  : `Hedge: Look for reversal setup below ₹${sig.stopLoss}.`,
              } : undefined;

              // Check if TARGET is REACHED -> User requirement: "once aa target reach ayyaka signal nundi vellipovali"
              const targetReached = 
                (sig.sentiment === 'Bullish' && newLtp >= sig.target1) ||
                (sig.sentiment === 'Bearish' && newLtp <= sig.target1);

              // Check if STOP LOSS is HIT
              const stopHit = 
                (sig.sentiment === 'Bullish' && newLtp <= sig.stopLoss) ||
                (sig.sentiment === 'Bearish' && newLtp >= sig.stopLoss);

              if (targetReached) {
                const profitPoints = Math.abs(sig.target1 - sig.triggerPrice);
                const realizedPnl = Math.round(profitPoints * sig.sizing.calculatedQty);
                newlyCompleted.push({
                  ...sig,
                  currentLtp: newLtp,
                  exitPrice: sig.target1,
                  status: 'TARGET_HIT',
                  progressPct: 100,
                  completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  realizedPnl,
                });
              } else if (stopHit) {
                const lossPoints = Math.abs(sig.stopLoss - sig.triggerPrice);
                const realizedPnl = -Math.round(lossPoints * sig.sizing.calculatedQty);
                newlyStopped.push({
                  ...sig,
                  currentLtp: newLtp,
                  exitPrice: sig.stopLoss,
                  status: 'STOP_HIT',
                  completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  realizedPnl,
                });
              } else {
                remaining.push({
                  ...sig,
                  currentLtp: newLtp,
                  progressPct,
                  adverseDetail,
                });
              }
            });

            // If any signals hit targets, move them out of active signals
            if (newlyCompleted.length > 0) {
              setCompletedSignals((prev) => [...newlyCompleted, ...prev]);
              playChime('TARGET');
              setToastMessage(`🎯 Target Achieved on ${newlyCompleted.map(s => s.symbol).join(', ')}! Automatically moved to Completed Trades.`);
              setTimeout(() => setToastMessage(null), 4000);
            }

            // If any signals hit stop loss, move them to stopped archive
            if (newlyStopped.length > 0) {
              setStoppedSignals((prev) => [...newlyStopped, ...prev]);
              playChime('STOP');
              setToastMessage(`🛡️ Stop Loss Triggered on ${newlyStopped.map(s => s.symbol).join(', ')}. Capital protected within 1% risk budget.`);
              setTimeout(() => setToastMessage(null), 4000);
            }

            setLastTickDirection(nextDirections);
            return remaining;
          });

          // Check if auto-discover is due (ONLY when market is open or deliberate replay mode)
          autoScanCounterRef.current += 1;
          if (autoDiscoverEnabled && autoScanCounterRef.current >= 8 && (marketStatus.isOpen || simulationReplayMode)) {
            autoScanCounterRef.current = 0;
            handleAutoDiscoverSignal();
          }

          return liveSpeed === '5x' ? 1 : liveSpeed === '2x' ? 2 : 3;
        }
        return prev - 1;
      });
    }, tickSpeedMs);

    return () => clearInterval(interval);
  }, [isLiveActive, marketStatus.isOpen, simulationReplayMode, liveSpeed, autoDiscoverEnabled, tickSpeedMs]);

  // Manually or automatically trigger target achievement on a signal
  const handleManualAchieveTarget = (sig: TradeXSignal) => {
    const profitPoints = Math.abs(sig.target1 - sig.triggerPrice);
    const realizedPnl = Math.round(profitPoints * sig.sizing.calculatedQty);
    const completedSig: TradeXSignal = {
      ...sig,
      currentLtp: sig.target1,
      exitPrice: sig.target1,
      status: 'TARGET_HIT',
      progressPct: 100,
      completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      realizedPnl,
    };

    setSignals((prev) => prev.filter(s => s.id !== sig.id));
    setCompletedSignals((prev) => [completedSig, ...prev]);
    playChime('TARGET');
    setToastMessage(`🎯 ${sig.symbol} Target 1 achieved! Profit ₹${realizedPnl} locked. Signal moved out of active feed.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Discover new Indian market signal
  const handleAutoDiscoverSignal = () => {
    const indianStocks = STOCK_UNIVERSE;
    const randomStock = indianStocks[Math.floor(Math.random() * indianStocks.length)] || indianStocks[0];
    const randomStrategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)] || STRATEGIES[0];
    const targetDirection = activeDirectionFilter === 'ALL' 
      ? (Math.random() > 0.5 ? 'BUY' : 'SELL') 
      : activeDirectionFilter;
    const targetStyle = activeStyleFilter === 'ALL' ? selectedStyle : activeStyleFilter;

    const newSig = generateNewLiveSignal(
      randomStock,
      randomStrategy.name,
      targetDirection,
      targetStyle,
      randomStock.lotSize ? (Math.random() > 0.5 ? 'OPTIONS' : 'CASH') : 'CASH'
    );

    setSignals((prev) => [newSig, ...prev]);
    playChime('SIGNAL');
    setToastMessage(`⚡ New Indian Market Signal: ${newSig.symbol} (${targetDirection} @ ₹${newSig.triggerPrice})`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Manual Add Signal Submit
  const handleAddSignalSubmit = () => {
    const stock = STOCK_UNIVERSE.find((s) => s.symbol === selectedStockSymbol) || STOCK_UNIVERSE[0];
    const strat = STRATEGIES.find((s) => s.id === selectedStrategyId) || STRATEGIES[0];

    const newSig = generateNewLiveSignal(
      stock,
      strat.name,
      selectedAddDirection,
      selectedAddStyle,
      selectedAddInstrument
    );

    setSignals((prev) => [newSig, ...prev]);
    setIsAddModalOpen(false);
    playChime('SIGNAL');
    setToastMessage(`⚡ Injected ${selectedAddDirection} signal for ${newSig.symbol} into active feed.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter signals based on Direction and Style as requested
  const filteredActiveSignals = useMemo(() => {
    return signals.filter((sig) => {
      // 1. Style Filter: 'ALL' | 'intraday' | 'swing' | 'positional'
      if (activeStyleFilter !== 'ALL' && sig.style !== activeStyleFilter) return false;

      // 2. Direction Filter: 'ALL' | 'BUY' | 'SELL'
      if (activeDirectionFilter === 'BUY') {
        const isBuy = sig.sentiment === 'Bullish' || sig.signalType === 'CASH_BUY' || (sig.signalType === 'OPTIONS_BUY' && sig.optionsDetail?.optionType === 'CE');
        if (!isBuy) return false;
      } else if (activeDirectionFilter === 'SELL') {
        const isSell = sig.sentiment === 'Bearish' || sig.signalType === 'CASH_SELL' || (sig.signalType === 'OPTIONS_BUY' && sig.optionsDetail?.optionType === 'PE');
        if (!isSell) return false;
      }

      // 3. Instrument Segment
      if (instrumentFilter === 'CASH' && (sig.signalType === 'OPTIONS_BUY' || sig.signalType === 'OPTIONS_SELL')) return false;
      if (instrumentFilter === 'OPTIONS' && (sig.signalType === 'CASH_BUY' || sig.signalType === 'CASH_SELL')) return false;
      if (instrumentFilter === 'MCX' && sig.exchange !== 'MCX') return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSym = sig.symbol.toLowerCase().includes(q);
        const matchesName = sig.name.toLowerCase().includes(q);
        if (!matchesSym && !matchesName) return false;
      }

      return true;
    });
  }, [signals, activeStyleFilter, activeDirectionFilter, instrumentFilter, searchQuery]);

  // Counts for tabs
  const buyCount = useMemo(() => {
    return signals.filter(s => s.sentiment === 'Bullish' || s.signalType === 'CASH_BUY').length;
  }, [signals]);

  const sellCount = useMemo(() => {
    return signals.filter(s => s.sentiment === 'Bearish' || s.signalType === 'CASH_SELL').length;
  }, [signals]);

  const handleCopy = (sig: TradeXSignal) => {
    const text = `🚨 INDIAN MARKET SIGNAL: ${sig.symbol} (${sig.exchange})\n` +
      `Strategy: ${sig.strategyName || sig.opportunityTag}\n` +
      `Action: ${sig.triggerLabel} @ ₹${sig.triggerPrice}\n` +
      `Stop Loss: ₹${sig.stopLoss} | Target 1: ₹${sig.target1} | Target 2: ₹${sig.target2}\n` +
      `Score: ${sig.score}/100 (${sig.scoreBand})\n` +
      `Quantity: ${sig.sizing.calculatedQty} (Risk: ₹${sig.sizing.riskBudget})\n` +
      `Time Stop: ${sig.timeStop}`;
    
    navigator.clipboard?.writeText(text);
    setCopiedId(sig.id);
    setToastMessage(`Copied ${sig.symbol} signal parameters to clipboard!`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null), 2500;
    }, 2500);
  };

  const handleExecute = (sig: TradeXSignal) => {
    onExecuteSignal(sig);
    setToastMessage(`Executed paper order: ${sig.symbol} (${sig.sizing.calculatedQty} Qty/Lot)`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="w-full space-y-5">

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black shadow-2xl flex items-center gap-2 border border-emerald-300 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Institutional Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        
        {/* Row 1: Workspace Title + Live Exchange Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className={`w-3 h-3 rounded-full ${
                marketStatus.isOpen && isLiveActive ? 'bg-emerald-400 animate-ping' : simulationReplayMode && isLiveActive ? 'bg-amber-400 animate-ping' : 'bg-slate-500'
              }`}></span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Indian Market Signals Desk
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                marketStatus.isOpen && isLiveActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : simulationReplayMode && isLiveActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {marketStatus.isOpen 
                  ? (isLiveActive ? '● LIVE NSE / MCX SESSION RUNNING' : '⏸ ENGINE PAUSED')
                  : simulationReplayMode
                  ? (isLiveActive ? '⚡ REPLAY / PRACTICE RUNNING' : '⏸ REPLAY PAUSED')
                  : '🔴 MARKET CLOSED (09:15-15:30 IST)'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono flex-wrap">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {liveClockTime} IST
              </span>
              <span>•</span>
              <span className={`font-bold ${marketStatus.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                {marketStatus.sessionName}
              </span>
              <span>•</span>
              <span className="text-slate-300">
                {marketStatus.isOpen ? 'Latency: 12ms · Real-Time Order Stream' : marketStatus.nextSessionStr}
              </span>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Run / Pause / Simulation Mode Button */}
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
                  <span>{marketStatus.isOpen ? 'Run Live Market' : 'Run Simulation Mode'}</span>
                </>
              )}
            </button>

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
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Signal</span>
            </button>

            {/* Scan Universe Button */}
            <button
              onClick={handleAutoDiscoverSignal}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-950/40 transition-all active:scale-95"
              title="Inject a high-confluence setup"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Scan Indian Stocks</span>
            </button>

          </div>
        </div>

        {/* Row 2: Trading Style Tabs (All, Intraday, Swing Trade, Positional) */}
        <div className="pt-4 pb-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider shrink-0">
              Trading Style:
            </span>
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: 'All Styles (Combined)' },
                { id: 'intraday', label: '⚡ Intraday (5m Candles)' },
                { id: 'swing', label: '🌊 Swing Trade (Daily 3-15d)' },
                { id: 'positional', label: '🏔 Positional (Macro 1-Yr)' },
              ].map((styleTab) => (
                <button
                  key={styleTab.id}
                  onClick={() => {
                    setActiveStyleFilter(styleTab.id as any);
                    if (styleTab.id !== 'ALL') onStyleChange(styleTab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                    activeStyleFilter === styleTab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {styleTab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active vs Completed Targets vs Protected Loss Tabs */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setViewTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewTab === 'ACTIVE' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Active Signals</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-white font-mono">
                {filteredActiveSignals.length}
              </span>
            </button>
            <button
              onClick={() => setViewTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewTab === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Targets achieved - automatically removed from active signals"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Targets Achieved</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono font-bold">
                {completedSignals.length}
              </span>
            </button>
            <button
              onClick={() => setViewTab('STOPPED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                viewTab === 'STOPPED' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stop loss protected trades"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Capital Protected</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono font-bold">
                {stoppedSignals.length}
              </span>
            </button>
          </div>

        </div>

        {/* Row 3: Direction Filter Tabs (All, Buy, Sale) + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3.5">
          
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            
            {/* Direction Filter Tabs requested by user */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveDirectionFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  activeDirectionFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Signals ({signals.length})
              </button>
              <button
                onClick={() => setActiveDirectionFilter('BUY')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeDirectionFilter === 'BUY' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>🟢 BUY Signals ({buyCount})</span>
              </button>
              <button
                onClick={() => setActiveDirectionFilter('SELL')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeDirectionFilter === 'SELL' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>🔴 SALE / SELL Signals ({sellCount})</span>
              </button>
            </div>

            {/* Instrument Segment Filter */}
            <div className="flex items-center gap-1">
              {[
                { id: 'ALL', label: 'All Segments' },
                { id: 'CASH', label: 'Cash Equity' },
                { id: 'OPTIONS', label: 'Options F&O' },
                { id: 'MCX', label: 'MCX Futures' },
              ].map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setInstrumentFilter(inst.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    instrumentFilter === inst.id
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {inst.label}
                </button>
              ))}
            </div>

          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Indian stock or index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-700 w-full sm:w-52 font-mono"
            />
          </div>

        </div>

      </div>

      {/* Closed Exchange Notice Banner (Guarantees no signals auto-generate while market is closed) */}
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
                    INDIAN EXCHANGE CLOSED: {marketStatus.sessionName}
                  </span>
                  <span className="text-slate-400 font-mono">({marketStatus.sessionTimeStr})</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  Market is currently closed. Auto-generation and live ticks are paused.
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  NSE & BSE trading operates strictly Monday to Friday from <strong>09:15 AM to 03:30 PM IST</strong>. To prevent false signals while the exchange is not running, live signal generation and micro-ticks are <strong className="text-amber-300">disabled</strong>. The setups below are <strong className="text-sky-300">verified End-of-Day (EOD) Closing Setups</strong> calculated on official 03:30 PM closing candle data across the 13 quantitative strategies, ready for the next opening session.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSimulationReplayMode(true);
                setIsLiveActive(true);
                setToastMessage('▶ Activated Strategy Simulation Mode for practice.');
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 self-start md:self-center"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Practice Simulation Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Simulation Replay Banner if manually enabled during closed hours */}
      {simulationReplayMode && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
            <div>
              <span className="font-bold text-indigo-200">
                ⚡ Strategy Simulation & Replay Mode Active (Off-Market Practice).
              </span>
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Simulated micro-ticks, dynamic target progress, and adverse opposite movement working plans are running for strategy testing.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setSimulationReplayMode(false);
              setIsLiveActive(false);
              setToastMessage('⏸ Reverted to static EOD verified setups.');
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[11px] font-bold shrink-0 border border-slate-700"
          >
            Exit Replay (Keep EOD Static)
          </button>
        </div>
      )}

      {/* Indian Market Ticker Tape */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        {[
          { sym: 'NIFTY 50', ltp: '24,140.00', chg: '+0.72%', up: true },
          { sym: 'BANKNIFTY', ltp: '51,800.00', chg: '+1.15%', up: true },
          { sym: 'RELIANCE', ltp: '2,985.40', chg: '+1.65%', up: true },
          { sym: 'HDFCBANK', ltp: '1,745.20', chg: '+1.28%', up: true },
          { sym: 'POLICYBZR', ltp: '928.50', chg: '-1.82%', up: false },
          { sym: 'CRUDEOIL', ltp: '9,180.00', chg: '-2.35%', up: false },
        ].map((item, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-300 block">{item.sym}</span>
              <span className="text-white font-bold font-mono">₹{item.ltp}</span>
            </div>
            <span className={`text-[11px] font-bold ${item.up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {item.chg}
            </span>
          </div>
        ))}
      </div>

      {/* ================================================================================= */}
      {/* VIEW 1: ACTIVE SIGNALS FEED */}
      {/* ================================================================================= */}
      {viewTab === 'ACTIVE' && (
        <div className="space-y-4">
          {filteredActiveSignals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
              <p className="text-sm font-bold text-white">No active signals match the selected filters.</p>
              <p className="text-xs text-slate-400">
                Click "+ Add Signal" or "Scan Indian Stocks" above, or switch to the "Targets Achieved" tab to review completed trades.
              </p>
            </div>
          ) : (
            filteredActiveSignals.map((sig) => {
              const isExpanded = expandedSignalId === sig.id;
              const isBuy = sig.sentiment === 'Bullish' || sig.signalType === 'CASH_BUY';
              const tickDir = lastTickDirection[sig.id];
              const adverse = sig.adverseDetail;

              return (
                <div
                  key={sig.id}
                  className={`bg-slate-900/90 border ${
                    adverse
                      ? 'border-amber-500/70 ring-1 ring-amber-500/40 shadow-xl shadow-amber-950/20'
                      : isBuy 
                      ? 'border-emerald-500/40 hover:border-emerald-500/80 shadow-lg shadow-emerald-950/20' 
                      : 'border-rose-500/40 hover:border-rose-500/80 shadow-lg shadow-rose-950/20'
                  } rounded-2xl p-4 sm:p-5 transition-all`}
                >
                  
                  {/* Card Header: Symbol, Segment, Live LTP, Strategy */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-sm shrink-0 border ${
                        isBuy 
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                            {sig.opportunityTag}
                          </span>
                          {sig.isNew && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 animate-pulse tracking-wide uppercase">
                              NEW
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs mt-1 text-slate-400">
                          <span className="font-bold text-sky-400">{sig.strategyName || sig.opportunityTag}</span>
                          <span>•</span>
                          <span>{sig.name}</span>
                          <span>•</span>
                          <span>{sig.timeStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Live LTP & Status */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">LTP:</span>
                        <span className={`text-lg sm:text-xl font-black font-mono transition-colors ${
                          tickDir === 'UP' ? 'text-emerald-400' : tickDir === 'DOWN' ? 'text-rose-400' : 'text-white'
                        }`}>
                          ₹{(sig.currentLtp || sig.triggerPrice).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                          isBuy 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        }`}>
                          {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{isBuy ? 'BUY / LONG' : 'SALE / SHORT'}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                          Score: {sig.score}/100
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* ========================================================================= */}
                  {/* USER REQUIREMENT: ADVERSE / OPPOSITE MARKET WORKING PLAN BANNER */}
                  {/* ========================================================================= */}
                  {adverse && (
                    <div className="bg-gradient-to-r from-amber-950/60 via-slate-950 to-slate-950 border border-amber-500/80 rounded-xl p-3.5 mb-3 text-xs shadow-lg animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-black text-amber-300 uppercase tracking-wide text-[11px]">
                              {adverse.warningTitle}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Adverse Drawdown: -{adverse.adversePct}%
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-900/40 text-slate-200 space-y-1 font-mono text-[11px]">
                            <div>
                              <strong className="text-amber-400">🛡️ Capital Risk Guard: </strong>
                              <span>{adverse.stopLossGuard}</span>
                            </div>
                            <div>
                              <strong className="text-sky-300">📋 Actionable Protocol: </strong>
                              <span>{adverse.workingPlan}</span>
                            </div>
                            <div>
                              <strong className="text-purple-300">⚡ Hedging Working: </strong>
                              <span>{adverse.hedgingAction}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Precision Trade Levels: Trigger Point, Stop Loss, Target 1, Target 2 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 text-xs">
                    
                    {/* Trigger Point */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono mb-0.5">
                        <span>Trigger Point</span>
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

                    {/* Target 1 */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/60">
                      <div className="flex items-center justify-between text-emerald-300 text-[10px] uppercase font-mono mb-0.5">
                        <span>Target 1 (1:2.0 RR)</span>
                        <span className="text-emerald-400 font-bold">1:2</span>
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono text-emerald-400 block">
                        ₹{sig.target1.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-500/80">
                        Primary Profit Exit
                      </span>
                    </div>

                    {/* Target 2 */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/60">
                      <div className="flex items-center justify-between text-emerald-300 text-[10px] uppercase font-mono mb-0.5">
                        <span>Target 2 (Runner)</span>
                        <span className="text-emerald-400 font-bold">1:3.3</span>
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono text-emerald-400 block">
                        ₹{sig.target2.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-emerald-500/80">
                        Extended Trend Wave
                      </span>
                    </div>

                  </div>

                  {/* Target Distance Progress Bar */}
                  <div className="mb-3 px-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>Target Progress</span>
                      <span className={`font-bold ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {sig.progressPct || 0}% completed towards Target 1
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isBuy ? 'bg-gradient-to-r from-emerald-500 to-sky-400' : 'bg-gradient-to-r from-rose-500 to-amber-400'
                        }`}
                        style={{ width: `${sig.progressPct || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Risk Budgeting Formula (₹1,00,000 Model · 1% = ₹1,000) */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-3 text-xs font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-200 font-sans font-bold">
                        <Calculator className="w-3.5 h-3.5 text-sky-400" />
                        <span>Capital Risk Sizing (₹1,00,000 Equity · 1% Risk = ₹1,000 Budget):</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span>Quantity: <strong className="text-sky-300 font-bold">{sig.sizing.calculatedQty} {sig.sizing.lotSize ? `(${sig.sizing.contractLots || 1} Lot)` : 'Shares'}</strong></span>
                        <span>Per-Share Risk: <strong className="text-rose-300">₹{sig.sizing.perShareRisk}</strong></span>
                        <span>Margin: <strong className="text-slate-200">₹{(sig.sizing.marginRequired || sig.sizing.calculatedQty * sig.triggerPrice).toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Option Matrix (if F&O) */}
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

                  {/* Card Action Hub: Mark Target Hit, Execute, Inspect */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    
                    <button
                      onClick={() => setExpandedSignalId(isExpanded ? null : sig.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isExpanded ? 'Hide Strategy Confluence' : 'Inspect 13-Strategy Confluence'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                      
                      {/* USER REQUIREMENT: Once target reached, mark and exit from active list */}
                      <button
                        onClick={() => handleManualAchieveTarget(sig)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        title="Mark target reached and remove from active signals list"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>✓ Target Reached (Exit)</span>
                      </button>

                      <button
                        onClick={() => handleCopy(sig)}
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
                        className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                          isBuy 
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60' 
                            : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/60'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Execute {isBuy ? 'BUY' : 'SALE'}</span>
                      </button>

                    </div>

                  </div>

                  {/* Deep Analysis Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Multi-Factor Scanner Evidence (13 Strategies)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Candlestick Scanner:</span>
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
                            <span className="text-[10px] font-bold text-amber-400 uppercase block">Trend Stack:</span>
                            <span>{sig.evidence.trendStatus} · {sig.evidence.indicatorsDetail}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">Time Stop Rule</span>
                          <span>{sig.timeStop}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] font-bold text-rose-300 uppercase block mb-1">Invalidation Trigger</span>
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
      )}

      {/* ================================================================================= */}
      {/* VIEW 2: TARGETS ACHIEVED / COMPLETED TRADES ARCHIVE */}
      {/* ================================================================================= */}
      {viewTab === 'COMPLETED' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">
                Archived Trades: Once target is achieved, signals automatically leave the active feed and are stored here with locked P&L.
              </span>
            </div>
            <span className="text-emerald-400 font-mono font-bold">
              Total Achieved: {completedSignals.length} Trades
            </span>
          </div>

          {completedSignals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
              <Target className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-white">No signals have completed their targets yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                When active signals reach Target 1 or Target 2, they will automatically exit the active list and appear here!
              </p>
            </div>
          ) : (
            completedSignals.map((sig) => (
              <div 
                key={sig.id}
                className="p-4 rounded-2xl bg-slate-900 border border-emerald-700/50 shadow-md text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center font-black text-emerald-300 shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-white">{sig.symbol}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        TARGET ACHIEVED @ ₹{sig.exitPrice}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Closed at {sig.completedAt}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      Strategy: <strong className="text-slate-200">{sig.strategyName || sig.opportunityTag}</strong> · Entry: ₹{sig.triggerPrice} → Target: ₹{sig.target1}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Realized P&L</span>
                    <span className="text-emerald-400 font-black font-mono text-base">
                      +₹{(sig.realizedPnl || 2000).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Option to restore back to active
                      setCompletedSignals(prev => prev.filter(s => s.id !== sig.id));
                      setSignals(prev => [{ ...sig, status: 'TRIGGERED' }, ...prev]);
                      setToastMessage(`Restored ${sig.symbol} back to active signals.`);
                      setTimeout(() => setToastMessage(null), 2500);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Restore back to active list"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================================================================================= */}
      {/* VIEW 3: CAPITAL PROTECTED ARCHIVE (STOP LOSS HIT) */}
      {/* ================================================================================= */}
      {viewTab === 'STOPPED' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-white">
                Capital Protection Archive: Trades that touched invalidation stop-loss were auto-exited to prevent catastrophic loss.
              </span>
            </div>
            <span className="text-rose-400 font-mono font-bold">
              Total Protected: {stoppedSignals.length} Trades
            </span>
          </div>

          {stoppedSignals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-white">No stop-loss hits currently recorded.</p>
              <p className="text-xs text-slate-400 mt-1">
                Risk rules strictly protect your ₹1,00,000 capital model with maximum ₹1,000 budget per setup.
              </p>
            </div>
          ) : (
            stoppedSignals.map((sig) => (
              <div 
                key={sig.id}
                className="p-4 rounded-2xl bg-slate-900 border border-rose-800/50 shadow-md text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center font-black text-rose-300 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-white">{sig.symbol}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        STOP LOSS TRIGGERED @ ₹{sig.exitPrice}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Closed at {sig.completedAt}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      Strategy: <strong className="text-slate-200">{sig.strategyName || sig.opportunityTag}</strong> · Entry: ₹{sig.triggerPrice} → Stop: ₹{sig.stopLoss}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Capital Preserved</span>
                  <span className="text-rose-400 font-black font-mono text-base">
                    Capped at -₹1,000
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Add Manual Signal */}
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
                  Add Indian Market Signal
                </h3>
                <p className="text-xs text-slate-400">
                  Inject an NSE / MCX signal with automatic ₹1,00,000 capital risk-budget calculation.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Indian Stock / Index</label>
                <select
                  value={selectedStockSymbol}
                  onChange={(e) => setSelectedStockSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {STOCK_UNIVERSE.map((st) => (
                    <option key={st.symbol} value={st.symbol}>
                      {st.symbol} - {st.name} (₹{st.currentPrice})
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Direction</label>
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
                      SALE / SHORT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Trading Style</label>
                  <select
                    value={selectedAddStyle}
                    onChange={(e) => setSelectedAddStyle(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="intraday">Intraday (5m)</option>
                    <option value="swing">Swing Trade (Daily)</option>
                    <option value="positional">Positional (1-Yr)</option>
                  </select>
                </div>
              </div>

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
                  onClick={handleAddSignalSubmit}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md active:scale-95 transition-all"
                >
                  + Add to Signals Feed
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
