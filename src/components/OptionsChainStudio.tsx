import React, { useState } from 'react';
import { OptionsChainData, StockInfo } from '../types/trading';
import { 
  Coins, 
  Target, 
  Gauge, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  ArrowRight,
  Info
} from 'lucide-react';

interface OptionsChainStudioProps {
  optionsData: OptionsChainData;
  stock: StockInfo;
  allStocks: StockInfo[];
  onSelectStock: (symbol: string) => void;
  onTradeSignal: (strategyId: string) => void;
}

export const OptionsChainStudio: React.FC<OptionsChainStudioProps> = ({
  optionsData,
  stock,
  allStocks,
  onSelectStock,
  onTradeSignal,
}) => {
  const [selectedExpiry, setSelectedExpiry] = useState<string>(optionsData.expiryDate);
  const [filterType, setFilterType] = useState<'all' | 'near_atm'>('near_atm');

  const spot = optionsData.spotPrice;
  const maxPain = optionsData.maxPainStrike;
  const pcr = optionsData.putCallRatio;
  const curr = stock.currencySymbol || '$';

  // Sentiment interpretation based on PCR
  const getPcrSentiment = (ratio: number) => {
    if (ratio >= 1.35) {
      return {
        label: 'Extremely Bullish (Contrarian Cap Reversal)',
        desc: 'Heavy Put OI suggests retail is excessively hedged; high probability of short squeeze / upward pinning.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/60 border-emerald-800/60',
      };
    } else if (ratio >= 1.05) {
      return {
        label: 'Moderately Bullish',
        desc: 'Put accumulation outpaces calls; market makers incentivized to support current strike floor.',
        color: 'text-emerald-300',
        bg: 'bg-emerald-950/40 border-emerald-900/40',
      };
    } else if (ratio >= 0.85) {
      return {
        label: 'Neutral / Balanced',
        desc: 'Option volume in equilibrium; price will track technical moving averages without gamma squeeze.',
        color: 'text-slate-300',
        bg: 'bg-slate-900 border-slate-800',
      };
    } else if (ratio >= 0.65) {
      return {
        label: 'Moderately Bearish',
        desc: 'Call volume dominant; market makers short underlying to hedge positive call delta.',
        color: 'text-rose-300',
        bg: 'bg-rose-950/40 border-rose-900/40',
      };
    } else {
      return {
        label: 'Extremely Bearish (Excessive Euphoria)',
        desc: 'Extreme retail call buying; high vulnerability to sudden long liquidation / volatility crush.',
        color: 'text-rose-400',
        bg: 'bg-rose-950/60 border-rose-800/60',
      };
    }
  };

  const sentiment = getPcrSentiment(pcr);

  // Filter strikes
  const displayedStrikes = filterType === 'near_atm'
    ? optionsData.strikes.slice(3, 14)
    : optionsData.strikes;

  // Max Loss for normalisation of Max Pain chart
  const maxLoss = Math.max(...optionsData.strikes.map((s) => s.totalLossAtStrike || 1));

  const distanceToMaxPain = maxPain - spot;
  const distancePct = ((distanceToMaxPain / spot) * 100).toFixed(2);
  const isPullUp = distanceToMaxPain > 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Asset selector & Expiry cycle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Stock:</span>
            <select
              value={stock.symbol}
              onChange={(e) => onSelectStock(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {allStocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} · ${s.currentPrice}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Expiry Cycle:</span>
            <span className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg font-mono">
              {optionsData.expiryDate} ({optionsData.daysToExpiry} DTE)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter:</span>
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType('near_atm')}
                className={`px-2 py-1 rounded ${filterType === 'near_atm' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Near ATM (±5%)
              </button>
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                Full Chain
              </button>
            </div>
          </div>
        </div>

        {/* Spot Price Card */}
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Spot Price</span>
            <div className="font-mono font-bold text-white text-base">
              {curr}{spot.toFixed(2)}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Max Pain Strike</span>
            <div className="font-mono font-bold text-purple-400 text-base">
              {curr}{maxPain.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Key Metrics Cards: Max Pain, PCR Gauge, Gamma Walls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Max Pain Gravitation Analysis */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              Max Pain Gravitation
            </span>
            <span className="font-mono text-purple-400">${maxPain}</span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">Gravitational Pull:</span>
              <span className={`text-sm font-mono font-bold ${isPullUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPullUp ? 'Bullish Drift (Up +' : 'Bearish Drift (Down '}{distancePct}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Option sellers maximize profit when {stock.symbol} expires near <strong className="text-white">${maxPain}</strong>. Spot is currently {Math.abs(distanceToMaxPain).toFixed(2)} pts away.
            </p>

            <button
              onClick={() => onTradeSignal('strat_options_max_pain')}
              className="w-full mt-2 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              Simulate Max Pain Pinning Trade
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Put-Call Ratio (PCR) Meter */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              Put-Call Ratio (PCR)
            </span>
            <span className="font-mono font-bold text-white text-sm">{pcr}</span>
          </div>

          <div className="mt-3 space-y-2">
            {/* Visual PCR Spectrum Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex">
              <div className="bg-rose-500 h-full w-1/4" title="Extremely Bearish" />
              <div className="bg-amber-500 h-full w-1/4" title="Bearish / Neutral" />
              <div className="bg-sky-500 h-full w-1/4" title="Neutral / Bullish" />
              <div className="bg-emerald-500 h-full w-1/4" title="Extremely Bullish" />
            </div>

            <div className={`p-2 rounded border text-xs ${sentiment.bg}`}>
              <div className={`font-semibold ${sentiment.color}`}>
                {sentiment.label}
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                {sentiment.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Gamma Walls (Major Call & Put OI Concentration) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Market Maker Gamma Walls
            </span>
            <span className="text-[10px] text-slate-500 font-mono">OPEX Levels</span>
          </div>

          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Call OI Wall (Resistance):</span>
              <span className="font-mono font-bold text-rose-400">
                ${optionsData.highestCallOIStrike} (Heavy Selling)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Put OI Wall (Support):</span>
              <span className="font-mono font-bold text-emerald-400">
                ${optionsData.highestPutOIStrike} (Floor Defense)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Total Open Interest:</span>
              <span className="font-mono text-slate-200">
                {optionsData.totalCallOI.toLocaleString()} C / {optionsData.totalPutOI.toLocaleString()} P
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Max Pain Strike Distribution Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Cumulative Option Buyer Dollar Loss by Strike (Max Pain Curve)
            </h4>
            <p className="text-[11px] text-slate-400">
              The lowest bar represents the Max Pain strike where buyers lose the maximum dollar value
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
            Target Strike: ${maxPain}
          </span>
        </div>

        {/* Bar Chart */}
        <div className="h-28 flex items-end gap-1.5 pt-4 px-2">
          {optionsData.strikes.map((s) => {
            const isMaxPain = s.strike === maxPain;
            const isATM = Math.abs(s.strike - spot) <= 2;
            const heightPct = Math.max(10, ((s.totalLossAtStrike || 0) / maxLoss) * 100);

            return (
              <div
                key={s.strike}
                className="flex-1 flex flex-col items-center group relative h-full justify-end"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap border border-slate-700">
                  Strike ${s.strike}: Loss ${( (s.totalLossAtStrike || 0) / 1000000).toFixed(1)}M
                </div>

                <div
                  className={`w-full rounded-t transition-all ${
                    isMaxPain
                      ? 'bg-purple-500 ring-2 ring-purple-300'
                      : isATM
                      ? 'bg-indigo-500/70'
                      : 'bg-slate-700/60 hover:bg-slate-600'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
                <span className={`text-[9px] font-mono mt-1 ${isMaxPain ? 'text-purple-300 font-bold' : 'text-slate-500'}`}>
                  {s.strike}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Options Chain Table (Calls on Left, Center Strike, Puts on Right) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-emerald-400">CALLS (Left)</span>
            <span className="text-slate-600">|</span>
            <span className="font-bold text-white">STRIKE</span>
            <span className="text-slate-600">|</span>
            <span className="font-bold text-rose-400">PUTS (Right)</span>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">
            Highlighted row is At-The-Money (ATM)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950 font-semibold tracking-wider">
                {/* Calls */}
                <th className="py-2.5 px-2">OI</th>
                <th className="py-2.5 px-2">Chg OI</th>
                <th className="py-2.5 px-2">Vol</th>
                <th className="py-2.5 px-2">IV (%)</th>
                <th className="py-2.5 px-2">Delta</th>
                <th className="py-2.5 px-2">Bid/Ask</th>
                <th className="py-2.5 px-2 text-emerald-400">Call LTP</th>
                
                {/* Strike Center */}
                <th className="py-2.5 px-4 text-center bg-slate-900 text-white font-bold">Strike</th>
                
                {/* Puts */}
                <th className="py-2.5 px-2 text-left text-rose-400">Put LTP</th>
                <th className="py-2.5 px-2 text-left">Bid/Ask</th>
                <th className="py-2.5 px-2 text-left">Delta</th>
                <th className="py-2.5 px-2 text-left">IV (%)</th>
                <th className="py-2.5 px-2 text-left">Vol</th>
                <th className="py-2.5 px-2 text-left">Chg OI</th>
                <th className="py-2.5 px-2 text-left">OI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {displayedStrikes.map((s) => {
                const isATM = Math.abs(s.strike - spot) <= 2;
                const isMaxPain = s.strike === maxPain;
                const isITMCall = spot > s.strike;
                const isITMPut = spot < s.strike;

                return (
                  <tr
                    key={s.strike}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isATM ? 'bg-indigo-950/40 ring-1 ring-indigo-500/50' : isMaxPain ? 'bg-purple-950/20' : ''
                    }`}
                  >
                    {/* Call OI */}
                    <td className="py-2 px-2 text-slate-300">
                      {s.callOI.toLocaleString()}
                    </td>

                    {/* Call Chg OI */}
                    <td className={`py-2 px-2 ${s.callChangeOI >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.callChangeOI >= 0 ? '+' : ''}{s.callChangeOI}
                    </td>

                    {/* Call Vol */}
                    <td className="py-2 px-2 text-slate-400">
                      {s.callVol.toLocaleString()}
                    </td>

                    {/* Call IV */}
                    <td className="py-2 px-2 text-slate-300">
                      {s.callIV}%
                    </td>

                    {/* Call Delta */}
                    <td className="py-2 px-2 text-indigo-300">
                      {s.callDelta}
                    </td>

                    {/* Call Bid/Ask */}
                    <td className="py-2 px-2 text-slate-400 text-[10px]">
                      {s.callBid} / {s.callAsk}
                    </td>

                    {/* Call LTP */}
                    <td className={`py-2 px-2 font-bold ${
                      isITMCall ? 'bg-emerald-950/30 text-emerald-300' : 'text-slate-200'
                    }`}>
                      ${s.callLtp}
                    </td>

                    {/* Center Strike Price */}
                    <td className={`py-2 px-4 text-center font-bold font-sans text-xs ${
                      isATM
                        ? 'bg-indigo-600 text-white'
                        : isMaxPain
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-950 text-slate-200'
                    }`}>
                      {s.strike}
                    </td>

                    {/* Put LTP */}
                    <td className={`py-2 px-2 text-left font-bold ${
                      isITMPut ? 'bg-rose-950/30 text-rose-300' : 'text-slate-200'
                    }`}>
                      ${s.putLtp}
                    </td>

                    {/* Put Bid/Ask */}
                    <td className="py-2 px-2 text-left text-slate-400 text-[10px]">
                      {s.putBid} / {s.putAsk}
                    </td>

                    {/* Put Delta */}
                    <td className="py-2 px-2 text-left text-indigo-300">
                      {s.putDelta}
                    </td>

                    {/* Put IV */}
                    <td className="py-2 px-2 text-left text-slate-300">
                      {s.putIV}%
                    </td>

                    {/* Put Vol */}
                    <td className="py-2 px-2 text-left text-slate-400">
                      {s.putVol.toLocaleString()}
                    </td>

                    {/* Put Chg OI */}
                    <td className={`py-2 px-2 text-left ${s.putChangeOI >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.putChangeOI >= 0 ? '+' : ''}{s.putChangeOI}
                    </td>

                    {/* Put OI */}
                    <td className="py-2 px-2 text-left text-slate-300">
                      {s.putOI.toLocaleString()}
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
