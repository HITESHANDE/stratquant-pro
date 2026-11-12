import React, { useState } from 'react';
import { 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Zap, 
  HelpCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { OptionsChainOverview, OptionStrikeRow } from '../types/nexus';
import { NIFTY_OPTIONS_CHAIN } from '../data/nexusData';

interface OptionsAnalyticsPageProps {
  onTradeSignal?: (signalId: string) => void;
}

export const OptionsAnalyticsPage: React.FC<OptionsAnalyticsPageProps> = ({
  onTradeSignal,
}) => {
  const [selectedUnderlying, setSelectedUnderlying] = useState<'NIFTY' | 'BANKNIFTY'>('NIFTY');
  const chainData: OptionsChainOverview = NIFTY_OPTIONS_CHAIN;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Options Analytics & Greeks Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Institutional options chain featuring Delta, Gamma, Theta, Vega, IV, Strike-wise OI Change, Max Pain, and Put-Call Ratio (PCR).
          </p>
        </div>

        {/* Underlying Selector */}
        <div className="flex items-center gap-2 bg-[#070B14] p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setSelectedUnderlying('NIFTY')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              selectedUnderlying === 'NIFTY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            NIFTY 50
          </button>
          <button
            onClick={() => setSelectedUnderlying('BANKNIFTY')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              selectedUnderlying === 'BANKNIFTY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            BANK NIFTY
          </button>
        </div>
      </div>

      {/* Derivative Market Key Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Spot Price */}
        <div className="p-3.5 rounded-xl bg-[#0B1222] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Spot Price</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            ₹{chainData.spotPrice.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">+0.59% (Bullish)</span>
        </div>

        {/* ATM Strike */}
        <div className="p-3.5 rounded-xl bg-[#0B1222] border border-indigo-500/30">
          <span className="text-[11px] text-indigo-300 uppercase font-medium">ATM Strike</span>
          <div className="text-lg font-bold font-mono text-indigo-400 mt-1">
            {chainData.atmStrike}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">At The Money</span>
        </div>

        {/* PCR */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <span className="text-[11px] text-emerald-300 uppercase font-medium">PCR (Put-Call Ratio)</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {chainData.pcr}
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold font-mono">{chainData.pcrSentiment}</span>
        </div>

        {/* Max Pain Strike */}
        <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
          <span className="text-[11px] text-indigo-300 uppercase font-medium">Max Pain Strike</span>
          <div className="text-lg font-bold font-mono text-indigo-300 mt-1">
            {chainData.maxPainStrike}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">MM Expiry Target</span>
        </div>

        {/* Total CE OI */}
        <div className="p-3.5 rounded-xl bg-[#0B1222] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Total CE OI</span>
          <div className="text-lg font-bold font-mono text-rose-400 mt-1">
            {(chainData.totalCeOi / 1000000).toFixed(2)}M
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Call Resistance</span>
        </div>

        {/* Total PE OI */}
        <div className="p-3.5 rounded-xl bg-[#0B1222] border border-slate-800">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Total PE OI</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {(chainData.totalPeOi / 1000000).toFixed(2)}M
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Put Support</span>
        </div>

      </div>

      {/* Derivative Signals Callout Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/30 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h3 className="font-bold text-white text-sm">
              Live Option Flow Signal: NIFTY 24200 CE BUY &amp; 24000 PE SELL
            </h3>
            <p className="text-xs text-slate-300">
              Aggressive call short covering at 24200 strike (-420K OI) accompanied by massive PE writing at 24000 (+820K OI).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
            CE BUY ACTIVE
          </span>
          <span className="px-3 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold">
            PE SELL ACTIVE
          </span>
        </div>
      </div>

      {/* Full Institutional Options Chain Table */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono border-collapse">
            
            {/* Header Super-Row */}
            <thead>
              <tr className="border-b border-slate-800 bg-[#070B14] text-[11px] font-bold">
                <th colSpan={7} className="py-2.5 px-3 text-emerald-400 border-r border-slate-800 bg-emerald-950/10">
                  CALL OPTIONS (CE)
                </th>
                <th className="py-2.5 px-4 text-white bg-slate-900 border-r border-slate-800 font-sans tracking-wider">
                  STRIKE
                </th>
                <th colSpan={7} className="py-2.5 px-3 text-rose-400 bg-rose-950/10">
                  PUT OPTIONS (PE)
                </th>
              </tr>
              <tr className="border-b border-slate-800 bg-slate-950 text-[10px] text-slate-400 font-medium">
                {/* CE Side */}
                <th className="py-2 px-2">Signal</th>
                <th className="py-2 px-2">Delta</th>
                <th className="py-2 px-2">Gamma</th>
                <th className="py-2 px-2">IV %</th>
                <th className="py-2 px-2">Volume</th>
                <th className="py-2 px-2">Chg OI</th>
                <th className="py-2 px-3 border-r border-slate-800 text-white font-bold">LTP</th>

                {/* Strike */}
                <th className="py-2 px-4 bg-slate-900/90 text-indigo-300 font-bold border-r border-slate-800">
                  PRICE
                </th>

                {/* PE Side */}
                <th className="py-2 px-3 text-white font-bold">LTP</th>
                <th className="py-2 px-2">Chg OI</th>
                <th className="py-2 px-2">Volume</th>
                <th className="py-2 px-2">IV %</th>
                <th className="py-2 px-2">Gamma</th>
                <th className="py-2 px-2">Delta</th>
                <th className="py-2 px-2">Signal</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {chainData.strikes.map((row) => {
                const isAtm = row.strike === chainData.atmStrike;
                return (
                  <tr 
                    key={row.strike}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isAtm ? 'bg-indigo-950/30' : ''
                    }`}
                  >
                    {/* CE Signal */}
                    <td className="py-2.5 px-2">
                      {row.ce.signal ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {row.ce.signal}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* CE Delta */}
                    <td className="py-2.5 px-2 text-slate-300">{row.ce.delta}</td>

                    {/* CE Gamma */}
                    <td className="py-2.5 px-2 text-slate-400">{row.ce.gamma}</td>

                    {/* CE IV */}
                    <td className="py-2.5 px-2 text-amber-400">{row.ce.iv}%</td>

                    {/* CE Volume */}
                    <td className="py-2.5 px-2 text-slate-300">{(row.ce.volume / 1000).toFixed(0)}k</td>

                    {/* CE Chg OI */}
                    <td className={`py-2.5 px-2 font-semibold ${
                      row.ce.changeOi < 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {row.ce.changeOi > 0 ? '+' : ''}{(row.ce.changeOi / 1000).toFixed(0)}k
                    </td>

                    {/* CE LTP */}
                    <td className="py-2.5 px-3 border-r border-slate-800 text-emerald-400 font-bold">
                      ₹{row.ce.ltp.toFixed(2)}
                    </td>

                    {/* Strike */}
                    <td className={`py-2.5 px-4 font-bold border-r border-slate-800 ${
                      isAtm ? 'bg-indigo-600 text-white font-extrabold shadow' : 'bg-slate-900 text-white'
                    }`}>
                      {row.strike} {isAtm ? '(ATM)' : ''}
                    </td>

                    {/* PE LTP */}
                    <td className="py-2.5 px-3 text-rose-400 font-bold">
                      ₹{row.pe.ltp.toFixed(2)}
                    </td>

                    {/* PE Chg OI */}
                    <td className={`py-2.5 px-2 font-semibold ${
                      row.pe.changeOi > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {row.pe.changeOi > 0 ? '+' : ''}{(row.pe.changeOi / 1000).toFixed(0)}k
                    </td>

                    {/* PE Volume */}
                    <td className="py-2.5 px-2 text-slate-300">{(row.pe.volume / 1000).toFixed(0)}k</td>

                    {/* PE IV */}
                    <td className="py-2.5 px-2 text-amber-400">{row.pe.iv}%</td>

                    {/* PE Gamma */}
                    <td className="py-2.5 px-2 text-slate-400">{row.pe.gamma}</td>

                    {/* PE Delta */}
                    <td className="py-2.5 px-2 text-slate-300">{row.pe.delta}</td>

                    {/* PE Signal */}
                    <td className="py-2.5 px-2">
                      {row.pe.signal ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {row.pe.signal}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

        {/* Footer Greeks Legend */}
        <div className="p-3 bg-[#070B14] border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-4">
            <span><strong>Δ Delta:</strong> Price sensitivity per ₹1 index move</span>
            <span><strong>Γ Gamma:</strong> Delta acceleration rate</span>
            <span><strong>Θ Theta:</strong> Daily time decay</span>
            <span><strong>ν Vega:</strong> Sensitivity per 1% IV change</span>
          </div>
          <span className="font-mono text-indigo-400 font-semibold">
            Expiry: {chainData.expiryDate}
          </span>
        </div>

      </div>

    </div>
  );
};
