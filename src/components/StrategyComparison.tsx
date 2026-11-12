import React, { useState } from 'react';
import { StrategyDefinition, StrategyCategory, TradingStyle } from '../types/trading';
import { 
  GitCompare, 
  Layers, 
  TrendingUp, 
  Flame, 
  RefreshCw, 
  Volume2, 
  BarChart, 
  Coins,
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';

interface StrategyComparisonProps {
  strategies: StrategyDefinition[];
  selectedStyle: TradingStyle;
  onSelectStrategyForTerminal: (strategyId: string) => void;
}

export const StrategyComparison: React.FC<StrategyComparisonProps> = ({
  strategies,
  selectedStyle,
  onSelectStrategyForTerminal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory | 'ALL'>('ALL');
  const [selectedForRadar, setSelectedForRadar] = useState<string[]>([
    'strat_dual_ema',
    'strat_donchian_breakout',
    'strat_rsi_divergence',
  ]);
  const [activeStrategyDetail, setActiveStrategyDetail] = useState<StrategyDefinition>(strategies[0]);

  // Categories list
  const categories: { id: StrategyCategory | 'ALL'; label: string; icon: any }[] = [
    { id: 'ALL', label: 'All 14 Strategies', icon: Layers },
    { id: 'trend_momentum', label: 'Trend & Momentum', icon: TrendingUp },
    { id: 'breakout_pullback', label: 'Breakout & Pullback', icon: Flame },
    { id: 'reversal_price_action', label: 'Reversal & Price Action', icon: RefreshCw },
    { id: 'volume_volatility', label: 'Volume & Volatility', icon: Volume2 },
    { id: 'relative_strength', label: 'Relative Strength', icon: BarChart },
    { id: 'options_chain', label: 'Options-Chain Analysis', icon: Coins },
  ];

  const filteredStrategies = selectedCategory === 'ALL'
    ? strategies
    : strategies.filter((s) => s.category === selectedCategory);

  // Toggle selection for radar comparison
  const toggleRadarStrategy = (id: string) => {
    if (selectedForRadar.includes(id)) {
      if (selectedForRadar.length > 1) {
        setSelectedForRadar(selectedForRadar.filter((s) => s !== id));
      }
    } else {
      if (selectedForRadar.length < 3) {
        setSelectedForRadar([...selectedForRadar, id]);
      } else {
        setSelectedForRadar([selectedForRadar[1], selectedForRadar[2], id]);
      }
    }
  };

  // Radar chart metrics
  const radarDimensions = [
    { key: 'winRate', label: 'Win Rate' },
    { key: 'profitFactor', label: 'Profit Factor' },
    { key: 'drawdownControl', label: 'DD Control' },
    { key: 'riskReward', label: 'Risk/Reward' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'consistency', label: 'Consistency' },
  ];

  // Helper to calculate radar SVG points
  const getRadarPolygon = (scores: Record<string, number>, radius: number = 100, cx: number = 125, cy: number = 125) => {
    const total = radarDimensions.length;
    return radarDimensions
      .map((dim, idx) => {
        const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
        const val = (scores[dim.key] || 50) / 100;
        const r = radius * val;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Color palette for radar items
  const radarColors = [
    { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.25)', label: 'Indigo' },
    { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.25)', label: 'Emerald' },
    { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', label: 'Amber' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Strategy Leaderboard Table & Radar Comparison Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 8 Cols - Strategy Matrix Table */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-indigo-400" />
                  13 Algorithmic Strategies Comparison Matrix
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any strategy to inspect rules or select up to 3 for radar overlay
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                Style: <strong className="text-indigo-400 capitalize">{selectedStyle}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-slate-950/60 font-semibold">
                    <th className="py-3 px-3 w-8">Radar</th>
                    <th className="py-3 px-4">Strategy Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Win Rate</th>
                    <th className="py-3 px-3 text-right">Profit Factor</th>
                    <th className="py-3 px-3 text-right">DD Control</th>
                    <th className="py-3 px-3 text-right">Risk/Reward</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStrategies.map((strat) => {
                    const isSelected = selectedForRadar.includes(strat.id);
                    const isDetailed = activeStrategyDetail.id === strat.id;

                    return (
                      <tr
                        key={strat.id}
                        onClick={() => setActiveStrategyDetail(strat)}
                        className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                          isDetailed ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Radar Checkbox */}
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRadarStrategy(strat.id)}
                            className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Name */}
                        <td className="py-2.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{strat.name}</span>
                          </div>
                        </td>

                        {/* Category Label */}
                        <td className="py-2.5 px-3 text-[11px] text-slate-400">
                          {strat.categoryLabel}
                        </td>

                        {/* Scores */}
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                          {strat.radarScores.winRate}%
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-indigo-300 font-semibold">
                          {(strat.radarScores.profitFactor / 35).toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-sky-400">
                          {strat.radarScores.drawdownControl}/100
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-purple-400">
                          1:{(strat.radarScores.riskReward / 35).toFixed(1)}
                        </td>

                        {/* Terminal Action */}
                        <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectStrategyForTerminal(strat.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded transition-colors whitespace-nowrap"
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Showing {filteredStrategies.length} strategy models</span>
            <span>Check boxes above to overlay on radar comparison</span>
          </div>
        </div>

        {/* Right: 4 Cols - Interactive Radar & Profile Comparison */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Strategy Profile Radar
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedForRadar.length} / 3 Selected
              </span>
            </div>

            {/* Radar SVG Diagram */}
            <div className="relative w-full aspect-square max-w-[280px] mx-auto my-2 flex items-center justify-center">
              <svg viewBox="0 0 250 250" className="w-full h-full">
                {/* Background Web Polygons */}
                {[0.25, 0.5, 0.75, 1.0].map((scale, i) => {
                  const points = radarDimensions
                    .map((_, idx) => {
                      const angle = (Math.PI * 2 / radarDimensions.length) * idx - Math.PI / 2;
                      const r = 90 * scale;
                      return `${125 + r * Math.cos(angle)},${125 + r * Math.sin(angle)}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={i}
                      points={points}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray={scale === 1 ? 'none' : '2 2'}
                    />
                  );
                })}

                {/* Axis Spoke Lines */}
                {radarDimensions.map((dim, idx) => {
                  const angle = (Math.PI * 2 / radarDimensions.length) * idx - Math.PI / 2;
                  const x = 125 + 90 * Math.cos(angle);
                  const y = 125 + 90 * Math.sin(angle);
                  return (
                    <line
                      key={dim.key}
                      x1="125"
                      y1="125"
                      x2={x}
                      y2={y}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Dimension Labels */}
                {radarDimensions.map((dim, idx) => {
                  const angle = (Math.PI * 2 / radarDimensions.length) * idx - Math.PI / 2;
                  const x = 125 + 110 * Math.cos(angle);
                  const y = 125 + 110 * Math.sin(angle);
                  return (
                    <text
                      key={dim.key}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[9px] fill-slate-400 font-mono font-medium"
                    >
                      {dim.label}
                    </text>
                  );
                })}

                {/* Strategy Polygons */}
                {selectedForRadar.map((id, index) => {
                  const strat = strategies.find((s) => s.id === id);
                  if (!strat) return null;
                  const color = radarColors[index % radarColors.length];
                  const points = getRadarPolygon(strat.radarScores, 90, 125, 125);

                  return (
                    <polygon
                      key={id}
                      points={points}
                      fill={color.fill}
                      stroke={color.stroke}
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Radar Legends */}
            <div className="space-y-2 mt-4 pt-3 border-t border-slate-800">
              {selectedForRadar.map((id, index) => {
                const strat = strategies.find((s) => s.id === id);
                if (!strat) return null;
                const color = radarColors[index % radarColors.length];
                return (
                  <div key={id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color.stroke }}
                      />
                      <span className="text-slate-200 truncate font-medium">
                        {strat.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      WR: {strat.radarScores.winRate}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onSelectStrategyForTerminal(activeStrategyDetail.id)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Analyze {activeStrategyDetail.name.split(' ')[0]} in Terminal
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Selected Strategy Deep-Dive Dossier */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                {activeStrategyDetail.categoryLabel}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">
                Recommended: <strong className="text-white capitalize">{activeStrategyDetail.recommendedStyle}</strong>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">
                {activeStrategyDetail.timeframeLabel}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {activeStrategyDetail.name}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {activeStrategyDetail.description}
            </p>
          </div>

          <button
            onClick={() => onSelectStrategyForTerminal(activeStrategyDetail.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shrink-0 self-start md:self-center shadow-md shadow-emerald-950/40"
          >
            Launch on Live Chart
          </button>
        </div>

        {/* 3-Column Architectural Specs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          
          {/* Col 1: Quantitative Entry Rules */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Quantitative Entry Trigger</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {activeStrategyDetail.entryRule}
            </p>
          </div>

          {/* Col 2: Risk Management & Exit Protocol */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-2">
              <Info className="w-4 h-4" />
              <span>Exit & Risk Protocol</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {activeStrategyDetail.exitRule}
            </p>
          </div>

          {/* Col 3: Optimal Market Regime & Concept */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Optimal Market Regime</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeStrategyDetail.bestRegime}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-300">Underlying Edge:</strong> {activeStrategyDetail.concept}
            </div>
          </div>

        </div>

        {/* Strategy Parameters */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold text-slate-400">Algorithmic Parameters:</span>
          {activeStrategyDetail.parameters.map((param) => (
            <div key={param.name} className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs flex items-center gap-2">
              <span className="text-slate-400">{param.name}:</span>
              <span className="text-white font-mono font-semibold">
                {param.default} {param.unit || ''}
              </span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
