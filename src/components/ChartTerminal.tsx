import React, { useState, useMemo, useRef } from 'react';
import { Candle, StrategyDefinition, TradingStyle, StockInfo, Trade, BacktestMetrics } from '../types/trading';
import { 
  Eye, 
  EyeOff, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  Layers, 
  Download,
  Maximize2
} from 'lucide-react';

interface ChartTerminalProps {
  candles: Candle[];
  stock: StockInfo;
  strategy: StrategyDefinition;
  style: TradingStyle;
  trades: Trade[];
  metrics: BacktestMetrics;
  onStyleChange: (style: TradingStyle) => void;
  onStrategyChange: (strategyId: string) => void;
  allStrategies: StrategyDefinition[];
  allStocks: StockInfo[];
  onStockChange: (symbol: string) => void;
  onOpenOrderModal: () => void;
}

export const ChartTerminal: React.FC<ChartTerminalProps> = ({
  candles,
  stock,
  strategy,
  style,
  trades,
  metrics,
  onStyleChange,
  onStrategyChange,
  allStrategies,
  allStocks,
  onStockChange,
  onOpenOrderModal,
}) => {
  // Indicator Visibility State
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(false);
  const [showSupertrend, setShowSupertrend] = useState(strategy.id === 'strat_supertrend');
  const [showBollinger, setShowBollinger] = useState(strategy.id === 'strat_bb_squeeze');
  const [showDonchian, setShowDonchian] = useState(strategy.id === 'strat_donchian_breakout');
  const [showVWAP, setShowVWAP] = useState(style === 'intraday' || strategy.id === 'strat_vwap_bands');
  const [showSignals, setShowSignals] = useState(true);

  // Subchart mode: 'rsi' | 'macd' | 'adx' | 'equity'
  const [subChartTab, setSubChartTab] = useState<'rsi' | 'macd' | 'adx' | 'equity'>('rsi');

  // Hover crosshair state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Visible candle window (last 70 candles or full intraday session)
  const displayCandles = useMemo(() => {
    return candles.slice(-70);
  }, [candles]);

  const offsetIndex = Math.max(0, candles.length - 70);

  // Filter trades that occurred within visible candle window
  const visibleTrades = useMemo(() => {
    return trades.filter((t) => t.entryIndex >= offsetIndex || t.exitIndex >= offsetIndex);
  }, [trades, offsetIndex]);

  // SVG Chart Dimensions
  const chartHeight = 360;
  const subChartHeight = 120;
  const svgWidth = 920;
  const padding = { top: 20, right: 65, bottom: 25, left: 15 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Price range min/max
  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    displayCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (showBollinger && c.bollinger) {
        if (c.bollinger.lower < min) min = c.bollinger.lower;
        if (c.bollinger.upper > max) max = c.bollinger.upper;
      }
      if (showDonchian && c.donchian) {
        if (c.donchian.lower < min) min = c.donchian.lower;
        if (c.donchian.upper > max) max = c.donchian.upper;
      }
      if (showVWAP && c.vwapLower) {
        if (c.vwapLower < min) min = c.vwapLower;
        if (c.vwapUpper && c.vwapUpper > max) max = c.vwapUpper;
      }
    });

    const buffer = (max - min) * 0.06;
    return {
      minPrice: Math.max(1, min - buffer),
      maxPrice: max + buffer,
    };
  }, [displayCandles, showBollinger, showDonchian, showVWAP]);

  // Max volume for volume bars
  const maxVolume = useMemo(() => {
    return Math.max(...displayCandles.map((c) => c.volume), 1);
  }, [displayCandles]);

  // Scaling helpers
  const scaleY = (price: number) => {
    if (maxPrice === minPrice) return plotHeight / 2 + padding.top;
    return padding.top + plotHeight - ((price - minPrice) / (maxPrice - minPrice)) * plotHeight;
  };

  const candleWidth = Math.max(4, (plotWidth / displayCandles.length) * 0.65);
  const candleGap = plotWidth / displayCandles.length;

  const getCandleX = (index: number) => {
    return padding.left + index * candleGap + candleGap / 2;
  };

  // Polyline generator
  const generatePath = (getValue: (c: Candle) => number | undefined) => {
    const points: string[] = [];
    displayCandles.forEach((c, idx) => {
      const val = getValue(c);
      if (val !== undefined && !isNaN(val)) {
        const x = getCandleX(idx);
        const y = scaleY(val);
        points.push(`${x},${y}`);
      }
    });
    return points.join(' ');
  };

  const activeCandle = hoveredIndex !== null && displayCandles[hoveredIndex]
    ? displayCandles[hoveredIndex]
    : displayCandles[displayCandles.length - 1];

  // Export trade log as CSV
  const handleExportCSV = () => {
    const headers = ['Trade ID', 'Symbol', 'Style', 'Type', 'Entry Date', 'Entry Price', 'Exit Date', 'Exit Price', 'Shares', 'PnL ($)', 'PnL (%)', 'Exit Reason'];
    const rows = trades.map((t) => [
      t.id,
      t.symbol,
      t.style,
      t.type,
      t.entryDate,
      t.entryPrice,
      t.exitDate,
      t.exitPrice,
      t.quantity,
      t.pnlUsd,
      t.pnlPct,
      t.exitReason,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${stock.symbol}_${strategy.id}_trades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Terminal Top Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Stock Picker & Strategy Picker */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Stock Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Asset:</span>
            <select
              value={stock.symbol}
              onChange={(e) => onStockChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {allStocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} · {s.name} ({s.currencySymbol || '$'}{s.currentPrice})
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Strategy:</span>
            <select
              value={strategy.id}
              onChange={(e) => onStrategyChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-indigo-300 font-medium text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[260px] truncate"
            >
              {allStrategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Style quick toggle */}
          <div className="hidden sm:flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            {(['intraday', 'swing', 'positional'] as TradingStyle[]).map((st) => (
              <button
                key={st}
                onClick={() => onStyleChange(st)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded capitalize transition-all ${
                  style === st ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

        </div>

        {/* Right: Actions & Overlays Toggle */}
        <div className="flex items-center gap-2">
          
          {/* Indicators dropdown / quick toggles */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-[11px]">
            <button
              onClick={() => setShowEMA20(!showEMA20)}
              className={`px-2 py-0.5 rounded font-mono ${
                showEMA20 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'
              }`}
            >
              EMA 20
            </button>
            <button
              onClick={() => setShowEMA50(!showEMA50)}
              className={`px-2 py-0.5 rounded font-mono ${
                showEMA50 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-500'
              }`}
            >
              EMA 50
            </button>
            <button
              onClick={() => setShowSupertrend(!showSupertrend)}
              className={`px-2 py-0.5 rounded ${
                showSupertrend ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-500'
              }`}
            >
              Supertrend
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-0.5 rounded ${
                showBollinger ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500'
              }`}
            >
              BB
            </button>
            <button
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-0.5 rounded ${
                showVWAP ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-500'
              }`}
            >
              VWAP
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            title="Export Backtest Trades to CSV"
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Paper Trade Order CTA */}
          <button
            onClick={onOpenOrderModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            New Paper Trade
          </button>

        </div>
      </div>

      {/* Main Terminal Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: 9 Cols - Interactive SVG Candlestick Chart */}
        <div className="lg:col-span-9 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between">
          
          {/* Chart Header Bar: Active Candle O H L C Vol Info */}
          <div className="p-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono gap-2">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white font-sans text-sm">{stock.symbol}</span>
              <span className="text-slate-400">{activeCandle?.timestamp}</span>
              <span className="text-slate-500">·</span>
              <span>O: <strong className="text-slate-200">{activeCandle?.open.toFixed(2)}</strong></span>
              <span>H: <strong className="text-emerald-400">{activeCandle?.high.toFixed(2)}</strong></span>
              <span>L: <strong className="text-rose-400">{activeCandle?.low.toFixed(2)}</strong></span>
              <span>C: <strong className="text-white font-bold">{activeCandle?.close.toFixed(2)}</strong></span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Vol: <strong className="text-slate-300">{activeCandle?.volume.toLocaleString()}</strong></span>
              {showEMA20 && activeCandle?.ema20 && (
                <span className="text-amber-400">EMA20: {activeCandle.ema20}</span>
              )}
              {showEMA50 && activeCandle?.ema50 && (
                <span className="text-sky-400">EMA50: {activeCandle.ema50}</span>
              )}
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div 
            ref={containerRef}
            className="relative w-full overflow-hidden select-none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <svg
              viewBox={`0 0 ${svgWidth} ${chartHeight}`}
              className="w-full h-auto cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
                const plotX = mouseX - padding.left;
                const idx = Math.floor(plotX / candleGap);
                if (idx >= 0 && idx < displayCandles.length) {
                  setHoveredIndex(idx);
                }
              }}
            >
              {/* Background horizontal grid lines & Price labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const price = minPrice + (maxPrice - minPrice) * (1 - pct);
                const y = padding.top + plotHeight * pct;
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={svgWidth - padding.right + 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                    >
                      {price.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Volume Bars at chart bottom */}
              {displayCandles.map((c, idx) => {
                const x = getCandleX(idx);
                const isGreen = c.close >= c.open;
                const volHeight = (c.volume / maxVolume) * 45;
                const y = chartHeight - padding.bottom - volHeight;
                return (
                  <rect
                    key={`vol-${idx}`}
                    x={x - candleWidth / 2}
                    y={y}
                    width={candleWidth}
                    height={volHeight}
                    fill={isGreen ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)'}
                  />
                );
              })}

              {/* Bollinger Bands Shaded Area */}
              {showBollinger && (
                <g>
                  {/* Upper line */}
                  <path
                    d={`M ${generatePath((c) => c.bollinger?.upper)}`}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  {/* Lower line */}
                  <path
                    d={`M ${generatePath((c) => c.bollinger?.lower)}`}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  {/* Middle 20 SMA */}
                  <path
                    d={`M ${generatePath((c) => c.bollinger?.middle)}`}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="1"
                  />
                </g>
              )}

              {/* Donchian Channel lines */}
              {showDonchian && (
                <g>
                  <path
                    d={`M ${generatePath((c) => c.donchian?.upper)}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                  <path
                    d={`M ${generatePath((c) => c.donchian?.lower)}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />
                </g>
              )}

              {/* VWAP line */}
              {showVWAP && (
                <g>
                  <path
                    d={`M ${generatePath((c) => c.vwap)}`}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                  <path
                    d={`M ${generatePath((c) => c.vwapUpper)}`}
                    fill="none"
                    stroke="rgba(244, 63, 94, 0.5)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <path
                    d={`M ${generatePath((c) => c.vwapLower)}`}
                    fill="none"
                    stroke="rgba(244, 63, 94, 0.5)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                </g>
              )}

              {/* Supertrend Band Line */}
              {showSupertrend && (
                <path
                  d={`M ${generatePath((c) => c.supertrend?.value)}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              )}

              {/* EMA 20 line */}
              {showEMA20 && (
                <path
                  d={`M ${generatePath((c) => c.ema20)}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
              )}

              {/* EMA 50 line */}
              {showEMA50 && (
                <path
                  d={`M ${generatePath((c) => c.ema50)}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
              )}

              {/* EMA 200 line */}
              {showEMA200 && (
                <path
                  d={`M ${generatePath((c) => c.ema200)}`}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="1.5"
                />
              )}

              {/* Candlesticks: Wicks and Bodies */}
              {displayCandles.map((c, idx) => {
                const x = getCandleX(idx);
                const isGreen = c.close >= c.open;
                const candleColor = isGreen ? '#10b981' : '#f43f5e';

                const highY = scaleY(c.high);
                const lowY = scaleY(c.low);
                const openY = scaleY(c.open);
                const closeY = scaleY(c.close);

                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(closeY - openY));

                return (
                  <g key={`candle-${idx}`}>
                    {/* Upper & Lower Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={candleColor}
                      strokeWidth="1.2"
                    />
                    {/* Real Candle Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="0.5"
                    />
                  </g>
                );
              })}

              {/* Trade Signal Execution Markers */}
              {showSignals && visibleTrades.map((t) => {
                const entryDisplayIdx = t.entryIndex - offsetIndex;
                const exitDisplayIdx = t.exitIndex - offsetIndex;

                return (
                  <g key={t.id}>
                    {/* Entry Marker (Green Triangle Up) */}
                    {entryDisplayIdx >= 0 && entryDisplayIdx < displayCandles.length && (
                      <g
                        transform={`translate(${getCandleX(entryDisplayIdx)}, ${scaleY(t.entryPrice) + 12})`}
                        className="cursor-pointer"
                        onClick={() => setSelectedTrade(t)}
                      >
                        <polygon
                          points="-5,0 5,0 0,-9"
                          fill="#10b981"
                          stroke="#022c22"
                          strokeWidth="1"
                        />
                        <circle cx="0" cy="5" r="3" fill="#10b981" />
                      </g>
                    )}

                    {/* Exit Marker (Red / Green Flag based on profit) */}
                    {exitDisplayIdx >= 0 && exitDisplayIdx < displayCandles.length && (
                      <g
                        transform={`translate(${getCandleX(exitDisplayIdx)}, ${scaleY(t.exitPrice) - 14})`}
                        className="cursor-pointer"
                        onClick={() => setSelectedTrade(t)}
                      >
                        <polygon
                          points="-5,0 5,0 0,9"
                          fill={t.pnlUsd >= 0 ? '#10b981' : '#f43f5e'}
                          stroke="#0f172a"
                          strokeWidth="1"
                        />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Crosshair Cursor & Highlight */}
              {hoveredIndex !== null && (
                <g>
                  {/* Vertical cursor line */}
                  <line
                    x1={getCandleX(hoveredIndex)}
                    y1={padding.top}
                    x2={getCandleX(hoveredIndex)}
                    y2={chartHeight - padding.bottom}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* Horizontal cursor line */}
                  {displayCandles[hoveredIndex] && (
                    <line
                      x1={padding.left}
                      y1={scaleY(displayCandles[hoveredIndex].close)}
                      x2={svgWidth - padding.right}
                      y2={scaleY(displayCandles[hoveredIndex].close)}
                      stroke="#64748b"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              )}

            </svg>
          </div>

          {/* Subchart Viewport: RSI / MACD / ADX / Equity Curve */}
          <div className="border-t border-slate-800 bg-slate-950/90 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Oscillator:</span>
                <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setSubChartTab('rsi')}
                    className={`px-2 py-0.5 rounded font-mono ${
                      subChartTab === 'rsi' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    RSI (14)
                  </button>
                  <button
                    onClick={() => setSubChartTab('macd')}
                    className={`px-2 py-0.5 rounded font-mono ${
                      subChartTab === 'macd' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    MACD (12,26,9)
                  </button>
                  <button
                    onClick={() => setSubChartTab('adx')}
                    className={`px-2 py-0.5 rounded font-mono ${
                      subChartTab === 'adx' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    ADX (14)
                  </button>
                  <button
                    onClick={() => setSubChartTab('equity')}
                    className={`px-2 py-0.5 rounded font-mono ${
                      subChartTab === 'equity' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Equity Curve
                  </button>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                {subChartTab === 'rsi' && activeCandle?.rsi && (
                  <span>RSI: <strong className={activeCandle.rsi > 70 ? 'text-rose-400' : activeCandle.rsi < 30 ? 'text-emerald-400' : 'text-indigo-300'}>{activeCandle.rsi}</strong></span>
                )}
                {subChartTab === 'macd' && activeCandle?.macd && (
                  <span>MACD: {activeCandle.macd.macd} | Hist: <strong className={activeCandle.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{activeCandle.macd.histogram}</strong></span>
                )}
              </div>
            </div>

            {/* Subchart SVG */}
            <div className="w-full h-24">
              <svg viewBox={`0 0 ${svgWidth} ${subChartHeight}`} className="w-full h-full">
                
                {/* RSI Subchart */}
                {subChartTab === 'rsi' && (
                  <g>
                    {/* Overbought 70 and Oversold 30 reference lines */}
                    <line x1={padding.left} y1={subChartHeight * 0.3} x2={svgWidth - padding.right} y2={subChartHeight * 0.3} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={padding.left} y1={subChartHeight * 0.7} x2={svgWidth - padding.right} y2={subChartHeight * 0.7} stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
                    <text x={svgWidth - padding.right + 4} y={subChartHeight * 0.3 + 3} fill="#f43f5e" fontSize="9" fontFamily="JetBrains Mono">70</text>
                    <text x={svgWidth - padding.right + 4} y={subChartHeight * 0.7 + 3} fill="#10b981" fontSize="9" fontFamily="JetBrains Mono">30</text>

                    {/* RSI Curve */}
                    <path
                      d={`M ${displayCandles.map((c, i) => {
                        const val = c.rsi || 50;
                        const y = subChartHeight - (val / 100) * subChartHeight;
                        return `${getCandleX(i)},${y}`;
                      }).join(' ')}`}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* MACD Subchart */}
                {subChartTab === 'macd' && (
                  <g>
                    <line x1={padding.left} y1={subChartHeight / 2} x2={svgWidth - padding.right} y2={subChartHeight / 2} stroke="#334155" strokeWidth="1" />
                    {displayCandles.map((c, i) => {
                      if (!c.macd) return null;
                      const h = c.macd.histogram * 10;
                      const isUp = h >= 0;
                      return (
                        <rect
                          key={i}
                          x={getCandleX(i) - 2}
                          y={isUp ? subChartHeight / 2 - h : subChartHeight / 2}
                          width="4"
                          height={Math.max(1, Math.abs(h))}
                          fill={isUp ? '#10b981' : '#f43f5e'}
                        />
                      );
                    })}
                  </g>
                )}

                {/* Equity Curve Subchart */}
                {subChartTab === 'equity' && metrics.equityCurve.length > 0 && (
                  <g>
                    {(() => {
                      const eqData = metrics.equityCurve.slice(-70);
                      const minEq = Math.min(...eqData.map((d) => d.equity));
                      const maxEq = Math.max(...eqData.map((d) => d.equity));
                      const pts = eqData.map((d, i) => {
                        const x = getCandleX(i);
                        const y = subChartHeight - ((d.equity - minEq) / ((maxEq - minEq) || 1)) * (subChartHeight - 16) - 8;
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <path d={`M ${pts}`} fill="none" stroke="#10b981" strokeWidth="2" />
                          <text x={padding.left + 4} y="15" fill="#10b981" fontSize="10" fontFamily="JetBrains Mono">
                            Final: ${metrics.netProfitUsd > 0 ? '+' : ''}{metrics.netProfitUsd.toLocaleString()} ({metrics.netProfitPct}%)
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}

              </svg>
            </div>
          </div>

        </div>

        {/* Right: 3 Cols - Backtest Execution Summary & Selected Trade Dossier */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Backtest KPI Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Strategy Performance
              </h4>
              <span className="text-[10px] text-indigo-400 font-mono font-semibold">
                {strategy.name.split(' ')[0]}
              </span>
            </div>

            <div className="space-y-3 mt-3">
              
              {/* Win Rate */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Win Rate</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {metrics.winRate}%
                </span>
              </div>

              {/* Net Profit */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Net Profit</span>
                <span className={`font-mono font-bold ${metrics.netProfitPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {metrics.netProfitPct >= 0 ? '+' : ''}{metrics.netProfitPct}% (${metrics.netProfitUsd.toLocaleString()})
                </span>
              </div>

              {/* Profit Factor */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Profit Factor</span>
                <span className="font-mono font-bold text-indigo-300">
                  {metrics.profitFactor}
                </span>
              </div>

              {/* Max Drawdown */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Max Drawdown</span>
                <span className="font-mono font-bold text-rose-400">
                  -{metrics.maxDrawdownPct}%
                </span>
              </div>

              {/* CAGR */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">CAGR</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{metrics.cagrPct}%
                </span>
              </div>

              {/* Sharpe & Sortino */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Sharpe / Sortino</span>
                <span className="font-mono text-slate-200">
                  {metrics.sharpeRatio} / {metrics.sortinoRatio}
                </span>
              </div>

              {/* Total Trades */}
              <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-2">
                <span className="text-slate-400">Total Trades</span>
                <span className="font-mono text-slate-200">
                  {metrics.totalTrades} ({metrics.winningTrades}W / {metrics.losingTrades}L)
                </span>
              </div>

            </div>
          </div>

          {/* Trade Execution Log / Selected Trade Details */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Execution Blotter
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {trades.length} Executed
              </span>
            </div>

            {selectedTrade ? (
              <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{selectedTrade.id}</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    selectedTrade.pnlUsd >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}>
                    {selectedTrade.pnlUsd >= 0 ? '+' : ''}{selectedTrade.pnlPct}%
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] space-y-1">
                  <div>Entry: <strong className="text-slate-200">${selectedTrade.entryPrice}</strong> ({selectedTrade.entryDate})</div>
                  <div>Exit: <strong className="text-slate-200">${selectedTrade.exitPrice}</strong> ({selectedTrade.exitDate})</div>
                  <div>PnL: <strong className={selectedTrade.pnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${selectedTrade.pnlUsd.toLocaleString()}</strong></div>
                  <div>Exit Reason: <strong className="text-indigo-300">{selectedTrade.exitReason}</strong></div>
                </div>
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 pt-1"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-1.5 max-h-[220px] overflow-y-auto">
                {trades.slice(-5).reverse().map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrade(t)}
                    className="p-2 rounded bg-slate-950/60 hover:bg-slate-800/60 transition-colors cursor-pointer text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-white flex items-center gap-1.5">
                        <span className={t.type === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.type}
                        </span>
                        <span className="text-slate-400 text-[10px]">{t.entryDate}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {t.exitReason} · {t.durationBars} bars
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className={t.pnlUsd >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {t.pnlUsd >= 0 ? '+' : ''}${t.pnlUsd}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {t.pnlPct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
