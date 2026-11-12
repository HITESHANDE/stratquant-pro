import React, { useState } from 'react';
import { 
  History, 
  TrendingUp, 
  ShieldCheck, 
  BarChart2, 
  ArrowUpRight, 
  Percent, 
  DollarSign, 
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { BACKTEST_RESULTS } from '../data/nexusData';
import { BacktestResult } from '../types/nexus';

export const BacktestingPage: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const result: BacktestResult = BACKTEST_RESULTS[selectedSymbol] || BACKTEST_RESULTS['RELIANCE'];

  const symbols = ['RELIANCE', 'NIFTY', 'CRUDEOIL'];

  // Rankings table
  const rankings = [
    { rank: 1, symbol: 'NIFTY', strategy: 'Options Max Pain & PCR Gamma Scalper', winRate: 76.8, pf: 2.62, dd: 5.8, trades: 112, netPnl: '₹2,42,000' },
    { rank: 2, symbol: 'RELIANCE', strategy: 'Dual EMA 20/50 Golden Trend', winRate: 71.4, pf: 2.38, dd: 7.2, trades: 68, netPnl: '₹1,84,500' },
    { rank: 3, symbol: 'CRUDEOIL', strategy: 'Donchian 20-Period High Breakout', winRate: 65.2, pf: 2.14, dd: 8.5, trades: 54, netPnl: '₹1,56,000' },
    { rank: 4, symbol: 'HDFCBANK', strategy: 'Institutional VWAP Anchor & Accumulation', winRate: 69.5, pf: 2.24, dd: 6.4, trades: 62, netPnl: '₹1,48,200' },
    { rank: 5, symbol: 'TATAMOTORS', strategy: 'Supertrend Trailing & Volume Expansion', winRate: 66.8, pf: 2.18, dd: 9.1, trades: 74, netPnl: '₹1,32,000' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              1-Year Algorithmic Backtester
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical simulation with realistic bar-by-bar execution, strict slippage deductions, and zero look-ahead bias.
          </p>
        </div>

        {/* Instrument Switcher */}
        <div className="flex items-center gap-2 bg-[#070B14] p-1.5 rounded-lg border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase">Asset:</span>
          {symbols.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                selectedSymbol === sym ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Win Rate */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <span className="text-[11px] text-emerald-300 uppercase font-medium">Win Rate</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {result.winRatePct}%
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            {result.winningTrades}W / {result.losingTrades}L
          </span>
        </div>

        {/* Profit Factor */}
        <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
          <span className="text-[11px] text-indigo-300 uppercase font-medium">Profit Factor</span>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">
            {result.profitFactor}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Gross Win / Gross Loss</span>
        </div>

        {/* Max Drawdown */}
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
          <span className="text-[11px] text-rose-300 uppercase font-medium">Max Drawdown</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            -{result.maxDrawdownPct}%
          </div>
          <span className="text-[10px] text-rose-300/80 font-mono">Peak to Valley</span>
        </div>

        {/* Total Trades */}
        <div className="p-3.5 rounded-xl bg-[#0B1222] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Total Trades</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {result.totalTrades}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">12-Month Period</span>
        </div>

        {/* Avg Reward / Risk */}
        <div className="p-3.5 rounded-xl bg-[#0B1222] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Avg Reward/Risk</span>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
            {result.avgRewardRisk}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Realized Ratio</span>
        </div>

        {/* Net Profit (After Brokerage) */}
        <div className="p-3.5 rounded-xl bg-[#0B1222] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Net Profit (Post Slippage)</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ₹{result.netProfit.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            -₹{result.brokerageSlippage.toLocaleString('en-IN')} fees
          </span>
        </div>

      </div>

      {/* 1-Year Equity Curve Visualization */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>1-Year Cumulative Equity Curve (₹1,00,000 Base)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Strategy: <strong className="text-indigo-400">{result.strategyName}</strong> ({result.timeframe})
            </p>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-slate-400">Ending Capital: </span>
            <span className="font-bold text-emerald-400">₹{result.equityCurve[result.equityCurve.length - 1].equity.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Interactive Equity Curve Chart Display */}
        <div className="h-48 w-full bg-[#070B14] border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-end justify-between h-36 gap-2 pt-4 px-2">
            {result.equityCurve.map((point, idx) => {
              const minVal = 100000;
              const maxVal = 260000;
              const heightPct = Math.max(15, Math.min(100, ((point.equity - minVal) / (maxVal - minVal)) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-indigo-300 font-bold">
                    ₹{(point.equity / 1000).toFixed(0)}k
                  </div>
                  <div 
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[40px] bg-gradient-to-t from-indigo-700 via-indigo-500 to-emerald-400 rounded-t-sm shadow-md transition-all group-hover:brightness-125"
                  />
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {point.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock-Wise Strategy Ranking Table */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-[#070B14] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">
              Stock-Wise Strategy Performance Ranking
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">1-Year Institutional Audit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0B1222] border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Instrument</th>
                <th className="py-3 px-3 font-sans">Best Performing Strategy</th>
                <th className="py-3 px-3 text-right">Win Rate</th>
                <th className="py-3 px-3 text-right">Profit Factor</th>
                <th className="py-3 px-3 text-right">Max Drawdown</th>
                <th className="py-3 px-3 text-right">Trades</th>
                <th className="py-3 px-3 text-right font-bold text-white">Net PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankings.map((r) => (
                <tr key={r.rank} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-3">
                    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                      r.rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300'
                    }`}>
                      #{r.rank}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans font-bold text-white">{r.symbol}</td>
                  <td className="py-3 px-3 font-sans text-slate-300">{r.strategy}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">{r.winRate}%</td>
                  <td className="py-3 px-3 text-right text-indigo-300">{r.pf}</td>
                  <td className="py-3 px-3 text-right text-rose-400">-{r.dd}%</td>
                  <td className="py-3 px-3 text-right text-slate-400">{r.trades}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">{r.netPnl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
