import React, { useState, useMemo } from 'react';
import { ScannerSignal, TradingStyle, StrategyCategory } from '../types/trading';
import { 
  Radar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Search, 
  ShieldCheck, 
  CheckCircle,
  Play
} from 'lucide-react';

interface SignalScannerProps {
  signals: ScannerSignal[];
  selectedStyle: TradingStyle;
  onStyleChange: (style: TradingStyle) => void;
  onExecuteSignal: (signal: ScannerSignal) => void;
  onOpenTerminal: (symbol: string, strategyId: string) => void;
}

export const SignalScanner: React.FC<SignalScannerProps> = ({
  signals,
  selectedStyle,
  onStyleChange,
  onExecuteSignal,
  onOpenTerminal,
}) => {
  const [filterAction, setFilterAction] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(signals.map((s) => s.category));
    return ['ALL', ...Array.from(set)];
  }, [signals]);

  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      const matchesAction = filterAction === 'ALL' || s.signal === filterAction;
      const matchesCategory = filterCategory === 'ALL' || s.category === filterCategory;
      const matchesSearch =
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.stockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.strategyName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesAction && matchesCategory && matchesSearch;
    });
  }, [signals, filterAction, filterCategory, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Scanner Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Radar className="w-4 h-4 text-sky-400" />
            Live Quantitative Signal Screener
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time algorithmic triggers across 13 strategies and 3 execution styles
          </p>
        </div>

        {/* Style Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Timeframe Style:</span>
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            {(['intraday', 'swing', 'positional'] as TradingStyle[]).map((st) => (
              <button
                key={st}
                onClick={() => onStyleChange(st)}
                className={`px-3 py-1 rounded capitalize font-medium transition-all ${
                  selectedStyle === st ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search signals by stock, strategy..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Action Toggle (BUY / SELL) */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Direction:</span>
          <div className="flex items-center bg-slate-950 rounded p-0.5 border border-slate-800">
            {(['ALL', 'BUY', 'SELL'] as const).map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  filterAction === act
                    ? act === 'BUY'
                      ? 'bg-emerald-600 text-white'
                      : act === 'SELL'
                      ? 'bg-rose-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : 'text-slate-400'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Signals Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-slate-950 font-semibold tracking-wider">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-3">Direction</th>
                <th className="py-3 px-3">Strategy</th>
                <th className="py-3 px-3 text-right">Trigger Price</th>
                <th className="py-3 px-3 text-right">Stop Loss</th>
                <th className="py-3 px-3 text-right">Target Price</th>
                <th className="py-3 px-3 text-right">Risk/Reward</th>
                <th className="py-3 px-4">Rationale Setup</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredSignals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    No active signals matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredSignals.map((sig) => {
                  const isBuy = sig.signal === 'BUY';
                  return (
                    <tr
                      key={sig.id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Asset */}
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-bold text-white text-xs font-mono">
                            {sig.symbol}
                          </span>
                          <div className="text-[10px] text-slate-400 font-sans truncate max-w-[120px]">
                            {sig.stockName}
                          </div>
                        </div>
                      </td>

                      {/* Direction */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                          isBuy
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                        }`}>
                          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {sig.signal}
                        </span>
                      </td>

                      {/* Strategy */}
                      <td className="py-3 px-3 font-sans">
                        <span className="text-indigo-300 font-semibold text-xs block truncate max-w-[180px]">
                          {sig.strategyName}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {sig.style} style
                        </span>
                      </td>

                      {/* Trigger Price */}
                      <td className="py-3 px-3 text-right font-bold text-white text-xs">
                        ${sig.price.toFixed(2)}
                      </td>

                      {/* Stop Loss */}
                      <td className="py-3 px-3 text-right text-rose-400">
                        ${sig.stopLoss.toFixed(2)}
                      </td>

                      {/* Target */}
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                        ${sig.targetPrice.toFixed(2)}
                      </td>

                      {/* Risk:Reward */}
                      <td className="py-3 px-3 text-right text-purple-300 font-semibold">
                        1:{sig.riskRewardRatio.toFixed(1)}
                      </td>

                      {/* Rationale */}
                      <td className="py-3 px-4 font-sans text-slate-300 text-[11px] max-w-[240px]">
                        <p className="truncate" title={sig.rationale}>
                          {sig.rationale}
                        </p>
                      </td>

                      {/* Execute & Inspect Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onExecuteSignal(sig)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            Execute
                          </button>
                          <button
                            onClick={() => onOpenTerminal(sig.symbol, sig.strategyId)}
                            className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded font-sans text-[11px] transition-colors"
                          >
                            Chart
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
