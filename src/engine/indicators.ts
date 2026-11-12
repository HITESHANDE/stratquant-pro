import { Candle, Market } from '../types/trading';

export function calculateIndicators(candles: Candle[], benchmarkCandles?: Candle[]): Candle[] {
  const result: Candle[] = candles.map((c) => ({ ...c }));
  const n = result.length;
  if (n === 0) return result;

  // 1. Calculate EMAs (9, 20, 50, 200)
  computeEMA(result, 9, 'ema9');
  computeEMA(result, 20, 'ema20');
  computeEMA(result, 50, 'ema50');
  computeEMA(result, 200, 'ema200');

  // 2. Calculate ATR (14)
  computeATR(result, 14);

  // 3. Calculate Supertrend (10, 3.0)
  computeSupertrend(result, 10, 3.0);

  // 4. Calculate Bollinger Bands (20, 2.0)
  computeBollingerBands(result, 20, 2.0);

  // 5. Calculate Donchian Channels (20)
  computeDonchian(result, 20);

  // 6. Calculate VWAP
  computeVWAP(result);

  // 7. Calculate RSI (14)
  computeRSI(result, 14);

  // 8. Calculate MACD (12, 26, 9)
  computeMACD(result, 12, 26, 9);

  // 9. Calculate ADX (14)
  computeADX(result, 14);

  // 10. Relative Strength vs Benchmark if provided
  if (benchmarkCandles && benchmarkCandles.length > 0) {
    const minLen = Math.min(result.length, benchmarkCandles.length);
    for (let i = 0; i < minLen; i++) {
      const stockIdx = result.length - 1 - i;
      const benchIdx = benchmarkCandles.length - 1 - i;
      const stockC = result[stockIdx];
      const benchC = benchmarkCandles[benchIdx];
      if (benchC.close > 0) {
        stockC.relativeStrength = parseFloat((stockC.close / benchC.close).toFixed(4));
      }
    }
  }

  return result;
}

function computeEMA(candles: Candle[], period: number, key: 'ema9' | 'ema20' | 'ema50' | 'ema200') {
  const k = 2 / (period + 1);
  let ema = 0;
  for (let i = 0; i < candles.length; i++) {
    const close = candles[i].close;
    if (i < period - 1) {
      ema += close;
      if (i === period - 2) {
        ema = (ema + close) / period;
        candles[i][key] = parseFloat(ema.toFixed(2));
      }
    } else if (i === period - 1) {
      ema = (ema + close) / period;
      candles[i][key] = parseFloat(ema.toFixed(2));
    } else {
      ema = close * k + ema * (1 - k);
      candles[i][key] = parseFloat(ema.toFixed(2));
    }
  }
}

function computeATR(candles: Candle[], period: number) {
  let trSum = 0;
  for (let i = 0; i < candles.length; i++) {
    const curr = candles[i];
    const prev = i > 0 ? candles[i - 1] : curr;
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );

    if (i < period) {
      trSum += tr;
      if (i === period - 1) {
        curr.atr = parseFloat((trSum / period).toFixed(2));
      } else {
        curr.atr = parseFloat(tr.toFixed(2));
      }
    } else {
      const prevAtr = candles[i - 1].atr || tr;
      curr.atr = parseFloat(((prevAtr * (period - 1) + tr) / period).toFixed(2));
    }
  }
}

function computeSupertrend(candles: Candle[], period: number, multiplier: number) {
  for (let i = 0; i < candles.length; i++) {
    const curr = candles[i];
    const atr = curr.atr || (curr.high - curr.low);
    const hl2 = (curr.high + curr.low) / 2;
    const basicUpper = hl2 + multiplier * atr;
    const basicLower = hl2 - multiplier * atr;

    if (i === 0) {
      curr.supertrend = {
        value: parseFloat(basicLower.toFixed(2)),
        direction: 1,
      };
      continue;
    }

    const prev = candles[i - 1];
    const prevSuper = prev.supertrend || { value: basicLower, direction: 1 };

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (prev.close <= prevSuper.value && prevSuper.direction === -1) {
      finalUpper = Math.min(basicUpper, prevSuper.value);
    }
    if (prev.close >= prevSuper.value && prevSuper.direction === 1) {
      finalLower = Math.max(basicLower, prevSuper.value);
    }

    let direction: 1 | -1 = prevSuper.direction;
    let value = prevSuper.direction === 1 ? finalLower : finalUpper;

    if (prevSuper.direction === 1 && curr.close < finalLower) {
      direction = -1;
      value = finalUpper;
    } else if (prevSuper.direction === -1 && curr.close > finalUpper) {
      direction = 1;
      value = finalLower;
    }

    curr.supertrend = {
      value: parseFloat(value.toFixed(2)),
      direction,
    };
  }
}

function computeBollingerBands(candles: Candle[], period: number, stdDevMult: number) {
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) continue;

    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const mean = sum / period;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(candles[j].close - mean, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    const upper = mean + stdDevMult * stdDev;
    const lower = mean - stdDevMult * stdDev;
    const bandwidth = mean > 0 ? (upper - lower) / mean : 0;

    candles[i].bollinger = {
      upper: parseFloat(upper.toFixed(2)),
      middle: parseFloat(mean.toFixed(2)),
      lower: parseFloat(lower.toFixed(2)),
      bandwidth: parseFloat(bandwidth.toFixed(4)),
    };
  }
}

function computeDonchian(candles: Candle[], period: number) {
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) continue;
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > highest) highest = candles[j].high;
      if (candles[j].low < lowest) lowest = candles[j].low;
    }
    candles[i].donchian = {
      upper: parseFloat(highest.toFixed(2)),
      lower: parseFloat(lowest.toFixed(2)),
      middle: parseFloat(((highest + lowest) / 2).toFixed(2)),
    };
  }
}

function computeVWAP(candles: Candle[]) {
  let cumVolume = 0;
  let cumVolPrice = 0;
  let cumVolPriceSq = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumVolume += c.volume;
    cumVolPrice += typicalPrice * c.volume;
    cumVolPriceSq += typicalPrice * typicalPrice * c.volume;

    const vwap = cumVolume > 0 ? cumVolPrice / cumVolume : typicalPrice;
    const variance = cumVolume > 0 ? Math.max(0, cumVolPriceSq / cumVolume - vwap * vwap) : 0;
    const stdDev = Math.sqrt(variance);

    c.vwap = parseFloat(vwap.toFixed(2));
    c.vwapUpper = parseFloat((vwap + 2.0 * stdDev).toFixed(2));
    c.vwapLower = parseFloat((vwap - 2.0 * stdDev).toFixed(2));
  }
}

function computeRSI(candles: Candle[], period: number) {
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        candles[i].rsi = parseFloat((100 - 100 / (1 + rs)).toFixed(1));
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      candles[i].rsi = parseFloat((100 - 100 / (1 + rs)).toFixed(1));
    }
  }
}

function computeMACD(candles: Candle[], fast: number, slow: number, signal: number) {
  const kFast = 2 / (fast + 1);
  const kSlow = 2 / (slow + 1);
  const kSignal = 2 / (signal + 1);

  let emaFast = 0;
  let emaSlow = 0;
  let emaSignal = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i].close;
    if (i === 0) {
      emaFast = c;
      emaSlow = c;
    } else {
      emaFast = c * kFast + emaFast * (1 - kFast);
      emaSlow = c * kSlow + emaSlow * (1 - kSlow);
    }

    if (i >= slow - 1) {
      const macdVal = emaFast - emaSlow;
      if (i === slow - 1) {
        emaSignal = macdVal;
      } else {
        emaSignal = macdVal * kSignal + emaSignal * (1 - kSignal);
      }

      candles[i].macd = {
        macd: parseFloat(macdVal.toFixed(2)),
        signal: parseFloat(emaSignal.toFixed(2)),
        histogram: parseFloat((macdVal - emaSignal).toFixed(2)),
      };
    }
  }
}

function computeADX(candles: Candle[], period: number) {
  let trSmoothed = 0;
  let plusDMSmoothed = 0;
  let minusDMSmoothed = 0;
  let dxValues: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];

    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;

    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;

    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );

    if (i <= period) {
      trSmoothed += tr;
      plusDMSmoothed += plusDM;
      minusDMSmoothed += minusDM;

      if (i === period) {
        const plusDI = (plusDMSmoothed / trSmoothed) * 100;
        const minusDI = (minusDMSmoothed / trSmoothed) * 100;
        const sumDI = plusDI + minusDI;
        const dx = sumDI === 0 ? 0 : (Math.abs(plusDI - minusDI) / sumDI) * 100;
        dxValues.push(dx);
        curr.adx = {
          adx: parseFloat(dx.toFixed(1)),
          plusDI: parseFloat(plusDI.toFixed(1)),
          minusDI: parseFloat(minusDI.toFixed(1)),
        };
      }
    } else {
      trSmoothed = trSmoothed - trSmoothed / period + tr;
      plusDMSmoothed = plusDMSmoothed - plusDMSmoothed / period + plusDM;
      minusDMSmoothed = minusDMSmoothed - minusDMSmoothed / period + minusDM;

      const plusDI = (plusDMSmoothed / trSmoothed) * 100;
      const minusDI = (minusDMSmoothed / trSmoothed) * 100;
      const sumDI = plusDI + minusDI;
      const dx = sumDI === 0 ? 0 : (Math.abs(plusDI - minusDI) / sumDI) * 100;
      dxValues.push(dx);

      const adxVal = dxValues.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, dxValues.length);

      curr.adx = {
        adx: parseFloat(adxVal.toFixed(1)),
        plusDI: parseFloat(plusDI.toFixed(1)),
        minusDI: parseFloat(minusDI.toFixed(1)),
      };
    }
  }
}

export interface ExchangeMarketStatus {
  isOpen: boolean;
  sessionName: string;
  statusLabel: 'MARKET OPEN' | 'PRE-MARKET' | 'POST-MARKET' | 'MARKET CLOSED';
  sessionTimeStr: string;
  nextSessionStr: string;
  isWeekend: boolean;
  currentTimeFormatted: string;
  exchangeLabel: string;
}

// Calculate true exchange trading hours for NSE / BSE / MCX (Indian Markets Only)
export function getExchangeMarketStatus(market: Market = 'INDIA'): ExchangeMarketStatus {
  const now = new Date();
  
  // Convert current UTC time to Indian Standard Time (UTC + 5:30)
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utcTime + (3600000 * 5.5));
  
  const day = istTime.getDay(); // 0 = Sun, 6 = Sat
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  const currentTimeFormatted = istTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return {
      isOpen: false,
      sessionName: 'Weekend Holiday (Closed)',
      statusLabel: 'MARKET CLOSED',
      sessionTimeStr: 'NSE / BSE Regular Hours: Mon-Fri 09:15 - 15:30 IST',
      nextSessionStr: 'Opens Monday 09:15 AM IST',
      isWeekend: true,
      currentTimeFormatted,
      exchangeLabel: 'NSE / BSE / MCX',
    };
  }

  // Mon - Fri: 09:00 - 09:15 Pre-market
  if (totalMinutes >= 540 && totalMinutes < 555) {
    return {
      isOpen: false,
      sessionName: 'NSE Pre-Market Call Auction',
      statusLabel: 'PRE-MARKET',
      sessionTimeStr: '09:00 - 09:15 IST (Order Collection)',
      nextSessionStr: 'Regular Trading Opens at 09:15 AM IST',
      isWeekend: false,
      currentTimeFormatted,
      exchangeLabel: 'NSE Pre-Market',
    };
  }

  // Mon - Fri: 09:15 - 15:30 Normal Trading Session (555 to 930 mins)
  if (totalMinutes >= 555 && totalMinutes <= 930) {
    return {
      isOpen: true,
      sessionName: 'NSE / BSE Regular Trading Session',
      statusLabel: 'MARKET OPEN',
      sessionTimeStr: 'Continuous Hours: 09:15 - 15:30 IST',
      nextSessionStr: 'Session Closes at 15:30 IST',
      isWeekend: false,
      currentTimeFormatted,
      exchangeLabel: 'NSE / BSE Live',
    };
  }

  // Mon - Fri: 15:40 - 16:00 Post-market closing
  if (totalMinutes > 930 && totalMinutes <= 960) {
    return {
      isOpen: false,
      sessionName: 'NSE Post-Market Settlement',
      statusLabel: 'POST-MARKET',
      sessionTimeStr: '15:40 - 16:00 IST Closing Session',
      nextSessionStr: 'Next Regular Session Tomorrow 09:15 AM IST',
      isWeekend: false,
      currentTimeFormatted,
      exchangeLabel: 'NSE Post-Market',
    };
  }

  // After hours (Evening / Night or Early Morning before 09:00 IST)
  return {
    isOpen: false,
    sessionName: totalMinutes > 930 ? 'Evening After-Hours (Closed)' : 'Early Morning Pre-Opening (Closed)',
    statusLabel: 'MARKET CLOSED',
    sessionTimeStr: 'NSE Regular Hours: Mon-Fri 09:15 - 15:30 IST',
    nextSessionStr: totalMinutes > 930 ? 'Next Session Tomorrow 09:15 AM IST' : 'Session Opens Today 09:15 AM IST',
    isWeekend: false,
    currentTimeFormatted,
    exchangeLabel: 'NSE / BSE Closed',
  };
}
