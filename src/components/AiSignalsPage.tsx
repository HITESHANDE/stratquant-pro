import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  RefreshCw, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal,
  Flame,
  TrendingUp,
  TrendingDown,
  Info,
  Activity
} from 'lucide-react';
import { NexusSignal, SignalAction, MarketSegment, TimeframeStyle } from '../types/nexus';

interface AiSignalsPageProps {
  signals: NexusSignal[];
  onSelectSignal: (signal: NexusSignal) => void;
  autoUpdate: boolean;
  onToggleAutoUpdate: () => void;
  onRefreshSignals: () => void;
  onOpenConnectionModal?: () => void;
}

type MarketFilter = 'ALL' | 'STOCKS' | 'OPTIONS' | 'CRUDE';
type ActionFilter = 'ALL' | 'BUY' | 'SELL' | 'WAIT';
type TimeframeFilter = 'ALL' | 'intraday' | 'swing' | 'positional';
type SortField = 'generationTime' | 'confidenceScore' | 'entryPrice' | 'riskRewardRatio';

export const AiSignalsPage: React.FC<AiSignalsPageProps> = ({
  signals,
  onSelectSignal,
  autoUpdate,
  onToggleAutoUpdate,
  onRefreshSignals,
  onOpenConnectionModal,
}) => {
  // Filter States
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('ALL');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('generationTime');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filtered & Sorted Signals
  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      // Market segment filter
      if (marketFilter === 'STOCKS' && sig.marketSegment !== 'NSE_STOCK') return false;
      if (marketFilter === 'OPTIONS' && sig.marketSegment !== 'INDEX_OPTION' && sig.marketSegment !== 'STOCK_OPTION') return false;
      if (marketFilter === 'CRUDE' && sig.marketSegment !== 'MCX_COMMODITY') return false;

      // Action filter (BUY / SELL / WAIT)
      if (actionFilter !== 'ALL' && sig.action !== actionFilter) return false;

      // Timeframe style filter (Intraday / Swing / Positional)
      if (timeframeFilter !== 'ALL' && sig.timeframeStyle !== timeframeFilter) return false;

      // Search query (symbol or instrument name)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchName = sig.instrumentName.toLowerCase().includes(q);
        const matchSymbol = sig.symbol.toLowerCase().includes(q);
        const matchStrategy = sig.strategyName.toLowerCase().includes(q);
        const matchId = sig.id.toLowerCase().includes(q);
        if (!matchName && !matchSymbol && !matchStrategy && !matchId) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'confidenceScore') {
        comparison = a.confidenceScore - b.confidenceScore;
      } else if (sortField === 'entryPrice') {
        comparison = a.entryPrice - b.entryPrice;
      } else if (sortField === 'riskRewardRatio') {
        comparison = parseFloat(a.riskRewardRatio.replace('1:', '')) - parseFloat(b.riskRewardRatio.replace('1:', ''));
      } else {
        // default time
        comparison = a.generationTime.localeCompare(b.generationTime);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [signals, marketFilter, actionFilter, timeframeFilter, searchQuery, sortField, sortAsc]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = signals.length;
    const buys = signals.filter((s) => s.action === 'BUY').length;
    const sells = signals.filter((s) => s.action === 'SELL').length;
    const waits = signals.filter((s) => s.action === 'WAIT').length;
    const active = signals.filter((s) => s.status === 'ACTIVE').length;
    return { total, buys, sells, waits, active };
  }, [signals]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner & Summary Row */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                AI Signals Terminal
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Unified Feed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              All real-time algorithmic signals across NSE Stocks, NIFTY & BANK NIFTY Options, Stock Options, and MCX Crude Oil in one institutional desk.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#070B14] border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Total: </span>
              <span className="font-bold text-white">{stats.total}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono">
              <span className="text-emerald-300">BUY: </span>
              <span className="font-bold text-emerald-400">{stats.buys}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs font-mono">
              <span className="text-rose-300">SELL: </span>
              <span className="font-bold text-rose-400">{stats.sells}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs font-mono">
              <span className="text-amber-300">WAIT: </span>
              <span className="font-bold text-amber-400">{stats.waits}</span>
            </div>

            {/* Auto Update Toggle & Refresh */}
            <div className="flex items-center gap-1.5 ml-auto">
              {onOpenConnectionModal && (
                <button
                  onClick={onOpenConnectionModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors shadow-sm"
                  title="Open Live Market Feed & Angel One SmartAPI connection"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Live Market Feed</span>
                </button>
              )}
              <button
                onClick={onToggleAutoUpdate}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  autoUpdate 
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40' 
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title="Toggle real-time streaming updates"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoUpdate ? 'animate-spin' : ''}`} />
                <span>Auto-Update {autoUpdate ? 'ON' : 'PAUSED'}</span>
              </button>
              <button
                onClick={onRefreshSignals}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Scan & refresh signals now"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row flex-wrap items-start md:items-center justify-between gap-3">
          
          {/* Market Segment Pills */}
          <div className="flex items-center gap-1 bg-[#070B14] p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
            <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase">Market:</span>
            <button
              onClick={() => setMarketFilter('ALL')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                marketFilter === 'ALL' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Markets
            </button>
            <button
              onClick={() => setMarketFilter('STOCKS')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                marketFilter === 'STOCKS' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Stocks
            </button>
            <button
              onClick={() => setMarketFilter('OPTIONS')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                marketFilter === 'OPTIONS' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Options
            </button>
            <button
              onClick={() => setMarketFilter('CRUDE')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                marketFilter === 'CRUDE' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Crude Oil
            </button>
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-1 bg-[#070B14] p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
            <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase">Action:</span>
            <button
              onClick={() => setActionFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                actionFilter === 'ALL' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActionFilter('BUY')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                actionFilter === 'BUY' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 hover:bg-emerald-950/40'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setActionFilter('SELL')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                actionFilter === 'SELL' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              SELL
            </button>
            <button
              onClick={() => setActionFilter('WAIT')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                actionFilter === 'WAIT' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400 hover:bg-amber-950/40'
              }`}
            >
              WAIT
            </button>
          </div>

          {/* Timeframe Style Filter */}
          <div className="flex items-center gap-1 bg-[#070B14] p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
            <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase">Style:</span>
            <button
              onClick={() => setTimeframeFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframeFilter === 'ALL' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTimeframeFilter('intraday')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframeFilter === 'intraday' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Intraday
            </button>
            <button
              onClick={() => setTimeframeFilter('swing')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframeFilter === 'swing' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Swing
            </button>
            <button
              onClick={() => setTimeframeFilter('positional')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                timeframeFilter === 'positional' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Positional
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol, instrument, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070B14] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

        </div>

      </div>

      {/* Main Unified AI Signals Table */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Table Header: Exactly the 15 requested columns */}
            <thead>
              <tr className="bg-[#070B14] border-b border-slate-800 text-[11px] font-semibold text-slate-400 tracking-wider">
                <th className="py-3 px-3">1. Signal ID</th>
                <th className="py-3 px-3">2. Instrument Name</th>
                <th className="py-3 px-3">3. Market Segment</th>
                <th className="py-3 px-3 text-center">4. BUY / SELL / WAIT</th>
                <th className="py-3 px-3 text-right">5. Entry Price</th>
                <th className="py-3 px-3 text-right">6. Stop Loss</th>
                <th className="py-3 px-3 text-right">7. Target 1</th>
                <th className="py-3 px-3 text-right">8. Target 2</th>
                <th className="py-3 px-3 text-right">9. Target 3</th>
                <th 
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  onClick={() => handleSort('riskRewardRatio')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>10. R:R</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-center cursor-pointer hover:text-white"
                  onClick={() => handleSort('confidenceScore')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>11. Conf %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">12. Strategy Name</th>
                <th className="py-3 px-3 text-center">13. Timeframe</th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('generationTime')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>14. Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">15. Status</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info className="w-6 h-6 text-slate-400" />
                      <p className="text-sm font-medium">No signals match the active filter criteria.</p>
                      <button 
                        onClick={() => {
                          setMarketFilter('ALL');
                          setActionFilter('ALL');
                          setTimeframeFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline mt-1"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSignals.map((sig) => {
                  const isBuy = sig.action === 'BUY';
                  const isSell = sig.action === 'SELL';
                  const isWait = sig.action === 'WAIT';

                  const actionBadge = isBuy
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black'
                    : isSell
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold';

                  const statusBadge = sig.status === 'ACTIVE'
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                    : sig.status === 'WAITING TRIGGER'
                    ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700';

                  return (
                    <tr
                      key={sig.id}
                      onClick={() => onSelectSignal(sig)}
                      className="hover:bg-indigo-950/20 cursor-pointer transition-colors group"
                      title="Click to view deep AI technical analysis & risk management calculations"
                    >
                      {/* 1. Signal ID */}
                      <td className="py-3 px-3 text-slate-400 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {sig.isNew && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                          )}
                          <span className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                            {sig.id}
                          </span>
                        </div>
                      </td>

                      {/* 2. Instrument Name */}
                      <td className="py-3 px-3 font-sans font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{sig.instrumentName}</span>
                        </div>
                      </td>

                      {/* 3. Market Segment */}
                      <td className="py-3 px-3 font-sans whitespace-nowrap text-slate-400">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {sig.segmentLabel}
                        </span>
                      </td>

                      {/* 4. BUY / SELL / WAIT */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-sans">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs tracking-wide uppercase ${actionBadge}`}>
                          {sig.action}
                        </span>
                      </td>

                      {/* 5. Entry Price */}
                      <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">
                        ₹{sig.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 6. Stop Loss */}
                      <td className="py-3 px-3 text-right font-semibold text-rose-400 whitespace-nowrap">
                        ₹{sig.stopLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 7. Target 1 */}
                      <td className="py-3 px-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                        ₹{sig.target1.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 8. Target 2 */}
                      <td className="py-3 px-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                        ₹{sig.target2.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 9. Target 3 */}
                      <td className="py-3 px-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                        ₹{sig.target3.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* 10. Risk/Reward Ratio */}
                      <td className="py-3 px-3 text-center font-bold text-indigo-300 whitespace-nowrap">
                        {sig.riskRewardRatio}
                      </td>

                      {/* 11. Confidence Score */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`font-bold ${
                          sig.confidenceScore >= 90 
                            ? 'text-emerald-400' 
                            : sig.confidenceScore >= 80 
                            ? 'text-indigo-400' 
                            : 'text-amber-400'
                        }`}>
                          {sig.confidenceScore}%
                        </span>
                      </td>

                      {/* 12. Strategy Name */}
                      <td className="py-3 px-3 font-sans text-slate-300 max-w-[200px] truncate" title={sig.strategyName}>
                        {sig.strategyName}
                      </td>

                      {/* 13. Timeframe */}
                      <td className="py-3 px-3 text-center font-sans text-slate-400 whitespace-nowrap">
                        <span className="capitalize">{sig.timeframeStyle}</span> ({sig.timeframe})
                      </td>

                      {/* 14. Signal Generation Time */}
                      <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                        {sig.generationTime}
                      </td>

                      {/* 15. Signal Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-sans">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusBadge}`}>
                          {sig.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Insight */}
        <div className="p-3 bg-[#070B14] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Click any signal row to open detailed AI rationale, indicator matrix, and ₹1,000 max risk position sizing.</span>
          </div>
          <span className="font-mono text-slate-400">
            Showing {filteredSignals.length} of {signals.length} total signals
          </span>
        </div>

      </div>

    </div>
  );
};
