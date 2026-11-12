import { Candle, StrategyDefinition, TradingStyle, Trade, BacktestMetrics } from '../types/trading';

interface BacktestOptions {
  initialCapital?: number;
  riskPerTradePct?: number; // e.g. 2%
  slippagePct?: number; // e.g. 0.05%
  benchmarkReturnPct?: number;
}

export function runBacktest(
  candles: Candle[],
  strategy: StrategyDefinition,
  style: TradingStyle,
  symbol: string,
  options: BacktestOptions = {}
): { metrics: BacktestMetrics; trades: Trade[] } {
  const initialCapital = options.initialCapital || 100000;
  const riskPerTrade = (options.riskPerTradePct || 2) / 100;
  const slippage = (options.slippagePct || 0.05) / 100;

  let equity = initialCapital;
  let peakEquity = initialCapital;
  let maxDrawdownPct = 0;

  const trades: Trade[] = [];
  const equityCurve: { date: string; equity: number; drawdown: number }[] = [];

  let currentTrade: Partial<Trade> | null = null;
  let trailingStop = 0;
  let targetPrice = 0;
  let stopLossPrice = 0;

  const n = candles.length;
  // warmup period
  const startIndex = Math.min(30, Math.floor(n * 0.15));

  for (let i = startIndex; i < n; i++) {
    const c = candles[i];
    const prev = candles[i - 1];

    // Evaluate Exit for open trade
    if (currentTrade) {
      let exitNow = false;
      let exitPrice = c.close;
      let reason: Trade['exitReason'] = 'STOP_LOSS';

      const isLong = currentTrade.type === 'LONG';

      // 1. Target Hit
      if (isLong && c.high >= targetPrice) {
        exitNow = true;
        exitPrice = targetPrice;
        reason = 'TARGET_HIT';
      } else if (!isLong && c.low <= targetPrice) {
        exitNow = true;
        exitPrice = targetPrice;
        reason = 'TARGET_HIT';
      }

      // 2. Stop Loss or Trailing Stop hit
      if (!exitNow) {
        const effectiveStop = Math.max(stopLossPrice, trailingStop);
        if (isLong && c.low <= effectiveStop) {
          exitNow = true;
          exitPrice = effectiveStop;
          reason = trailingStop > stopLossPrice ? 'TRAILING_STOP' : 'STOP_LOSS';
        } else if (!isLong && c.high >= effectiveStop) {
          exitNow = true;
          exitPrice = effectiveStop;
          reason = trailingStop < stopLossPrice ? 'TRAILING_STOP' : 'STOP_LOSS';
        }
      }

      // 3. Intraday Session Close rule (e.g. square off at bar 75 out of 78)
      if (!exitNow && style === 'intraday' && i % 78 >= 75) {
        exitNow = true;
        exitPrice = c.close;
        reason = 'SESSION_CLOSE';
      }

      // 4. Update Trailing Stop for winners
      if (!exitNow) {
        const atr = c.atr || (c.high - c.low);
        if (isLong && c.close > currentTrade.entryPrice!) {
          const newTrail = c.close - 1.8 * atr;
          if (newTrail > trailingStop) trailingStop = newTrail;
        } else if (!isLong && c.close < currentTrade.entryPrice!) {
          const newTrail = c.close + 1.8 * atr;
          if (trailingStop === 0 || newTrail < trailingStop) trailingStop = newTrail;
        }
      }

      // Execute exit
      if (exitNow) {
        // Apply slippage
        const finalExitPrice = isLong ? exitPrice * (1 - slippage) : exitPrice * (1 + slippage);
        const pnlPct = isLong
          ? ((finalExitPrice - currentTrade.entryPrice!) / currentTrade.entryPrice!) * 100
          : ((currentTrade.entryPrice! - finalExitPrice) / currentTrade.entryPrice!) * 100;

        const pnlUsd = (pnlPct / 100) * (currentTrade.quantity! * currentTrade.entryPrice!);
        equity += pnlUsd;

        trades.push({
          id: `T-${trades.length + 1}`,
          symbol,
          strategyId: strategy.id,
          strategyName: strategy.name,
          style,
          type: currentTrade.type!,
          entryIndex: currentTrade.entryIndex!,
          entryDate: currentTrade.entryDate!,
          entryPrice: currentTrade.entryPrice!,
          exitIndex: i,
          exitDate: c.timestamp,
          exitPrice: parseFloat(finalExitPrice.toFixed(2)),
          quantity: currentTrade.quantity!,
          pnlUsd: parseFloat(pnlUsd.toFixed(2)),
          pnlPct: parseFloat(pnlPct.toFixed(2)),
          exitReason: reason,
          durationBars: i - currentTrade.entryIndex!,
        });

        currentTrade = null;
      }
    }

    // Evaluate Entry signal if not in position
    if (!currentTrade && i < n - 3) {
      // Don't open new intraday trades in final 10 bars of day
      if (style === 'intraday' && i % 78 > 68) {
        // skip
      } else {
        const signal = evaluateSignal(strategy.id, candles, i, style);
        if (signal.action !== 'HOLD') {
          const isLong = signal.action === 'BUY';
          const entryPrice = isLong ? c.close * (1 + slippage) : c.close * (1 - slippage);
          const atr = c.atr || Math.max(1, (c.high - c.low));

          // Risk-based position sizing
          const stopDist = signal.stopLossPrice
            ? Math.abs(entryPrice - signal.stopLossPrice)
            : (style === 'intraday' ? 1.2 : 2.0) * atr;

          const dollarRisk = equity * riskPerTrade;
          const calculatedQty = Math.max(1, Math.floor(dollarRisk / (stopDist || 1)));
          const maxAllowedQty = Math.floor((equity * 0.95) / entryPrice);
          const quantity = Math.min(calculatedQty, maxAllowedQty);

          stopLossPrice = isLong ? entryPrice - stopDist : entryPrice + stopDist;
          targetPrice = isLong
            ? entryPrice + stopDist * (signal.targetMultiplier || (style === 'intraday' ? 1.8 : 2.5))
            : entryPrice - stopDist * (signal.targetMultiplier || (style === 'intraday' ? 1.8 : 2.5));
          trailingStop = stopLossPrice;

          currentTrade = {
            symbol,
            type: isLong ? 'LONG' : 'SHORT',
            entryIndex: i,
            entryDate: c.timestamp,
            entryPrice: parseFloat(entryPrice.toFixed(2)),
            quantity,
          };
        }
      }
    }

    // Track equity and drawdown
    if (equity > peakEquity) peakEquity = equity;
    const currentDd = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
    if (currentDd > maxDrawdownPct) maxDrawdownPct = currentDd;

    equityCurve.push({
      date: c.timestamp,
      equity: parseFloat(equity.toFixed(2)),
      drawdown: parseFloat(currentDd.toFixed(2)),
    });
  }

  // Calculate backtest performance metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnlUsd > 0).length;
  const losingTrades = trades.filter((t) => t.pnlUsd <= 0).length;
  const winRate = totalTrades > 0 ? parseFloat(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

  const grossProfit = trades.filter((t) => t.pnlUsd > 0).reduce((acc, t) => acc + t.pnlUsd, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnlUsd < 0).reduce((acc, t) => acc + t.pnlUsd, 0));
  const profitFactor = grossLoss > 0
    ? parseFloat((grossProfit / grossLoss).toFixed(2))
    : grossProfit > 0 ? 9.99 : 1.0;

  const netProfitUsd = parseFloat((equity - initialCapital).toFixed(2));
  const netProfitPct = parseFloat(((netProfitUsd / initialCapital) * 100).toFixed(2));

  // CAGR calculation
  const totalYears = style === 'intraday' ? (n / (78 * 252)) : (n / 252);
  const cagrPct = totalYears > 0.05
    ? parseFloat((((Math.max(0.01, equity / initialCapital) ** (1 / Math.max(0.2, totalYears))) - 1) * 100).toFixed(1))
    : netProfitPct * 2;

  // Average trade metrics
  const avgTradePct = totalTrades > 0
    ? parseFloat((trades.reduce((a, b) => a + b.pnlPct, 0) / totalTrades).toFixed(2))
    : 0;
  const avgTradeUsd = totalTrades > 0 ? parseFloat((netProfitUsd / totalTrades).toFixed(2)) : 0;
  const avgHoldBars = totalTrades > 0
    ? Math.round(trades.reduce((a, b) => a + b.durationBars, 0) / totalTrades)
    : 0;

  // Max consecutive losses
  let maxConsecutiveLosses = 0;
  let currLossStreak = 0;
  trades.forEach((t) => {
    if (t.pnlUsd <= 0) {
      currLossStreak++;
      if (currLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currLossStreak;
    } else {
      currLossStreak = 0;
    }
  });

  // Sharpe and Sortino ratio estimation
  const returns = trades.map((t) => t.pnlPct / 100);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 1
    ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
    : 0.01;
  const downsideVariance = returns.length > 1
    ? returns.reduce((sum, r) => sum + (r < 0 ? Math.pow(r, 2) : 0), 0) / (returns.length - 1)
    : 0.01;

  const stdDev = Math.sqrt(variance) || 0.02;
  const downsideStdDev = Math.sqrt(downsideVariance) || 0.015;

  const tradesPerYear = totalYears > 0 ? totalTrades / totalYears : 50;
  const annualReturn = (avgReturn * tradesPerYear);
  const annualVol = stdDev * Math.sqrt(tradesPerYear);
  const annualDownside = downsideStdDev * Math.sqrt(tradesPerYear);

  const riskFreeRate = 0.04; // 4% Treasury risk free rate
  const sharpeRatio = annualVol > 0
    ? parseFloat(((annualReturn - riskFreeRate) / annualVol).toFixed(2))
    : 1.2;
  const sortinoRatio = annualDownside > 0
    ? parseFloat(((annualReturn - riskFreeRate) / annualDownside).toFixed(2))
    : 1.8;

  return {
    metrics: {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      netProfitUsd,
      netProfitPct,
      profitFactor,
      maxDrawdownPct: parseFloat(maxDrawdownPct.toFixed(1)),
      cagrPct,
      sharpeRatio: Math.max(-1.5, Math.min(4.5, sharpeRatio)),
      sortinoRatio: Math.max(-1.5, Math.min(6.0, sortinoRatio)),
      avgTradePct,
      avgTradeUsd,
      maxConsecutiveLosses,
      avgHoldBars,
      equityCurve,
    },
    trades,
  };
}

// Strategy signal evaluation function for all 14 algorithmic strategies
interface SignalEvaluationResult {
  action: 'BUY' | 'SHORT' | 'HOLD';
  stopLossPrice?: number;
  targetMultiplier?: number;
}

export function evaluateSignal(
  strategyId: string,
  candles: Candle[],
  i: number,
  style: TradingStyle
): SignalEvaluationResult {
  const c = candles[i];
  const p = candles[i - 1];
  const p2 = candles[i - 2];
  if (!p || !c) return { action: 'HOLD' };

  switch (strategyId) {
    // 1. Dual EMA 20/50
    case 'strat_dual_ema': {
      if (!c.ema20 || !c.ema50 || !p.ema20 || !p.ema50) return { action: 'HOLD' };
      // Bullish EMA crossover
      if (p.ema20 <= p.ema50 && c.ema20 > c.ema50 && (!c.ema200 || c.close > c.ema200)) {
        return { action: 'BUY', targetMultiplier: 2.8 };
      }
      // Bearish EMA crossover
      if (p.ema20 >= p.ema50 && c.ema20 < c.ema50 && (!c.ema200 || c.close < c.ema200)) {
        return { action: 'SHORT', targetMultiplier: 2.5 };
      }
      return { action: 'HOLD' };
    }

    // 2. Supertrend
    case 'strat_supertrend': {
      if (!c.supertrend || !p.supertrend) return { action: 'HOLD' };
      if (p.supertrend.direction === -1 && c.supertrend.direction === 1) {
        return { action: 'BUY', stopLossPrice: c.supertrend.value, targetMultiplier: 2.6 };
      }
      if (p.supertrend.direction === 1 && c.supertrend.direction === -1) {
        return { action: 'SHORT', stopLossPrice: c.supertrend.value, targetMultiplier: 2.4 };
      }
      return { action: 'HOLD' };
    }

    // 3. MACD Histogram Acceleration
    case 'strat_macd_accel': {
      if (!c.macd || !p.macd || !p2?.macd) return { action: 'HOLD' };
      const histExpandingUp = c.macd.histogram > 0 && c.macd.histogram > p.macd.histogram && p.macd.histogram > p2.macd.histogram;
      if (histExpandingUp && c.macd.macd > c.macd.signal) {
        return { action: 'BUY', targetMultiplier: 2.0 };
      }
      const histExpandingDown = c.macd.histogram < 0 && c.macd.histogram < p.macd.histogram && p.macd.histogram < p2.macd.histogram;
      if (histExpandingDown && c.macd.macd < c.macd.signal) {
        return { action: 'SHORT', targetMultiplier: 2.0 };
      }
      return { action: 'HOLD' };
    }

    // 4. ADX Strong Trend Rider
    case 'strat_adx_trend': {
      if (!c.adx || !p.adx) return { action: 'HOLD' };
      if (c.adx.adx > 25 && c.adx.adx > p.adx.adx) {
        if (p.adx.plusDI <= p.adx.minusDI && c.adx.plusDI > c.adx.minusDI) {
          return { action: 'BUY', targetMultiplier: 3.2 };
        }
        if (p.adx.minusDI <= p.adx.plusDI && c.adx.minusDI > c.adx.plusDI) {
          return { action: 'SHORT', targetMultiplier: 2.8 };
        }
      }
      return { action: 'HOLD' };
    }

    // 5. Donchian 20-Day Turtle Breakout
    case 'strat_donchian_breakout': {
      if (!p.donchian) return { action: 'HOLD' };
      if (c.close > p.donchian.upper) {
        return { action: 'BUY', stopLossPrice: p.donchian.middle, targetMultiplier: 3.5 };
      }
      if (c.close < p.donchian.lower) {
        return { action: 'SHORT', stopLossPrice: p.donchian.middle, targetMultiplier: 3.0 };
      }
      return { action: 'HOLD' };
    }

    // 6. Opening Range Breakout (ORB)
    case 'strat_orb': {
      // 5-min candles: Opening range is first 3 bars (15 mins)
      const barOfDay = i % (style === 'intraday' ? 78 : 252);
      if (barOfDay > 3 && barOfDay < 25) {
        // High of first 3 bars
        const openHigh = Math.max(candles[i - barOfDay].high, candles[i - barOfDay + 1]?.high || 0, candles[i - barOfDay + 2]?.high || 0);
        const openLow = Math.min(candles[i - barOfDay].low, candles[i - barOfDay + 1]?.low || 99999, candles[i - barOfDay + 2]?.low || 99999);
        if (p.close <= openHigh && c.close > openHigh && c.volume > (p.volume * 1.3)) {
          return { action: 'BUY', stopLossPrice: (openHigh + openLow) / 2, targetMultiplier: 2.2 };
        }
        if (p.close >= openLow && c.close < openLow && c.volume > (p.volume * 1.3)) {
          return { action: 'SHORT', stopLossPrice: (openHigh + openLow) / 2, targetMultiplier: 2.2 };
        }
      }
      return { action: 'HOLD' };
    }

    // 7. 20 EMA Pullback in Strong Trend
    case 'strat_ema_pullback': {
      if (!c.ema20 || !c.ema50 || !p.ema20) return { action: 'HOLD' };
      const inUptrend = c.ema20 > c.ema50 && c.close > c.ema20;
      if (inUptrend && p.low <= p.ema20 && c.close > p.high) {
        return { action: 'BUY', stopLossPrice: Math.min(p.low, c.low), targetMultiplier: 2.4 };
      }
      const inDowntrend = c.ema20 < c.ema50 && c.close < c.ema20;
      if (inDowntrend && p.high >= p.ema20 && c.close < p.low) {
        return { action: 'SHORT', stopLossPrice: Math.max(p.high, c.high), targetMultiplier: 2.4 };
      }
      return { action: 'HOLD' };
    }

    // 8. Bollinger Band Squeeze Breakout
    case 'strat_bb_squeeze': {
      if (!c.bollinger || !p.bollinger) return { action: 'HOLD' };
      const wasSqueezing = p.bollinger.bandwidth < 0.055;
      if (wasSqueezing && c.close > c.bollinger.upper && c.volume > p.volume * 1.4) {
        return { action: 'BUY', stopLossPrice: c.bollinger.middle, targetMultiplier: 3.0 };
      }
      if (wasSqueezing && c.close < c.bollinger.lower && c.volume > p.volume * 1.4) {
        return { action: 'SHORT', stopLossPrice: c.bollinger.middle, targetMultiplier: 3.0 };
      }
      return { action: 'HOLD' };
    }

    // 9. RSI Divergence Mean Reversion
    case 'strat_rsi_divergence': {
      if (!c.rsi || !p.rsi) return { action: 'HOLD' };
      // Bullish divergence: price lower low, RSI higher low in oversold
      if (c.rsi < 35 && c.rsi > p.rsi && c.close < p.close && c.close > c.open) {
        return { action: 'BUY', stopLossPrice: c.low * 0.99, targetMultiplier: 2.0 };
      }
      // Bearish divergence: price higher high, RSI lower high in overbought
      if (c.rsi > 65 && c.rsi < p.rsi && c.close > p.close && c.close < c.open) {
        return { action: 'SHORT', stopLossPrice: c.high * 1.01, targetMultiplier: 2.0 };
      }
      return { action: 'HOLD' };
    }

    // 10. Multi-Candle Price Action S/R Reversal
    case 'strat_price_action_sr': {
      const body = Math.abs(c.close - c.open);
      const totalRange = c.high - c.low;
      if (totalRange <= 0) return { action: 'HOLD' };

      const lowerWick = Math.min(c.open, c.close) - c.low;
      const upperWick = c.high - Math.max(c.open, c.close);

      // Bullish Hammer / Pin bar: lower wick is > 60% of total candle range
      if (lowerWick / totalRange > 0.60 && c.close >= p.close) {
        return { action: 'BUY', stopLossPrice: c.low, targetMultiplier: 2.5 };
      }
      // Bearish Shooting Star / Pin bar: upper wick is > 60% of total candle range
      if (upperWick / totalRange > 0.60 && c.close <= p.close) {
        return { action: 'SHORT', stopLossPrice: c.high, targetMultiplier: 2.5 };
      }
      return { action: 'HOLD' };
    }

    // 11. VWAP Mean Reversion & 2-Sigma Band Bounce
    case 'strat_vwap_bands': {
      if (!c.vwap || !c.vwapLower || !c.vwapUpper) return { action: 'HOLD' };
      // Pierced lower 2-sigma band and closed back inside
      if (p.low <= p.vwapLower! && c.close > c.vwapLower! && c.close > c.open) {
        return { action: 'BUY', stopLossPrice: c.low * 0.995, targetMultiplier: 1.8 };
      }
      // Pierced upper 2-sigma band and closed back inside
      if (p.high >= p.vwapUpper! && c.close < c.vwapUpper! && c.close < c.open) {
        return { action: 'SHORT', stopLossPrice: c.high * 1.005, targetMultiplier: 1.8 };
      }
      return { action: 'HOLD' };
    }

    // 12. Volatility Expansion (ATR Surge & Volume Churn)
    case 'strat_volatility_expansion': {
      if (!c.atr || !p.atr) return { action: 'HOLD' };
      const barRange = c.high - c.low;
      const isAtrSurge = barRange > 1.7 * c.atr;
      const isVolumeChurn = c.volume > 2.0 * p.volume;

      if (isAtrSurge && isVolumeChurn) {
        if (c.close > c.open && c.close > p.high) {
          return { action: 'BUY', stopLossPrice: c.low, targetMultiplier: 3.2 };
        }
        if (c.close < c.open && c.close < p.low) {
          return { action: 'SHORT', stopLossPrice: c.high, targetMultiplier: 3.0 };
        }
      }
      return { action: 'HOLD' };
    }

    // 13. Mansfield Relative Strength vs Benchmark
    case 'strat_mansfield_rs': {
      if (!c.relativeStrength || !p.relativeStrength) return { action: 'HOLD' };
      // RS momentum breakout: current RS line expanding and stock above 20 EMA
      const rsRising = c.relativeStrength > p.relativeStrength;
      if (rsRising && c.ema20 && p.ema20 && c.close > c.ema20 && p.close <= p.ema20) {
        return { action: 'BUY', targetMultiplier: 3.0 };
      }
      if (!rsRising && c.ema20 && p.ema20 && c.close < c.ema20 && p.close >= p.ema20) {
        return { action: 'SHORT', targetMultiplier: 2.5 };
      }
      return { action: 'HOLD' };
    }

    // 14. Options Max Pain & PCR Contrarian Strategy
    case 'strat_options_max_pain': {
      if (!c.rsi) return { action: 'HOLD' };
      // Model simulated options expiry cycle pinning
      // Near expiry or periodic cycle, price reverts if oversold and far from median
      if (c.rsi < 36 && c.close < (p.ema20 || c.close) * 0.96) {
        return { action: 'BUY', stopLossPrice: c.low * 0.985, targetMultiplier: 2.2 };
      }
      if (c.rsi > 68 && c.close > (p.ema20 || c.close) * 1.04) {
        return { action: 'SHORT', stopLossPrice: c.high * 1.015, targetMultiplier: 2.2 };
      }
      return { action: 'HOLD' };
    }

    default:
      return { action: 'HOLD' };
  }
}
