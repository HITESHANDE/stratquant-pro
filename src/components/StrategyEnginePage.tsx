import React, { useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Zap, 
  Filter,
  BarChart2
} from 'lucide-react';
import { StrategyDefinition } from '../types/nexus';

interface StrategyEnginePageProps {
  strategies: StrategyDefinition[];
}

export const StrategyEnginePage: React.FC<StrategyEnginePageProps> = ({
  strategies,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    'ALL',
    'Trend Following',
    'Breakout & Pullback',
    'Reversal & Price Action',
    'Volume & Volatility',
    'Options Flow & Greeks'
  ];

  const filteredStrategies = selectedCategory === 'ALL'
    ? strategies
    : strategies.filter((s) => s.category === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="bg-[#0B1222] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Multi-Factor Strategy Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Institutional algorithmic architecture. The engine executes multi-factor validation across 13 distinct strategies before publishing any live signal.
          </p>
        </div>

        {/* Confluence Rule Chip */}
        <div className="px-3.5 py-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <div>
            <div className="font-bold text-white">Multi-Strategy Rule</div>
            <div className="text-[11px] text-slate-300">Min 3 Confluences Required</div>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-[#0B1222] border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStrategies.map((strat) => (
          <div
            key={strat.id}
            className="p-5 rounded-xl bg-[#0B1222] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800">
                    {strat.category}
                  </span>
                  <h3 className="font-bold text-white text-base mt-2 group-hover:text-indigo-400 transition-colors">
                    {strat.name}
                  </h3>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {strat.winRate}% Win
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    PF: <span className="font-semibold text-slate-200">{strat.profitFactor}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                {strat.description}
              </p>

              {/* Indicators Used */}
              <div className="mt-3 flex flex-wrap items-center gap-1">
                {strat.indicatorsUsed.map((ind, i) => (
                  <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#070B14] text-slate-300 border border-slate-800">
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            {/* Entry / Exit Condition Box */}
            <div className="space-y-2 pt-3 border-t border-slate-800/80 text-[11px]">
              <div>
                <span className="font-semibold text-emerald-400 uppercase text-[10px]">Entry Logic:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{strat.entryCondition}</p>
              </div>
              <div>
                <span className="font-semibold text-rose-400 uppercase text-[10px]">Exit Logic:</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{strat.exitCondition}</p>
              </div>
            </div>

            {/* Confluence Rating */}
            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Timeframe: <strong className="text-slate-200">{strat.timeframe}</strong></span>
              <span className="text-indigo-300">{strat.confluenceRulesCount} Confluence Rules</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
