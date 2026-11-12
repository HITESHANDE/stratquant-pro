export type TradingStyle = 'intraday' | 'swing' | 'positional';
export type Market = 'US' | 'INDIA';

export type StrategyCategory = 
  | 'trend_momentum'
  | 'breakout_pullback'
  | 'reversal_price_action'
  | 'volume_volatility'
  | 'relative_strength'
  | 'options_chain';

export type NewsCategory = 'results' | 'announcement' | 'sector' | 'macro';
export type NewsSentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export interface StockNews {
  id: string;
  symbol: string;
  title: string;
  category: NewsCategory;
  sentiment: NewsSentiment;
  impactScore: number; // 1-100
  date: string;
  summary: string;
  source: string;
}

export type CandlestickPattern = 
  | 'BULLISH_ENGULFING'
  | 'BEARISH_ENGULFING'
  | 'HAMMER'
  | 'SHOOTING_STAR'
  | 'DOJI'
  | 'MORNING_STAR'
  | 'EVENING_STAR'
  | 'BREAKOUT_CANDLE'
  | 'NONE';

export type OIBuildupType = 'LONG_BUILDUP' | 'SHORT_BUILDUP' | 'SHORT_COVERING' | 'LONG_UNWINDING';

export interface Candle {
  timestamp: string;
  time: number; // Unix timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Computed indicators
  ema9?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  supertrend?: {
    value: number;
    direction: 1 | -1; // 1 = Bullish (below price), -1 = Bearish (above price)
  };
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  donchian?: {
    upper: number;
    lower: number;
    middle: number;
  };
  vwap?: number;
  vwapUpper?: number;
  vwapLower?: number;
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  adx?: {
    adx: number;
    plusDI: number;
    minusDI: number;
  };
  atr?: number;
  relativeStrength?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  strategyId: string;
  strategyName: string;
  style: TradingStyle;
  type: 'LONG' | 'SHORT';
  entryIndex: number;
  entryDate: string;
  entryPrice: number;
  exitIndex: number;
  exitDate: string;
  exitPrice: number;
  quantity: number;
  pnlUsd: number;
  pnlPct: number;
  exitReason: 'TARGET_HIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'SIGNAL_REVERSAL' | 'SESSION_CLOSE';
  durationBars: number;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // in %
  netProfitUsd: number;
  netProfitPct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  cagrPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  avgTradePct: number;
  avgTradeUsd: number;
  maxConsecutiveLosses: number;
  avgHoldBars: number;
  equityCurve: { date: string; equity: number; drawdown: number }[];
}

export interface StrategyDefinition {
  id: string;
  name: string;
  category: StrategyCategory;
  categoryLabel: string;
  recommendedStyle: TradingStyle;
  timeframeLabel: string;
  description: string;
  concept: string;
  entryRule: string;
  exitRule: string;
  bestRegime: string;
  parameters: { name: string; default: number; min: number; max: number; step: number; unit?: string }[];
  radarScores: {
    winRate: number; // 0-100
    profitFactor: number; // 0-100
    drawdownControl: number; // 0-100
    riskReward: number; // 0-100
    frequency: number; // 0-100
    consistency: number; // 0-100
  };
}

export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  market: Market;
  currencySymbol: '$' | '₹';
  currentPrice: number;
  changeDayPct: number;
  volume24h: string;
  marketCap: string;
  beta: number;
  avgVolume: string;
  deliveryPct: number;
  lotSize?: number;
}

export interface MultiFactorSignal {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  currencySymbol: '$' | '₹';
  direction: 'BUY' | 'SELL';
  triggerPrice: number; // Exact trigger point
  stopLoss: number;     // Accurate stop loss
  target1: number;      // Target 1
  target2: number;      // Target 2
  riskPerShare: number;
  riskRewardRatio: number; // e.g. 1:2.5
  confluenceScore: number; // out of 5 (News, Candle, Volume, Trend, F&O)
  confluencePct: number;
  isZeroLossGrade: boolean; // All 5 factors confirmed without contradiction
  status: 'TRIGGERED' | 'WAITING_TRIGGER' | 'ACTIVE';
  factors: {
    news: { confirmed: boolean; sentiment: NewsSentiment; detail: string };
    candlestick: { confirmed: boolean; pattern: CandlestickPattern; detail: string };
    volume: { confirmed: boolean; rvol: number; deliveryPct: number; detail: string };
    trend: { confirmed: boolean; emaStack: string; rsi: number; detail: string };
    fno: { confirmed: boolean; buildup: OIBuildupType; pcr: number; detail: string };
  };
  timestamp: string;
}

export interface StockRankingRow {
  stock: StockInfo;
  metrics: BacktestMetrics;
  bestStrategyId: string;
  bestStrategyName: string;
  currentSignal: 'BUY' | 'SELL' | 'HOLD';
  signalConfidence: number; // 0-100%
}

export interface OptionStrike {
  strike: number;
  // Calls
  callOI: number;
  callChangeOI: number;
  callVol: number;
  callIV: number;
  callLtp: number;
  callBid: number;
  callAsk: number;
  callDelta: number;
  callGamma: number;
  // Puts
  putLtp: number;
  putBid: number;
  putAsk: number;
  putDelta: number;
  putGamma: number;
  putIV: number;
  putVol: number;
  putChangeOI: number;
  putOI: number;
  // Loss for Max Pain calculation
  totalLossAtStrike?: number;
}

export interface OptionsChainData {
  symbol: string;
  spotPrice: number;
  expiryDate: string;
  daysToExpiry: number;
  maxPainStrike: number;
  putCallRatio: number;
  totalCallOI: number;
  totalPutOI: number;
  highestCallOIStrike: number;
  highestPutOIStrike: number;
  strikes: OptionStrike[];
}

export interface ScannerSignal {
  id: string;
  symbol: string;
  stockName: string;
  strategyId: string;
  strategyName: string;
  category: StrategyCategory;
  style: TradingStyle;
  signal: 'BUY' | 'SELL';
  price: number;
  stopLoss: number;
  targetPrice: number;
  riskRewardRatio: number;
  timestamp: string;
  rationale: string;
}

export interface StrategySatisfaction {
  strategy: StrategyDefinition;
  isSatisfied: boolean;
  signalType: 'BUY' | 'HOLD' | 'SHORT';
  entryPrice: number;
  stopLossPrice: number;
  targetPrice: number;
  rationale: string;
}

export interface ConfluenceStockResult {
  stock: StockInfo;
  style: TradingStyle;
  satisfiedCount: number;
  totalStrategies: number;
  satisfactionPct: number;
  grade: 'AAA' | 'AA' | 'A' | 'B';
  satisfiedStrategies: StrategySatisfaction[];
  avgWinRate: number;
  avgProfitFactor: number;
  recommendedEntry: number;
  recommendedStopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
}

export interface PortfolioPosition {
  id: string;
  symbol: string;
  strategyName: string;
  style: TradingStyle;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  shares: number;
  stopLoss: number;
  targetPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  entryDate: string;
}

export type TradeXSignalType = 'CASH_BUY' | 'CASH_SELL' | 'OPTIONS_BUY' | 'OPTIONS_SELL';
export type TradeXSentiment = 'Bullish' | 'Bearish';
export type TradeXPriority = 'High' | 'Medium' | 'Low';
export type TradeXOpportunityTag = 
  | 'SWING OPPORTUNITY' 
  | 'INTRADAY OPPORTUNITY' 
  | 'OPTIONS BUY (CE)' 
  | 'OPTIONS BUY (PE)' 
  | 'OPTIONS SELL (CE WRITING)' 
  | 'OPTIONS SELL (PE WRITING)'
  | 'POSITIONAL OPPORTUNITY';

export interface TradeXSignal {
  id: string;
  avatar: string; // e.g. "CR", "PO", "RE", "NI", "BN"
  symbol: string; // e.g. "CRUDEOIL NOV FUT", "POLICYBZR", "RELIANCE"
  name: string;
  exchange: 'NSE' | 'MCX' | 'NFO';
  market: Market;
  currencySymbol: '$' | '₹';
  signalType: TradeXSignalType;
  sentiment: TradeXSentiment;
  priority: TradeXPriority;
  timeStr: string; // "17:56"
  elapsedStr: string; // "1 h ago"
  dateHeader: string; // "Today Tue, 03 Nov, 2026"
  triggerCondition: string; // "Below 9,200" or "Above 1,750"
  triggerLabel: 'Buy trigger' | 'Sell trigger';
  triggerPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  timeStop: string;
  invalidationCondition: string;
  opportunityTag: TradeXOpportunityTag;
  style: TradingStyle;
  score: number; // 0-100 based on PDF specification
  scoreBand: 'Strong candidate' | 'Confirmation candidate' | 'Watchlist' | 'NO TRADE';
  scoreBreakdown: {
    priceAction: number; // Max 20
    candlestick: number; // Max 15
    volume: number;      // Max 15
    fno: number;         // Max 15
    indicators: number;  // Max 10
    news: number;        // Max 10
    marketTrend: number; // Max 10
    sectorStrength: number; // Max 5
  };
  sizing: {
    capital: number;       // ₹1,00,000
    riskPct: number;       // 1.0%
    riskBudget: number;    // ₹1,000
    perShareRisk: number;  // |Entry - Stop|
    calculatedQty: number; // floor(riskBudget / perShareRisk)
    lotSize?: number;
    contractLots?: number;
    marginRequired?: number;
  };
  evidence: {
    candlePattern: string;
    trendStatus: string;
    volumeStatus: string;
    fnoBuildup: string;
    indicatorsDetail: string;
    newsDetail: string;
    noTradeReason?: string;
  };
  optionsDetail?: {
    optionType: 'CE' | 'PE';
    strike: number;
    expiry: string;
    action: 'BUY' | 'SELL';
    premium: number;
    iv: number;
    delta: number;
    gamma: number;
    theta: number;
    pcr: number;
    maxPain: number;
    breakeven: number;
  };
  strategyName?: string;
  currentLtp?: number;
  status?: 'TRIGGERED' | 'PENDING' | 'TARGET_HIT' | 'STOP_HIT' | 'COMPLETED' | 'ADVERSE_WARNING';
  progressPct?: number;
  isNew?: boolean;
  exitPrice?: number;
  completedAt?: string;
  realizedPnl?: number;
  adverseDetail?: {
    isOpposite: boolean;
    adversePoints: number;
    adversePct: number;
    warningTitle: string;
    stopLossGuard: string;
    workingPlan: string;
    hedgingAction: string;
  };
}
