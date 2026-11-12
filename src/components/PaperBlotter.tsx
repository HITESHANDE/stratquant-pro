import React, { useState } from 'react';
import { PortfolioPosition, StockInfo, TradingStyle } from '../types/trading';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  CheckCircle, 
  Plus, 
  RefreshCcw,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

interface PaperBlotterProps {
  cashBalance: number;
  positions: PortfolioPosition[];
  closedTrades: any[];
  allStocks: StockInfo[];
  onClosePosition: (id: string) => void;
  onResetPortfolio: () => void;
  onOpenOrderModal: () => void;
}

export const PaperBlotter: React.FC<PaperBlotterProps> = ({
  cashBalance,
  positions,
  closedTrades,
  allStocks,
  onClosePosition,
  onResetPortfolio,
  onOpenOrderModal,
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

  // Calculate live portfolio metrics
  const positionsValue = positions.reduce((acc, p) => acc + p.shares * p.currentPrice, 0);
  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + (t.pnlUsd || 0), 0);
  const totalEquity = cashBalance + positionsValue;

  const totalWinning = closedTrades.filter((t) => (t.pnlUsd || 0) > 0).length;
  const paperWinRate = closedTrades.length > 0
    ? ((totalWinning / closedTrades.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      
      {/* Portfolio Equity KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Equity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Net Portfolio Equity</span>
            <Wallet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-mono font-bold ${
              totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Cash: <strong className="text-slate-200 font-mono">${cashBalance.toLocaleString()}</strong></span>
            <span>Allocated: <strong className="text-slate-200 font-mono">${positionsValue.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Unrealized PnL</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-bold font-mono ${
              totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Open Positions: <strong className="text-slate-200 font-mono">{positions.length}</strong></span>
            <span>Exposure: <strong className="text-slate-200 font-mono">{((positionsValue / (totalEquity || 1)) * 100).toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* Realized PnL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Realized PnL</span>
            <CheckCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-bold font-mono ${
              totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Closed Trades: <strong className="text-slate-200 font-mono">{closedTrades.length}</strong></span>
            <span>Win Rate: <strong className="text-slate-200 font-mono">{paperWinRate}%</strong></span>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Simulator Actions</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onOpenOrderModal}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Order
            </button>
            <button
              onClick={onResetPortfolio}
              title="Reset portfolio to initial $100,000 balance"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">
            Simulated environment with real-time slippage modeling
          </div>
        </div>

      </div>

      {/* Tabs: Open Positions vs Closed Trades */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'open'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Positions ({positions.length})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'closed'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trade History ({closedTrades.length})
            </button>
          </div>
        </div>

        {/* Open Positions Table */}
        {activeTab === 'open' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950 font-semibold tracking-wider">
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Strategy</th>
                  <th className="py-3 px-3 text-right">Shares</th>
                  <th className="py-3 px-3 text-right">Entry Price</th>
                  <th className="py-3 px-3 text-right">Current Price</th>
                  <th className="py-3 px-3 text-right">Stop Loss</th>
                  <th className="py-3 px-3 text-right">Target</th>
                  <th className="py-3 px-3 text-right">Unrealized PnL</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                      No open positions. Use "New Order" or execute from the Signal Scanner.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => {
                    const isLong = pos.type === 'LONG';
                    const isProfitable = pos.unrealizedPnl >= 0;

                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white text-xs">
                          {pos.symbol}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            isLong ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}>
                            {pos.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-300">
                          {pos.strategyName}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200">
                          {pos.shares}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200">
                          ${pos.entryPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-white">
                          ${pos.currentPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-400">
                          ${pos.stopLoss.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-400">
                          ${pos.targetPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold">
                          <span className={isProfitable ? 'text-emerald-400' : 'text-rose-400'}>
                            {isProfitable ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({isProfitable ? '+' : ''}{pos.unrealizedPnlPct}%)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onClosePosition(pos.id)}
                            className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-600 text-rose-200 hover:text-white rounded font-sans text-[10px] font-semibold transition-colors"
                          >
                            Square Off
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Closed Trades History Table */}
        {activeTab === 'closed' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950 font-semibold tracking-wider">
                  <th className="py-3 px-4">Trade ID</th>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Entry Price</th>
                  <th className="py-3 px-3 text-right">Exit Price</th>
                  <th className="py-3 px-3 text-right">Realized PnL ($)</th>
                  <th className="py-3 px-3 text-right">Return (%)</th>
                  <th className="py-3 px-4">Exit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {closedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      No closed trades yet in this session.
                    </td>
                  </tr>
                ) : (
                  closedTrades.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {t.id || `T-${idx + 1}`}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {t.symbol}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          t.type === 'LONG' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        ${t.entryPrice?.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-white font-bold">
                        ${t.exitPrice?.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={(t.pnlUsd || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {(t.pnlUsd || 0) >= 0 ? '+' : ''}${t.pnlUsd?.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={(t.pnlPct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {(t.pnlPct || 0) >= 0 ? '+' : ''}{t.pnlPct?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                        {t.exitReason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
