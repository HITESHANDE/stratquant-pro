import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Search
} from 'lucide-react';
import { WatchlistItem } from '../types/nexus';
import { INITIAL_WATCHLIST } from '../data/nexusData';

interface WatchlistPageProps {
  onSelectInstrument?: (symbol: string) => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  onSelectInstrument,
}) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);
  const [searchSymbol, setSearchSymbol] = useState<string>('');

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist(watchlist.filter((item) => item.id !== id));
  };

  const handleAdd = () => {
    if (!searchSymbol.trim()) return;
    const sym = searchSymbol.trim().toUpperCase();
    if (watchlist.some((w) => w.symbol === sym)) return;

    const newItem: WatchlistItem = {
      id: `W-${Date.now()}`,
      symbol: sym,
      name: `${sym} India Equities`,
      segment: 'NSE_STOCK',
      currentPrice: 1540.00,
      changePct: 0.85,
      dayHigh: 1560.00,
      dayLow: 1525.00,
      volume: '1.2M',
      activeSignal: 'BUY',
      signalConfidence: 87,
      sparkline: [1525, 1532, 1545, 1538, 1540],
    };

    setWatchlist([newItem, ...watchlist]);
    setSearchSymbol('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header & Add Item */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Institutional Watchlist
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track key Indian equities, indices, and MCX commodities with active AI signal statuses and day ranges.
          </p>
        </div>

        {/* Add Instrument Input */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <input
              type="text"
              placeholder="Add symbol (e.g. COALINDIA)..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full bg-[#070B14] border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 uppercase font-mono"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Watchlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {watchlist.map((item) => {
          const isPositive = item.changePct >= 0;
          return (
            <div
              key={item.id}
              onClick={() => onSelectInstrument && onSelectInstrument(item.symbol)}
              className="p-4 rounded-xl bg-[#0B1222] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between group shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                      {item.symbol}
                    </h3>
                    <span className="text-[11px] text-slate-400 truncate block max-w-[150px]">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.activeSignal && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                        item.activeSignal === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {item.activeSignal} ({item.signalConfidence}%)
                      </span>
                    )}
                    <button
                      onClick={(e) => handleRemove(item.id, e)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between font-mono">
                  <div className="text-xl font-bold text-white">
                    ₹{item.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center text-xs font-semibold ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isPositive ? '+' : ''}{item.changePct.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Day High / Low / Volume */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-400">L: </span>
                  <span className="text-slate-300">₹{item.dayLow.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-slate-400">H: </span>
                  <span className="text-slate-300">₹{item.dayHigh.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Vol: </span>
                  <span className="text-slate-300">{item.volume}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
