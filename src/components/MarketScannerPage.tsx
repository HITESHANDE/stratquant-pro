import React, { useState } from 'react';
import { 
  ScanLine, 
  Newspaper, 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Flame, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { NexusSignal } from '../types/nexus';

interface MarketScannerPageProps {
  onSelectSignalFromScanner: (symbol: string, action: 'BUY' | 'SELL') => void;
}

type ScannerCategory = 'news' | 'candlestick' | 'volume' | 'trend' | 'fno';

export const MarketScannerPage: React.FC<MarketScannerPageProps> = ({
  onSelectSignalFromScanner,
}) => {
  const [activeCategory, setActiveCategory] = useState<ScannerCategory>('trend');

  // Scanner Datasets across the 5 engines specified
  const newsItems = [
    {
      id: 'N-1',
      symbol: 'RELIANCE',
      sentiment: 'POSITIVE' as const,
      category: 'Corporate Announcement',
      headline: 'Jio Platforms reports 23% YoY net profit growth; Capex moderation expands free cash flows.',
      impact: 'Strong Bullish',
      time: '15m ago',
      action: 'BUY' as const,
    },
    {
      id: 'N-2',
      symbol: 'TATAMOTORS',
      sentiment: 'POSITIVE' as const,
      category: 'Sector / Results',
      headline: 'Commercial Vehicle volume surge + Jaguar Land Rover margin expansion beats street estimate by 180 bps.',
      impact: 'High Bullish',
      time: '35m ago',
      action: 'BUY' as const,
    },
    {
      id: 'N-3',
      symbol: 'POLICYBZR',
      sentiment: 'NEGATIVE' as const,
      category: 'Corporate Announcement',
      headline: 'Institutional block sale of 3.2M shares completed; insurance commission margin regulation scrutiny.',
      impact: 'Moderate Bearish',
      time: '1h ago',
      action: 'SELL' as const,
    },
    {
      id: 'N-4',
      symbol: 'CRUDEOIL',
      sentiment: 'NEGATIVE' as const,
      category: 'Commodity Flow',
      headline: 'US crude stockpiles rise by 2.1 million barrels; OPEC+ production quotas meet weak demand forecasts.',
      impact: 'High Bearish',
      time: '2h ago',
      action: 'SELL' as const,
    },
  ];

  const candlestickItems = [
    {
      symbol: 'NIFTY',
      pattern: 'Bullish Hammer off VWAP',
      timeframe: '15m',
      confirmation: 'High (Next candle closed above high)',
      action: 'BUY' as const,
      confidence: 94,
    },
    {
      symbol: 'RELIANCE',
      pattern: 'Bullish Engulfing Pattern',
      timeframe: 'Daily',
      confirmation: 'Confirmed with 2.4x Delivery Volume',
      action: 'BUY' as const,
      confidence: 91,
    },
    {
      symbol: 'POLICYBZR',
      pattern: 'Three Black Crows Breakdown',
      timeframe: '15m',
      confirmation: 'Closed below key support wick',
      action: 'SELL' as const,
      confidence: 88,
    },
    {
      symbol: 'INFY',
      pattern: 'Shooting Star Reversal',
      timeframe: '1h',
      confirmation: 'Upper shadow 3x body length at resistance',
      action: 'SELL' as const,
      confidence: 85,
    },
    {
      symbol: 'SBIN',
      pattern: 'Morning Star Continuation',
      timeframe: 'Daily',
      confirmation: 'Gap up open above 815',
      action: 'BUY' as const,
      confidence: 93,
    },
  ];

  const volumeItems = [
    {
      symbol: 'LT',
      relVolume: '3.1x',
      deliveryPct: '68%',
      volumeBreakout: 'Extreme Surge',
      state: 'Aggressive Institutional Accumulation',
      action: 'BUY' as const,
    },
    {
      symbol: 'BHARTIARTL',
      relVolume: '2.4x',
      deliveryPct: '72%',
      volumeBreakout: 'Breakout High',
      state: 'Sustained Delivery Buy Block',
      action: 'BUY' as const,
    },
    {
      symbol: 'CRUDEOIL',
      relVolume: '2.8x',
      deliveryPct: 'N/A (MCX Futures)',
      volumeBreakout: 'Volume Flush Down',
      state: 'Liquidation of Long Positions',
      action: 'SELL' as const,
    },
    {
      symbol: 'HDFCBANK',
      relVolume: '2.0x',
      deliveryPct: '64%',
      volumeBreakout: 'Accumulation Wick',
      state: 'FII Block Trades Registered',
      action: 'BUY' as const,
    },
  ];

  const trendItems = [
    {
      symbol: 'NIFTY',
      emaStack: 'Above 9, 21, 50, 200 EMA',
      vwapRelation: '+38 pts Above VWAP',
      rsi: '64.8 (Bull Momentum)',
      macd: 'Bullish Cross & Expanding',
      trendScore: '96% Bullish',
      action: 'BUY' as const,
    },
    {
      symbol: 'BANKNIFTY',
      emaStack: 'Above 9, 21, 50 EMA',
      vwapRelation: '+85 pts Above VWAP',
      rsi: '68.2 (Bull Momentum)',
      macd: 'Bullish Expansion',
      trendScore: '92% Bullish',
      action: 'BUY' as const,
    },
    {
      symbol: 'CRUDEOIL',
      emaStack: 'Below 9, 21, 50, 200 EMA',
      vwapRelation: '-32 pts Below VWAP',
      rsi: '36.4 (Bear Momentum)',
      macd: 'Bearish Expansion',
      trendScore: '90% Bearish',
      action: 'SELL' as const,
    },
    {
      symbol: 'POLICYBZR',
      emaStack: 'Below 9 & 21 EMA',
      vwapRelation: '-12 pts Below VWAP',
      rsi: '38.2 (Weak Downward)',
      macd: 'Bearish Cross Active',
      trendScore: '88% Bearish',
      action: 'SELL' as const,
    },
  ];

  const fnoItems = [
    {
      symbol: 'NIFTY 24200 CE',
      oiChange: '-420,000 (Short Covering)',
      priceOiRelation: 'Price Up + OI Down (Short Covering)',
      iv: '13.8%',
      delta: '0.54',
      gamma: '0.0028',
      pcr: '1.28 (Bullish Bias)',
      signal: 'CE BUY (Bullish Momentum)',
      action: 'BUY' as const,
    },
    {
      symbol: 'NIFTY 24000 PE',
      oiChange: '+820,000 (Put Writing)',
      priceOiRelation: 'Price Down + OI Up (Short Build-up)',
      iv: '14.1%',
      delta: '-0.21',
      gamma: '0.0014',
      pcr: '1.34 (Strong Put Support)',
      signal: 'PE SELL (Theta Decay)',
      action: 'SELL' as const,
    },
    {
      symbol: 'BANKNIFTY 51800 CE',
      oiChange: '+580,000 (Long Build-up)',
      priceOiRelation: 'Price Up + OI Up (Aggressive Long)',
      iv: '15.2%',
      delta: '0.52',
      gamma: '0.0024',
      pcr: '1.22 (Bullish)',
      signal: 'CE BUY (Gamma Burst)',
      action: 'BUY' as const,
    },
    {
      symbol: 'RELIANCE 3000 CE',
      oiChange: '+640,000 (Long Build-up)',
      priceOiRelation: 'Price Up + OI Up (Bullish Breakout)',
      iv: '16.4%',
      delta: '0.38',
      gamma: '0.0018',
      pcr: '1.18',
      signal: 'CE BUY (Breakout)',
      action: 'BUY' as const,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Multi-Factor Market Scanner
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time screening across 5 quantitative pillars: News, Candlesticks, Volume, Technical Trends, and F&O OI Derivatives.
          </p>
        </div>

        {/* 5 Scanner Category Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#070B14] p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveCategory('news')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeCategory === 'news' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>1. News Scanner</span>
          </button>
          <button
            onClick={() => setActiveCategory('candlestick')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeCategory === 'candlestick' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>2. Candlestick</span>
          </button>
          <button
            onClick={() => setActiveCategory('volume')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeCategory === 'volume' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>3. Volume & Delivery</span>
          </button>
          <button
            onClick={() => setActiveCategory('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeCategory === 'trend' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>4. Trend & Indicators</span>
          </button>
          <button
            onClick={() => setActiveCategory('fno')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeCategory === 'fno' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>5. F&O & OI Greeks</span>
          </button>
        </div>
      </div>

      {/* 1. News Scanner View */}
      {activeCategory === 'news' && (
        <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Institutional News & Sentiment Screener</h2>
              <p className="text-xs text-slate-400">Scans positive/negative earnings, regulatory filings, corporate announcements, and sector news.</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
              Live AI Sentiment Stream
            </span>
          </div>

          <div className="space-y-3">
            {newsItems.map((n) => (
              <div 
                key={n.id}
                onClick={() => onSelectSignalFromScanner(n.symbol, n.action)}
                className="p-4 rounded-xl bg-[#070B14] border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{n.symbol}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {n.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      n.sentiment === 'POSITIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {n.impact}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    {n.headline}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-black uppercase ${
                    n.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {n.action} SIGNAL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Candlestick Scanner View */}
      {activeCategory === 'candlestick' && (
        <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Candlestick Pattern Recognition Engine</h2>
              <p className="text-xs text-slate-400">Scans Engulfing, Hammer, Shooting Star, Doji, Morning Star, and Breakout candles across all timeframes.</p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded">
              Pattern Validated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {candlestickItems.map((c, i) => (
              <div 
                key={i}
                onClick={() => onSelectSignalFromScanner(c.symbol, c.action)}
                className="p-4 rounded-xl bg-[#070B14] border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{c.symbol}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    c.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {c.action}
                  </span>
                </div>
                <div className="text-xs font-semibold text-indigo-300">
                  {c.pattern}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Confirmation: <span className="text-slate-200">{c.confirmation}</span> ({c.timeframe})
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">AI Confidence:</span>
                  <span className="font-bold text-emerald-400">{c.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Volume Scanner View */}
      {activeCategory === 'volume' && (
        <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Relative Volume & Delivery Breakout Scanner</h2>
              <p className="text-xs text-slate-400">Isolates institutional block volume (&gt; 2.0x average), elevated delivery absorption %, and volume breakouts.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#070B14] border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Relative Volume</th>
                  <th className="py-3 px-3">Delivery %</th>
                  <th className="py-3 px-3">Breakout Classification</th>
                  <th className="py-3 px-3 font-sans">Institutional State</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {volumeItems.map((v, i) => (
                  <tr 
                    key={i}
                    onClick={() => onSelectSignalFromScanner(v.symbol, v.action)}
                    className="hover:bg-indigo-950/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-sans font-bold text-white">{v.symbol}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{v.relVolume}</td>
                    <td className="py-3 px-3 text-slate-200">{v.deliveryPct}</td>
                    <td className="py-3 px-3 text-indigo-300 font-sans">{v.volumeBreakout}</td>
                    <td className="py-3 px-3 text-slate-400 font-sans">{v.state}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {v.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Trend Scanner View */}
      {activeCategory === 'trend' && (
        <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Trend Confluence Screener (EMA / VWAP / RSI / MACD)</h2>
              <p className="text-xs text-slate-400">Strict multi-indicator alignment check: EMA 9/21/50/200, Session VWAP, RSI corridor, and MACD momentum.</p>
            </div>
          </div>

          <div className="space-y-3">
            {trendItems.map((t, i) => (
              <div 
                key={i}
                onClick={() => onSelectSignalFromScanner(t.symbol, t.action)}
                className="p-4 rounded-xl bg-[#070B14] border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{t.symbol}</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      Trend Confluence: {t.trendScore}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-2 text-slate-300">
                    <div>EMA: <span className="text-slate-400">{t.emaStack}</span></div>
                    <div>VWAP: <span className="text-slate-400">{t.vwapRelation}</span></div>
                    <div>RSI: <span className="text-slate-400">{t.rsi}</span></div>
                    <div>MACD: <span className="text-slate-400">{t.macd}</span></div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`px-3 py-1 rounded text-xs font-black uppercase ${
                    t.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {t.action} SIGNAL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. F&O Scanner View */}
      {activeCategory === 'fno' && (
        <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">F&O Derivatives, Change in OI & Greeks Scanner</h2>
              <p className="text-xs text-slate-400">Scans Open Interest expansion/unwinding, Price/OI quadrant analysis, IV, Delta, Gamma, and PCR ratios.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fnoItems.map((f, i) => (
              <div 
                key={i}
                className="p-4 rounded-xl bg-[#070B14] border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{f.symbol}</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    f.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {f.signal}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-center">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">OI Change</span>
                    <span className="text-slate-200 font-semibold">{f.oiChange.split(' ')[0]}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Implied Vol</span>
                    <span className="text-amber-400 font-semibold">{f.iv}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Delta / Gamma</span>
                    <span className="text-indigo-300 font-semibold">{f.delta} / {f.gamma}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">PCR Ratio</span>
                    <span className="text-emerald-400 font-semibold">{f.pcr.split(' ')[0]}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-sans">
                  <strong>Price/OI Flow:</strong> {f.priceOiRelation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
