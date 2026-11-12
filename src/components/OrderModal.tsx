import React, { useState } from 'react';
import { StockInfo, StrategyDefinition, TradingStyle, PortfolioPosition } from '../types/trading';
import { X, ShieldAlert, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockInfo[];
  strategies: StrategyDefinition[];
  currentStyle: TradingStyle;
  initialStock?: StockInfo;
  onPlaceOrder: (pos: Omit<PortfolioPosition, 'id' | 'unrealizedPnl' | 'unrealizedPnlPct'>) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  stocks,
  strategies,
  currentStyle,
  initialStock,
  onPlaceOrder,
}) => {
  if (!isOpen) return null;

  const defaultStock = initialStock || stocks[0];
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultStock.symbol);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategies[0].id);
  const [orderType, setOrderType] = useState<'LONG' | 'SHORT'>('LONG');
  const [shares, setShares] = useState<number>(50);

  const activeStock = stocks.find((s) => s.symbol === selectedSymbol) || defaultStock;
  const activeStrategy = strategies.find((s) => s.id === selectedStrategyId) || strategies[0];

  const price = activeStock.currentPrice;
  const isLong = orderType === 'LONG';

  // Sane default Stop Loss and Target
  const defaultStopDistance = price * (currentStyle === 'intraday' ? 0.015 : 0.035);
  const [stopLoss, setStopLoss] = useState<number>(
    parseFloat((isLong ? price - defaultStopDistance : price + defaultStopDistance).toFixed(2))
  );
  const [targetPrice, setTargetPrice] = useState<number>(
    parseFloat((isLong ? price + defaultStopDistance * 2.2 : price - defaultStopDistance * 2.2).toFixed(2))
  );

  const totalValue = shares * price;
  const maxRisk = Math.abs(price - stopLoss) * shares;
  const potentialProfit = Math.abs(targetPrice - price) * shares;
  const rrRatio = maxRisk > 0 ? (potentialProfit / maxRisk).toFixed(1) : '2.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceOrder({
      symbol: activeStock.symbol,
      strategyName: activeStrategy.name,
      style: currentStyle,
      type: orderType,
      entryPrice: price,
      currentPrice: price,
      shares,
      stopLoss,
      targetPrice,
      entryDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-400" />
              New Simulated Paper Order
            </h3>
            <p className="text-[11px] text-slate-400">
              Style: <span className="text-indigo-400 capitalize font-medium">{currentStyle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Long / Short Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setOrderType('LONG');
                setStopLoss(parseFloat((price - defaultStopDistance).toFixed(2)));
                setTargetPrice(parseFloat((price + defaultStopDistance * 2.2).toFixed(2)));
              }}
              className={`py-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                orderType === 'LONG'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType('SHORT');
                setStopLoss(parseFloat((price + defaultStopDistance).toFixed(2)));
                setTargetPrice(parseFloat((price - defaultStopDistance * 2.2).toFixed(2)));
              }}
              className={`py-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                orderType === 'SHORT'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              SELL / SHORT
            </button>
          </div>

          {/* Stock & Strategy Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Select Stock:</label>
              <select
                value={selectedSymbol}
                onChange={(e) => {
                  setSelectedSymbol(e.target.value);
                  const newStock = stocks.find((s) => s.symbol === e.target.value);
                  if (newStock) {
                    const p = newStock.currentPrice;
                    const dist = p * 0.025;
                    setStopLoss(parseFloat((orderType === 'LONG' ? p - dist : p + dist).toFixed(2)));
                    setTargetPrice(parseFloat((orderType === 'LONG' ? p + dist * 2.2 : p - dist * 2.2).toFixed(2)));
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:ring-1 focus:ring-indigo-500"
              >
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} ({s.currencySymbol || '$'}{s.currentPrice})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Strategy Model:</label>
              <select
                value={selectedStrategyId}
                onChange={(e) => setSelectedStrategyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-indigo-300 focus:ring-1 focus:ring-indigo-500 truncate"
              >
                {strategies.map((strat) => (
                  <option key={strat.id} value={strat.id}>
                    {strat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Position Sizing / Shares */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-medium">Order Quantity (Shares):</label>
              <span className="font-mono text-slate-300">${totalValue.toLocaleString()} Capital</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="5000"
                value={shares}
                onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-1">
                {[10, 50, 100, 250].map((qty) => (
                  <button
                    type="button"
                    key={qty}
                    onClick={() => setShares(qty)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded font-mono text-[11px]"
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stop Loss & Target Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-rose-400 block mb-1 font-medium">Stop Loss ({activeStock.currencySymbol || '$'}):</label>
              <input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-rose-300 font-mono font-bold focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="text-emerald-400 block mb-1 font-medium">Target Price ({activeStock.currencySymbol || '$'}):</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-300 font-mono font-bold focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Risk-Reward & Capital Summary Box */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Commitment:</span>
              <span className="text-white font-bold">{activeStock.currencySymbol || '$'}{totalValue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Max Risk:</span>
              <span className="text-rose-400 font-bold">-{activeStock.currencySymbol || '$'}{maxRisk.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Potential Reward:</span>
              <span className="text-emerald-400 font-bold">+{activeStock.currencySymbol || '$'}{potentialProfit.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-1">
              <span className="text-slate-400">Risk-to-Reward Ratio:</span>
              <span className="text-purple-300 font-bold">1:{rrRatio}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white rounded-lg text-xs font-semibold shadow-md transition-all ${
                isLong ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              Confirm Simulated {orderType} Order
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
