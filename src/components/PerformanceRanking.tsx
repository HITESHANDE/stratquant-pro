import React, { useState, useMemo } from 'react';
import { StockRankingRow, TradingStyle, StrategyDefinition } from '../types/trading';
import { 
  ArrowUpDown, 
  Search, 
  Filter, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Coins,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface PerformanceRankingProps {
  rankings: StockRankingRow[];
  selectedStyle: TradingStyle;
  selectedStrategyId: string;
  setSelectedStrategyId: (id: string) => void;
  strategies: StrategyDefinition[];
  onSelectStock: (symbol: string) => void;
  onOpenOptions: (symbol: string) => void;
}

type SortField = 'winRate' | 'netProfitPct' | 'profitFactor' | 'maxDrawdownPct' | 'cagrPct' | 'sharpeRatio' | 'totalTrades';

export const PerformanceRanking: React.FC<PerformanceRankingProps> = ({
  rankings,
  selectedStyle,
  selectedStrategyId,
  setSelectedStrategyId,
  strategies,
  onSelectStock,
  onOpenOptions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('netProfitPct');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Available sectors for filter
  const sectors = useMemo(() => {
    const list = Array.from(new Set(rankings.map((r) => r.stock.sector)));
    return ['ALL', ...list];
  }, [rankings]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // For drawdown, lower is better by default
      setSortAsc(field === 'maxDrawdownPct');
    }
  };

  // Filter and sort ranking rows
  const filteredAndSortedRankings = useMemo(() => {
    return rankings
      .filter((row) => {
        const matchesSearch =
          row.stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.stock.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = selectedSector === 'ALL' || row.stock.sector === selectedSector;
        return matchesSearch && matchesSector;
      })
      .sort((a, b) => {
        let valA = a.metrics[sortField];
        let valB = b.metrics[sortField];

        if (sortAsc) {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [rankings, searchQuery, selectedSector, sortField, sortAsc]);

  // Aggregate high-level stats
  const topPerformer = filteredAndSortedRankings[0];
  const avgWinRate = rankings.length > 0
    ? (rankings.reduce((acc, r) => acc + r.metrics.winRate, 0) / rankings.length).toFixed(1)
    : '0';
  const bestProfitFactor = Math.max(...rankings.map((r) => r.metrics.profitFactor || 1)).toFixed(2);
  const lowestDrawdown = Math.min(...rankings.map((r) => r.metrics.maxDrawdownPct || 100)).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Top Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Leader / Top Alpha</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold font-mono text-white">
                {topPerformer ? topPerformer.stock.symbol : '---'}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                {topPerformer ? topPerformer.stock.name : ''}
              </span>
            </div>
            <span className="text-emerald-400 font-mono font-bold text-sm">
              +{topPerformer ? topPerformer.metrics.netProfitPct : 0}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Win Rate: <strong className="text-slate-200 font-mono">{topPerformer ? topPerformer.metrics.winRate : 0}%</strong></span>
            <span>CAGR: <strong className="text-emerald-400 font-mono">+{topPerformer ? topPerformer.metrics.cagrPct : 0}%</strong></span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Universe Avg Win Rate</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-indigo-300">
              {avgWinRate}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Style: <strong className="text-slate-200 capitalize">{selectedStyle}</strong></span>
            <span>Universe: <strong className="text-slate-200">{rankings.length} Equities</strong></span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Peak Profit Factor</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {bestProfitFactor}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Risk-Adjusted Efficiency</span>
            <span className="text-slate-300 font-mono">Gross Gain / Loss</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Min Max Drawdown</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-sky-400">
              -{lowestDrawdown}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Capital Preservation</span>
            <span className="text-slate-300 font-mono">Trough Protection</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Sector Filter, Strategy Filter */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock ticker, name (e.g. NVDA, Apple)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Strategy Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Strategy:</span>
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Strategies (Best Per Stock)</option>
              {strategies.map((strat) => (
                <option key={strat.id} value={strat.id}>
                  {strat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec === 'ALL' ? 'All Sectors' : sec}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Stock-Wise Performance Ranking Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 bg-slate-950/60 uppercase tracking-wider">
                <th className="py-3.5 px-4">Rank / Stock</th>
                <th className="py-3.5 px-3">Sector</th>
                <th className="py-3.5 px-3 text-right">LTP</th>
                
                {/* Win Rate */}
                <th 
                  onClick={() => handleSort('winRate')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Win Rate</span>
                    <ArrowUpDown className="w-3 h-3 group-hover:text-indigo-400" />
                  </div>
                </th>

                {/* Net Profit */}
                <th 
                  onClick={() => handleSort('netProfitPct')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Net Profit (%)</span>
                    <ArrowUpDown className="w-3 h-3 group-hover:text-emerald-400" />
                  </div>
                </th>

                {/* Profit Factor */}
                <th 
                  onClick={() => handleSort('profitFactor')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Profit Factor</span>
                    <ArrowUpDown className="w-3 h-3 group-hover:text-indigo-400" />
                  </div>
                </th>

                {/* Maximum Drawdown */}
                <th 
                  onClick={() => handleSort('maxDrawdownPct')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Max Drawdown</span>
                    <ArrowUpDown className="w-3 h-3 group-hover:text-rose-400" />
                  </div>
                </th>

                {/* CAGR */}
                <th 
                  onClick={() => handleSort('cagrPct')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>CAGR (%)</span>
                    <ArrowUpDown className="w-3 h-3 group-hover:text-emerald-400" />
                  </div>
                </th>

                {/* Sharpe Ratio */}
                <th 
                  onClick={() => handleSort('sharpeRatio')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Sharpe</span>
                    <ArrowUpDown className="w-3 h-3 group-hover:text-indigo-400" />
                  </div>
                </th>

                {/* Total Trades */}
                <th 
                  onClick={() => handleSort('totalTrades')}
                  className="py-3.5 px-3 text-right cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Trades</span>
                    <ArrowUpDown className="w-3 h-3 group-hover:text-slate-200" />
                  </div>
                </th>

                <th className="py-3.5 px-3 text-center">Top Strategy</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {filteredAndSortedRankings.map((row, index) => {
                const isProfitable = row.metrics.netProfitPct >= 0;
                return (
                  <tr 
                    key={row.stock.symbol}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => onSelectStock(row.stock.symbol)}
                  >
                    {/* Symbol and Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-slate-500 w-5">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white font-mono flex items-center gap-1.5">
                            {row.stock.symbol}
                            <span className={`text-[10px] font-sans font-medium px-1.5 py-0.2 rounded ${
                              row.currentSignal === 'BUY'
                                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                                : row.currentSignal === 'SELL'
                                ? 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
                                : 'bg-slate-800/60 text-slate-400'
                            }`}>
                              {row.currentSignal}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {row.stock.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {row.stock.sector}
                    </td>

                    {/* Last Traded Price & Day Change */}
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="text-white font-semibold">
                        {row.stock.currencySymbol || '$'}{row.stock.currentPrice.toFixed(2)}
                      </div>
                      <div className={`text-[10px] flex items-center justify-end ${
                        row.stock.changeDayPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {row.stock.changeDayPct >= 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {row.stock.changeDayPct >= 0 ? '+' : ''}{row.stock.changeDayPct}%
                      </div>
                    </td>

                    {/* Win Rate with visual bar */}
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.metrics.winRate >= 60 ? 'bg-emerald-500' : row.metrics.winRate >= 50 ? 'bg-indigo-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, row.metrics.winRate)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-white">
                          {row.metrics.winRate}%
                        </span>
                      </div>
                    </td>

                    {/* Net Profit (%) */}
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span className={isProfitable ? 'text-emerald-400' : 'text-rose-400'}>
                        {isProfitable ? '+' : ''}{row.metrics.netProfitPct}%
                      </span>
                      <div className="text-[10px] text-slate-400">
                        ${row.metrics.netProfitUsd.toLocaleString()}
                      </div>
                    </td>

                    {/* Profit Factor */}
                    <td className="py-3 px-3 text-right font-mono">
                      <span className={`font-semibold ${
                        row.metrics.profitFactor >= 2.0 
                          ? 'text-emerald-400' 
                          : row.metrics.profitFactor >= 1.4 
                          ? 'text-indigo-300' 
                          : 'text-amber-400'
                      }`}>
                        {row.metrics.profitFactor}
                      </span>
                    </td>

                    {/* Maximum Drawdown */}
                    <td className="py-3 px-3 text-right font-mono text-rose-400 font-semibold">
                      -{row.metrics.maxDrawdownPct}%
                    </td>

                    {/* CAGR */}
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span className={row.metrics.cagrPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        +{row.metrics.cagrPct}%
                      </span>
                    </td>

                    {/* Sharpe Ratio */}
                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      {row.metrics.sharpeRatio}
                    </td>

                    {/* Total Trades */}
                    <td className="py-3 px-3 text-right font-mono text-slate-400">
                      {row.metrics.totalTrades}
                    </td>

                    {/* Top Strategy */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-[11px] text-indigo-300 font-medium bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded truncate max-w-[150px] inline-block">
                        {row.bestStrategyName}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectStock(row.stock.symbol)}
                          title="Open in Chart Terminal"
                          className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenOptions(row.stock.symbol)}
                          title="Analyze Options Chain & Max Pain"
                          className="p-1.5 rounded bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 transition-colors"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
