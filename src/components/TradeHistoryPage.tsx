import React, { useState } from 'react';
import { 
  Archive, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  DollarSign
} from 'lucide-react';

interface HistoryRecord {
  id: string;
  instrumentName: string;
  segment: string;
  action: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  pnlPoints: number;
  pnlPct: number;
  duration: string;
  exitReason: 'TARGET 1 HIT' | 'TARGET 2 HIT' | 'TARGET 3 HIT' | 'STOP LOSS HIT';
  closedAt: string;
  strategyName: string;
}

export const TradeHistoryPage: React.FC = () => {
  const [filterReason, setFilterReason] = useState<string>('ALL');

  const historyRecords: HistoryRecord[] = [
    {
      id: 'NX-789',
      instrumentName: 'NIFTY 24150 CE',
      segment: 'Index Option',
      action: 'BUY',
      entryPrice: 94.00,
      exitPrice: 158.00,
      pnlPoints: 64.00,
      pnlPct: 68.08,
      duration: '42 mins',
      exitReason: 'TARGET 2 HIT',
      closedAt: 'Today 14:12 IST',
      strategyName: 'Options Delta Gamma Momentum',
    },
    {
      id: 'NX-785',
      instrumentName: 'RELIANCE',
      segment: 'NSE Stock',
      action: 'BUY',
      entryPrice: 2895.00,
      exitPrice: 2975.00,
      pnlPoints: 80.00,
      pnlPct: 2.76,
      duration: '3 days',
      exitReason: 'TARGET 2 HIT',
      closedAt: 'Today 11:30 IST',
      strategyName: 'Dual EMA 20/50 Golden Trend',
    },
    {
      id: 'NX-781',
      instrumentName: 'CRUDEOIL NOV FUT',
      segment: 'MCX Commodity',
      action: 'SELL',
      entryPrice: 6045.00,
      exitPrice: 5930.00,
      pnlPoints: 115.00,
      pnlPct: 1.90,
      duration: '5 hours',
      exitReason: 'TARGET 2 HIT',
      closedAt: 'Yesterday 21:45 IST',
      strategyName: 'Donchian Breakdown & Volume Flush',
    },
    {
      id: 'NX-778',
      instrumentName: 'POLICYBZR',
      segment: 'NSE Stock',
      action: 'BUY',
      entryPrice: 955.00,
      exitPrice: 938.00,
      pnlPoints: -17.00,
      pnlPct: -1.78,
      duration: '1 day',
      exitReason: 'STOP LOSS HIT',
      closedAt: 'Yesterday 14:30 IST',
      strategyName: 'EMA Pullback Absorption',
    },
    {
      id: 'NX-774',
      instrumentName: 'TCS',
      segment: 'NSE Stock',
      action: 'BUY',
      entryPrice: 4040.00,
      exitPrice: 4180.00,
      pnlPoints: 140.00,
      pnlPct: 3.46,
      duration: '4 days',
      exitReason: 'TARGET 3 HIT',
      closedAt: 'Nov 07, 15:15 IST',
      strategyName: 'Supertrend Trailing Confluence',
    },
    {
      id: 'NX-770',
      instrumentName: 'BANKNIFTY 51200 PE',
      segment: 'Index Option',
      action: 'BUY',
      entryPrice: 280.00,
      exitPrice: 220.00,
      pnlPoints: -60.00,
      pnlPct: -21.42,
      duration: '25 mins',
      exitReason: 'STOP LOSS HIT',
      closedAt: 'Nov 06, 10:45 IST',
      strategyName: 'Support Breakdown Put Scalper',
    },
    {
      id: 'NX-765',
      instrumentName: 'TATAMOTORS',
      segment: 'NSE Stock',
      action: 'BUY',
      entryPrice: 928.00,
      exitPrice: 975.00,
      pnlPoints: 47.00,
      pnlPct: 5.06,
      duration: '5 days',
      exitReason: 'TARGET 3 HIT',
      closedAt: 'Nov 05, 12:20 IST',
      strategyName: 'Mansfield RS All-Time High',
    },
  ];

  const filtered = filterReason === 'ALL'
    ? historyRecords
    : historyRecords.filter((h) => h.exitReason.includes(filterReason));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Trade History & Audit Log
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete track record of historical algorithmic signals with verified exit points, points captured, and audit rationale.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#070B14] p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterReason('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterReason === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setFilterReason('TARGET')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterReason === 'TARGET' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Targets Achieved
          </button>
          <button
            onClick={() => setFilterReason('STOP')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterReason === 'STOP' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stop Loss Hit
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#070B14] border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-3 px-3">Signal ID</th>
                <th className="py-3 px-3 font-sans">Instrument</th>
                <th className="py-3 px-3 font-sans">Segment</th>
                <th className="py-3 px-3 text-center">Action</th>
                <th className="py-3 px-3 text-right">Entry Price</th>
                <th className="py-3 px-3 text-right">Exit Price</th>
                <th className="py-3 px-3 text-right font-bold text-white">Points Captured</th>
                <th className="py-3 px-3 text-right">Return %</th>
                <th className="py-3 px-3 text-center">Duration</th>
                <th className="py-3 px-3 text-center font-sans">Exit Status</th>
                <th className="py-3 px-3 text-right font-sans">Closed Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((item) => {
                const isWin = item.pnlPoints >= 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-3 text-slate-300 font-semibold">{item.id}</td>
                    <td className="py-3 px-3 font-sans font-bold text-white">{item.instrumentName}</td>
                    <td className="py-3 px-3 font-sans text-slate-400">{item.segment}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200">₹{item.entryPrice.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-white font-semibold">₹{item.exitPrice.toFixed(2)}</td>
                    <td className={`py-3 px-3 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}{item.pnlPoints.toFixed(2)} pts
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}{item.pnlPct.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">{item.duration}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.exitReason.includes('TARGET')
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {item.exitReason}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-sans">{item.closedAt}</td>
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
