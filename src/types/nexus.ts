export type NavigationTab = 
  | 'dashboard'
  | 'signals'
  | 'scanner'
  | 'options'
  | 'watchlist'
  | 'strategies'
  | 'backtesting'
  | 'history'
  | 'settings';

export type SignalAction = 'BUY' | 'SELL' | 'WAIT';

export type MarketSegment = 
  | 'NSE_STOCK' 
  | 'INDEX_OPTION' 
  | 'STOCK_OPTION' 
  | 'MCX_COMMODITY';

export type TimeframeStyle = 'intraday' | 'swing' | 'positional';

export type SignalStatus = 
  | 'ACTIVE' 
  | 'TARGET 1 HIT' 
  | 'TARGET 2 HIT' 
  | 'TARGET 3 HIT' 
  | 'STOP LOSS HIT' 
  | 'WAITING TRIGGER' 
  | 'CANCELLED';

export interface NexusSignal {
  id: string; // e.g. "NX-1042"
  instrumentName: string; // e.g. "NIFTY 24200 CE", "RELIANCE", "CRUDEOIL NOV FUT"
  symbol: string; // e.g. "NIFTY", "RELIANCE", "CRUDEOIL"
  marketSegment: MarketSegment;
  segmentLabel: 'NSE Stock' | 'Index Option' | 'Stock Option' | 'MCX Commodity';
  action: SignalAction; // BUY, SELL, WAIT
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;
  riskRewardRatio: string; // e.g. "1:2.4"
  confidenceScore: number; // 0 - 100%
  strategyName: string;
  timeframe: '5m' | '15m' | '1h' | 'Daily';
  timeframeStyle: TimeframeStyle;
  generationTime: string; // e.g. "09:42:15 IST"
  status: SignalStatus;
  currentLtp: number;
  ltpChangePct: number;
  progressPct: number; // progress to Target 1
  isNew?: boolean;
  sizing: {
    capitalModel: number; // default ₹1,00,000
    riskBudget: number; // default ₹1,000 (1%)
    perShareRisk: number;
    calculatedQty: number; // floor(1000 / |Entry - Stop|)
    lotSize?: number;
    marginRequired?: number;
  };
  analysis: {
    entryRationale: string;
    technicalIndicators: {
      emaTrend: string;
      vwapRelation: string;
      rsiValue: number;
      rsiSignal: string;
      macdState: string;
      adxTrendStrength: number;
      supertrendState: string;
      bollingerBands: string;
      fibonacciLevel: string;
      supportResistance: string;
    };
    candlePattern: string;
    volumeAnalysis: string;
    marketTrend: string;
    riskFactors: string[];
    volatilityAtr: number;
    liquidityRating: 'High' | 'Medium' | 'Low';
  };
  optionsGreeks?: {
    strike: number;
    optionType: 'CE' | 'PE';
    expiry: string;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    iv: number;
    pcr: number;
    maxPain: number;
    premiumMomentum: 'Surging' | 'Steady' | 'Decaying';
  };
}

export interface MarketOverviewQuote {
  symbol: string;
  name: string;
  segment: string;
  ltp: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sparkline: number[];
}

export interface OptionStrikeRow {
  strike: number;
  ce: {
    ltp: number;
    change: number;
    changePct: number;
    oi: number;
    changeOi: number;
    volume: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    signal?: 'CE BUY' | 'CE SELL' | 'WAIT';
    signalConfidence?: number;
  };
  pe: {
    ltp: number;
    change: number;
    changePct: number;
    oi: number;
    changeOi: number;
    volume: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    signal?: 'PE BUY' | 'PE SELL' | 'WAIT';
    signalConfidence?: number;
  };
}

export interface OptionsChainOverview {
  underlyingSymbol: string;
  spotPrice: number;
  expiryDate: string;
  totalCeOi: number;
  totalPeOi: number;
  pcr: number;
  pcrSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  maxPainStrike: number;
  atmStrike: number;
  strikes: OptionStrikeRow[];
}

export interface SmartApiConfig {
  apiKey: string;
  clientCode: string;
  pin: string;
  totpSecret: string;
  feedMode: 'LIVE' | 'SIMULATION';
  status: 'LIVE' | 'DELAYED' | 'DISCONNECTED' | 'OFFLINE';
  lastPingTime?: string;
  sessionExpiry?: string;
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
  ema200?: number;
  vwap?: number;
  supertrend?: number;
}

export interface BacktestResult {
  symbol: string;
  instrumentName: string;
  strategyId: string;
  strategyName: string;
  timeframe: string;
  winRatePct: number;
  profitFactor: number;
  netProfit: number;
  maxDrawdownPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgRewardRisk: string;
  brokerageSlippage: number;
  equityCurve: { date: string; equity: number }[];
  trades: {
    id: string;
    date: string;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    exitPrice: number;
    exitDate: string;
    pnl: number;
    pnlPct: number;
    reason: 'TARGET 1' | 'TARGET 2' | 'TARGET 3' | 'STOP LOSS' | 'TIME STOP';
  }[];
}

export interface StrategyDefinition {
  id: string;
  name: string;
  category: 'Trend Following' | 'Breakout & Pullback' | 'Reversal & Price Action' | 'Volume & Volatility' | 'Options Flow & Greeks' | 'Multi-Factor Confluence';
  timeframe: string;
  description: string;
  indicatorsUsed: string[];
  entryCondition: string;
  exitCondition: string;
  winRate: number;
  profitFactor: number;
  confluenceRulesCount: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  segment: MarketSegment;
  currentPrice: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  volume: string;
  activeSignal?: SignalAction;
  signalConfidence?: number;
  sparkline: number[];
}
