import React, { useState, useMemo } from 'react';
import { 
  ConfluenceStockResult, 
  TradingStyle, 
  StockInfo, 
  StrategyDefinition 
} from '../types/trading';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  Filter, 
  Sliders, 
  ExternalLink, 
  Play, 
  Info,
  Search,
  Layers,
  Sparkles
} from 'lucide-react';

interface ConfluenceBuyScreenerProps {
  confluenceResults: ConfluenceStockResult[];
  selectedStyle: TradingStyle;
  onStyleChange: (style: TradingStyle) => void;
  onExecuteConfluenceBuy: (stock: ConfluenceStockResult) => void;
  onOpenTerminal: (symbol: string, strategyId: string) => void;
}

export const ConfluenceBuyScreener: React.FC<ConfluenceBuyScreenerProps> = ({
  confluenceResults,
  selectedStyle,
  onStyleChange,
  onExecuteConfluenceBuy,
  onOpenTerminal,
}) => {
  // Threshold state: default 8+ out of 13, with presets
  const [minSatisfied, setMinSatisfied] = useState<number>(8);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [expandedStockSymbol, setExpandedStockSymbol] = useState<string | null>(null);

  // Available sectors
  const sectors = useMemo(() => {
    const set = new Set(confluenceResults.map((r) => r.stock.sector));
    return ['ALL', ...Array.from(set)];
  }, [confluenceResults]);

  // Filtered and sorted confluence candidates
  const filteredResults = useMemo(() => {
    return confluenceResults
      .filter((res) => {
        const matchesThreshold = res.satisfiedCount >= minSatisfied;
        const matchesSector = selectedSector === 'ALL' || res.stock.sector === selectedSector;
        const matchesSearch =
          res.stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          res.stock.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesThreshold && matchesSector && matchesSearch;
      })
      .sort((a, b) => {
        // Highest satisfied count first, then by combined win rate
        if (b.satisfiedCount !== a.satisfiedCount) {
          return b.satisfiedCount - a.satisfiedCount;
        }
        return b.avgWinRate - a.avgWinRate;
      });
  }, [confluenceResults, minSatisfied, selectedSector, searchQuery]);

  // Max satisfied count across universe
  const highestSatisfied = Math.max(...confluenceResults.map((r) => r.satisfiedCount), 0);
  const topCandidate = filteredResults[0] || confluenceResults[0];

  const avgWinRateAll = filteredResults.length > 0
    ? (filteredResults.reduce((acc, r) => acc + r.avgWinRate, 0) / filteredResults.length).toFixed(1)
    : '0';

  const avgProfitFactorAll = filteredResults.length > 0
    ? (filteredResults.reduce((acc, r) => acc + r.avgProfitFactor, 0) / filteredResults.length).toFixed(2)
    : '1.0';

  const toggleExpand = (symbol: string) => {
    setExpandedStockSymbol((prev) => (prev === symbol ? null : symbol));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Mode Description */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Multi-Strategy Confluence Engine
              </span>
              <span className="text-slate-500 text-xs">·</span>
              <span className="text-xs text-indigo-300 font-mono">
                13 Quantitative Trading Systems
              </span>
            </div>
            
            <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">
              13-Strategy Universal Confluence Buy Screener
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Eliminate false breakouts and whipsaws by screening for equities where multiple algorithmic strategies simultaneously certify a <strong className="text-emerald-400">BUY signal</strong> across Trend Following, Breakout, Reversal, Volume, Relative Strength, and Options Chain models.
            </p>
          </div>

          {/* Timeframe Style Selector */}
          <div className="flex items-center gap-2 shrink-0 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 self-start lg:self-center">
            <span className="text-xs text-slate-400 pl-2 font-medium">Timeframe:</span>
            {(['intraday', 'swing', 'positional'] as TradingStyle[]).map((st) => (
              <button
                key={st}
                onClick={() => onStyleChange(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  selectedStyle === st
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st} <span className="font-mono text-[10px] opacity-75">({st === 'intraday' ? '5m' : st === 'swing' ? 'Daily' : 'Macro'})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Qualified Candidates */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Universal Buy Candidates</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {filteredResults.length} <span className="text-sm font-sans text-slate-400 font-normal">of {confluenceResults.length} stocks</span>
            </span>
            <span className="text-[11px] font-mono text-indigo-400 font-semibold">
              $\ge${minSatisfied}/13 Satisfied
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Universe Peak Confluence:</span>
            <strong className="text-white font-mono">{highestSatisfied} / 13 Strategies</strong>
          </div>
        </div>

        {/* Card 2: Top Confluence Stock */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Highest Confluence Asset</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-white">
                {topCandidate ? topCandidate.stock.symbol : '---'}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                ${topCandidate ? topCandidate.stock.currentPrice : 0}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              {topCandidate ? topCandidate.satisfiedCount : 0}/13 BUY
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Grade: <strong className="text-emerald-400 font-mono font-bold">{topCandidate?.grade || 'AAA'}</strong></span>
            <span>Win Rate: <strong className="text-white font-mono">{topCandidate?.avgWinRate || 0}%</strong></span>
          </div>
        </div>

        {/* Card 3: Average Confluence Win Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Combined Average Win Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-indigo-300">
              {avgWinRateAll}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Aggregate Profit Factor:</span>
            <strong className="text-emerald-400 font-mono">{avgProfitFactorAll}</strong>
          </div>
        </div>

        {/* Card 4: Capital Protection */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Risk-to-Reward Confluence</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-sky-400">
              1:2.6 Avg
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Tight Multi-System SL</span>
            <span className="text-slate-300 font-mono">Dynamic ATR Guard</span>
          </div>
        </div>

      </div>

      {/* Filter and Confluence Threshold Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-xl">
        
        {/* Preset Threshold Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">Confluence Criteria:</span>
          
          <button
            onClick={() => setMinSatisfied(13)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              minSatisfied === 13
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            All 13 / 13 (100% Strict)
          </button>

          <button
            onClick={() => setMinSatisfied(10)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              minSatisfied === 10
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            $\ge$ 10 of 13 (Ultra High)
          </button>

          <button
            onClick={() => setMinSatisfied(8)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              minSatisfied === 8
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            $\ge$ 8 of 13 (Strong)
          </button>

          <button
            onClick={() => setMinSatisfied(5)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              minSatisfied === 5
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            $\ge$ 5 of 13 (Broad)
          </button>
        </div>

        {/* Threshold Slider & Search */}
        <div className="flex items-center gap-4">
          
          {/* Custom Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
              Min: <strong className="text-emerald-400">{minSatisfied}</strong>/13
            </span>
            <input
              type="range"
              min="1"
              max="13"
              value={minSatisfied}
              onChange={(e) => setMinSatisfied(parseInt(e.target.value))}
              className="w-24 accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-36 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

        </div>

      </div>

      {/* Main Confluence Stocks List */}
      {filteredResults.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              No Stocks Currently Satisfy {minSatisfied} of 13 Strategies
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              In the current {selectedStyle} candle session, the maximum satisfied strategy count is <strong className="text-emerald-400 font-mono">{highestSatisfied} of 13</strong>.
            </p>
          </div>
          <button
            onClick={() => setMinSatisfied(Math.max(1, highestSatisfied))}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Show Candidates with {highestSatisfied}+ Satisfied Strategies
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result) => {
            const isExpanded = expandedStockSymbol === result.stock.symbol;
            const is100Pct = result.satisfiedCount === 13;

            return (
              <div
                key={result.stock.symbol}
                className={`bg-slate-900/90 border transition-all rounded-2xl overflow-hidden shadow-xl ${
                  is100Pct
                    ? 'border-emerald-500/70 ring-1 ring-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Stock Symbol, Name, Sector & Grade */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center font-mono shrink-0 shadow-inner">
                      <span className="font-extrabold text-sm text-white">{result.stock.symbol}</span>
                      <span className="text-[9px] text-slate-400">{result.stock.beta}β</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {result.stock.name}
                        </h3>
                        
                        {/* Confluence Grade Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                          result.grade === 'AAA'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : result.grade === 'AA'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                            : 'bg-sky-950 text-sky-300 border border-sky-700'
                        }`}>
                          GRADE {result.grade}
                        </span>

                        {is100Pct && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 font-sans">
                            100% UNANIMOUS BUY
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                        <span>{result.stock.sector}</span>
                        <span>·</span>
                        <span className="font-mono text-white font-semibold">
                          ${result.stock.currentPrice.toFixed(2)}
                        </span>
                        <span className={`font-mono text-[11px] ${
                          result.stock.changeDayPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {result.stock.changeDayPct >= 0 ? '+' : ''}{result.stock.changeDayPct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Confluence Score & Trade Parameters */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    
                    {/* Score Bar */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                        Confluence Score
                      </span>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xl font-mono font-extrabold text-emerald-400">
                          {result.satisfiedCount} <span className="text-xs text-slate-400 font-normal">/ {result.totalStrategies}</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          ({result.satisfactionPct}%)
                        </span>
                      </div>
                    </div>

                    {/* Win Rate & Profit Factor */}
                    <div className="text-right border-l border-slate-800 pl-4 hidden sm:block">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                        Avg Strategy Edge
                      </span>
                      <div className="text-xs font-mono">
                        <span className="text-white font-bold">{result.avgWinRate}%</span> WR · <span className="text-indigo-300 font-bold">{result.avgProfitFactor}</span> PF
                      </div>
                    </div>

                    {/* Trade Levels (Entry / Stop Loss / Target) */}
                    <div className="text-right border-l border-slate-800 pl-4 hidden md:block">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                        Recommended Setup
                      </span>
                      <div className="text-xs font-mono">
                        <span className="text-slate-300">SL: <strong className="text-rose-400">${result.recommendedStopLoss}</strong></span> · <span className="text-slate-300">TGT: <strong className="text-emerald-400">${result.target1}</strong></span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onExecuteConfluenceBuy(result)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Execute Buy
                      </button>

                      <button
                        onClick={() => onOpenTerminal(result.stock.symbol, 'strat_dual_ema')}
                        title="Inspect on Candlestick Chart"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleExpand(result.stock.symbol)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors flex items-center gap-1"
                        title="View strategy satisfaction breakdown"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>

                </div>

                {/* 13-Strategy Checklist Visual Grid */}
                <div className="px-5 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/40">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>13 Strategies Satisfaction Matrix:</span>
                    <span className="text-emerald-400 font-mono">
                      {result.satisfiedCount} Satisfied (BUY) · {result.totalStrategies - result.satisfiedCount} Pending/Neutral
                    </span>
                  </div>

                  {/* Badges for all 13 strategies */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {result.satisfiedStrategies.map((item) => {
                      const isSat = item.isSatisfied;
                      return (
                        <div
                          key={item.strategy.id}
                          className={`p-2 rounded-lg border text-[11px] flex flex-col justify-between transition-all ${
                            isSat
                              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                              : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold truncate text-[10px]">
                              {item.strategy.name.split(' ').slice(0, 2).join(' ')}
                            </span>
                            {isSat ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">—</span>
                            )}
                          </div>
                          <span className={`text-[9px] mt-1 truncate ${isSat ? 'text-emerald-400 font-mono' : 'text-slate-500'}`}>
                            {isSat ? 'BUY TRIGGER' : 'NEUTRAL'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expandable Accordion: Strategy-by-Strategy Mathematical Proofs */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800 bg-slate-950/90 text-xs space-y-3 animate-in fade-in duration-150">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Detailed Algorithmic Verification Report ({result.stock.symbol})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {result.satisfiedStrategies.map((item) => (
                        <div
                          key={item.strategy.id}
                          className={`p-3 rounded-lg border ${
                            item.isSatisfied
                              ? 'bg-emerald-950/20 border-emerald-900/50'
                              : 'bg-slate-900/30 border-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 text-xs">
                              {item.strategy.name}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              item.isSatisfied
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {item.isSatisfied ? 'SATISFIED (BUY)' : 'NOT SATISFIED'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {item.isSatisfied ? item.rationale : `Waiting for confirmation: ${item.strategy.entryRule}`}
                          </p>

                          {item.isSatisfied && (
                            <div className="mt-2 pt-2 border-t border-emerald-900/40 text-[10px] font-mono text-slate-300 flex items-center justify-between">
                              <span>Entry: ${item.entryPrice.toFixed(2)}</span>
                              <span>SL: ${item.stopLossPrice.toFixed(2)}</span>
                              <span className="text-emerald-400">Target: ${item.targetPrice.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onExecuteConfluenceBuy(result)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                      >
                        Submit Verified Paper Buy Order
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
