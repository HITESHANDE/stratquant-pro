import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BarChart2, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Calculator,
  Compass,
  Zap,
  Info
} from 'lucide-react';
import { NexusSignal } from '../types/nexus';

interface SignalDetailModalProps {
  signal: NexusSignal | null;
  onClose: () => void;
}

export const SignalDetailModal: React.FC<SignalDetailModalProps> = ({
  signal,
  onClose,
}) => {
  if (!signal) return null;

  const isBuy = signal.action === 'BUY';
  const isSell = signal.action === 'SELL';
  const isWait = signal.action === 'WAIT';

  const actionBg = isBuy 
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
    : isSell 
    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
    : 'bg-amber-500/20 text-amber-400 border-amber-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-[#0B1222] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#070B14]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {signal.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {signal.instrumentName}
                </h2>
                <span className={`px-2 py-0.5 rounded text-xs font-extrabold uppercase tracking-wide border ${actionBg}`}>
                  {signal.action}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {signal.segmentLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Generated: {signal.generationTime}
                </span>
                <span>·</span>
                <span className="capitalize">{signal.timeframeStyle} ({signal.timeframe})</span>
                <span>·</span>
                <span className="text-indigo-400 font-medium">{signal.strategyName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-200 text-sm">
          
          {/* Key Trading Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Entry */}
            <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800/80">
              <span className="text-[11px] text-slate-400 uppercase font-medium">Entry Price</span>
              <div className="text-base font-mono font-bold text-white mt-1">
                ₹{signal.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400">Trigger Point</span>
            </div>

            {/* Stop Loss */}
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
              <span className="text-[11px] text-rose-300 uppercase font-medium">Stop Loss</span>
              <div className="text-base font-mono font-bold text-rose-400 mt-1">
                ₹{signal.stopLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-rose-300/70 font-mono">
                Risk: ₹{Math.abs(signal.entryPrice - signal.stopLoss).toFixed(2)}
              </span>
            </div>

            {/* Target 1 */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 uppercase font-medium">Target 1</span>
              <div className="text-base font-mono font-bold text-emerald-400 mt-1">
                ₹{signal.target1.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono">T1 (50% Book)</span>
            </div>

            {/* Target 2 */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 uppercase font-medium">Target 2</span>
              <div className="text-base font-mono font-bold text-emerald-400 mt-1">
                ₹{signal.target2.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono">T2 (Trail Stop)</span>
            </div>

            {/* Target 3 */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 uppercase font-medium">Target 3</span>
              <div className="text-base font-mono font-bold text-emerald-400 mt-1">
                ₹{signal.target3.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono">T3 (Runner)</span>
            </div>

            {/* Risk / Reward & Confidence */}
            <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30">
              <span className="text-[11px] text-indigo-300 uppercase font-medium">R:R & AI Conf</span>
              <div className="text-base font-mono font-bold text-indigo-400 mt-1">
                {signal.riskRewardRatio}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                {signal.confidenceScore}% Confluence
              </span>
            </div>

          </div>

          {/* Position Sizing & Institutional Risk Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-white text-sm">
                  Smart Risk Sizing Model (₹1,00,000 Portfolio)
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                Strict 1.0% Max Risk Enforced
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded bg-[#070B14]/80 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Capital Base:</span>
                <div className="font-mono font-semibold text-white mt-0.5">₹1,00,000</div>
              </div>
              <div className="p-2.5 rounded bg-[#070B14]/80 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Max Capital at Risk:</span>
                <div className="font-mono font-semibold text-rose-400 mt-0.5">₹1,000 (1%)</div>
              </div>
              <div className="p-2.5 rounded bg-[#070B14]/80 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Calculated Quantity:</span>
                <div className="font-mono font-semibold text-indigo-300 mt-0.5">
                  {signal.sizing.calculatedQty} {signal.sizing.lotSize && signal.sizing.lotSize > 1 ? `(${signal.sizing.lotSize}/lot)` : 'shares'}
                </div>
              </div>
              <div className="p-2.5 rounded bg-[#070B14]/80 border border-slate-800">
                <span className="text-slate-400 text-[11px]">Estimated Margin:</span>
                <div className="font-mono font-semibold text-slate-200 mt-0.5">
                  ₹{signal.sizing.marginRequired?.toLocaleString('en-IN') || '45,000'}
                </div>
              </div>
            </div>
          </div>

          {/* AI Entry Rationale */}
          <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
              <Zap className="w-4 h-4" />
              <span>AI Multi-Factor Entry Rationale</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {signal.analysis.entryRationale}
            </p>
          </div>

          {/* Technical Indicators Confluence Matrix */}
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Technical Indicators Confluence Matrix</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800 space-y-2">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">EMA Trend Stack (9/21/50/200):</span>
                  <span className="font-medium text-slate-200">{signal.analysis.technicalIndicators.emaTrend}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Session VWAP Relation:</span>
                  <span className="font-medium text-slate-200">{signal.analysis.technicalIndicators.vwapRelation}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">RSI (14-period):</span>
                  <span className="font-mono font-semibold text-indigo-300">
                    {signal.analysis.technicalIndicators.rsiValue} · {signal.analysis.technicalIndicators.rsiSignal}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">MACD (12,26,9):</span>
                  <span className="font-medium text-slate-200">{signal.analysis.technicalIndicators.macdState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ADX Trend Strength:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {signal.analysis.technicalIndicators.adxTrendStrength} (Strong Trend &gt; 25)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800 space-y-2">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Supertrend Posture:</span>
                  <span className="font-medium text-slate-200">{signal.analysis.technicalIndicators.supertrendState}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Bollinger Bands:</span>
                  <span className="font-medium text-slate-200">{signal.analysis.technicalIndicators.bollingerBands}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Fibonacci Alignment:</span>
                  <span className="font-medium text-slate-200">{signal.analysis.technicalIndicators.fibonacciLevel}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Horizontal S&R:</span>
                  <span className="font-medium text-slate-200">{signal.analysis.technicalIndicators.supportResistance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volatility (ATR 14):</span>
                  <span className="font-mono font-medium text-amber-400">
                    ₹{signal.analysis.volatilityAtr.toFixed(2)} · Liquidity: {signal.analysis.liquidityRating}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Candlestick & Volume Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-[#070B14] border border-slate-800">
              <span className="font-semibold text-indigo-400 block mb-1">Candlestick & Price Action</span>
              <p className="text-slate-300 leading-relaxed">{signal.analysis.candlePattern}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#070B14] border border-slate-800">
              <span className="font-semibold text-indigo-400 block mb-1">Volume & Delivery Flow</span>
              <p className="text-slate-300 leading-relaxed">{signal.analysis.volumeAnalysis}</p>
            </div>
          </div>

          {/* Options Greeks (if Options Signal) */}
          {signal.optionsGreeks && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-400" />
                  Derivative Option Greeks & Flow (Strike {signal.optionsGreeks.strike} {signal.optionsGreeks.optionType})
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Expiry: {signal.optionsGreeks.expiry}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-center text-xs">
                <div className="p-2 rounded bg-[#070B14] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Delta (Δ)</div>
                  <div className="text-sm font-bold text-white mt-0.5">{signal.optionsGreeks.delta}</div>
                </div>
                <div className="p-2 rounded bg-[#070B14] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Gamma (Γ)</div>
                  <div className="text-sm font-bold text-white mt-0.5">{signal.optionsGreeks.gamma}</div>
                </div>
                <div className="p-2 rounded bg-[#070B14] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Theta (Θ)</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">{signal.optionsGreeks.theta}</div>
                </div>
                <div className="p-2 rounded bg-[#070B14] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Vega (ν)</div>
                  <div className="text-sm font-bold text-white mt-0.5">{signal.optionsGreeks.vega}</div>
                </div>
                <div className="p-2 rounded bg-[#070B14] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Implied Vol (IV)</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{signal.optionsGreeks.iv}%</div>
                </div>
                <div className="p-2 rounded bg-[#070B14] border border-slate-800">
                  <div className="text-[10px] text-slate-400">PCR Ratio</div>
                  <div className="text-sm font-bold text-indigo-400 mt-0.5">{signal.optionsGreeks.pcr}</div>
                </div>
                <div className="p-2 rounded bg-[#070B14] border border-slate-800">
                  <div className="text-[10px] text-slate-400">Max Pain</div>
                  <div className="text-sm font-bold text-white mt-0.5">{signal.optionsGreeks.maxPain}</div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Factors & Adverse Conditions */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Identified Market Risk Factors</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-200/90 list-disc list-inside">
              {signal.analysis.riskFactors.map((rf, idx) => (
                <li key={idx} className="leading-relaxed">{rf}</li>
              ))}
            </ul>
          </div>

          {/* Regulatory Disclaimer */}
          <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Signals-Only System Notice:</span> Nexus AI Trading Signals generates algorithmic setups based on mathematical indicators, candlestick patterns, and derivative order flow. It does not execute automatic trades. Always review trade parameters and consult your registered financial advisor before committing capital.
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#070B14] flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Current LTP: <span className="font-bold text-white">₹{signal.currentLtp.toFixed(2)}</span> ({signal.ltpChangePct >= 0 ? '+' : ''}{signal.ltpChangePct.toFixed(2)}%)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            Close Analysis
          </button>
        </div>

      </div>
    </div>
  );
};
