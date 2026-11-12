import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  authenticateAngelOne,
  getMaskedSessionStatus,
  saveBackendCredentials,
  angelLiveQuotes,
  fetchAngelOneMarketQuote,
} from './server/angelSmartApiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

interface LiveQuoteItem {
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
  lastUpdated: string;
  source?: 'ANGEL_ONE' | 'FREE_LIVE_FEED';
}

// In-memory cache for fast response and avoiding rate limits
let cachedQuotes: Record<string, LiveQuoteItem> = {};
let lastFetchTime = 0;
const CACHE_DURATION_MS = 3000; // 3 seconds cache

// Mapping from internal symbol to Yahoo Finance ticker fallback
const SYMBOL_MAP: Record<string, { yahooTicker: string; name: string; segment: string; isCommodity?: boolean }> = {
  NIFTY: { yahooTicker: '^NSEI', name: 'NIFTY 50', segment: 'NSE Index' },
  BANKNIFTY: { yahooTicker: '^NSEBANK', name: 'NIFTY BANK', segment: 'NSE Index' },
  INDIAVIX: { yahooTicker: '^INDIAVIX', name: 'INDIA VIX', segment: 'NSE Volatility' },
  CRUDEOIL: { yahooTicker: 'CL=F', name: 'MCX CRUDE OIL', segment: 'MCX Commodity', isCommodity: true },
  RELIANCE: { yahooTicker: 'RELIANCE.NS', name: 'Reliance Industries', segment: 'NSE Stock' },
  HDFCBANK: { yahooTicker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', segment: 'NSE Stock' },
  TCS: { yahooTicker: 'TCS.NS', name: 'Tata Consultancy Services', segment: 'NSE Stock' },
  INFY: { yahooTicker: 'INFY.NS', name: 'Infosys Ltd', segment: 'NSE Stock' },
  SBIN: { yahooTicker: 'SBIN.NS', name: 'State Bank of India', segment: 'NSE Stock' },
  TATAMOTORS: { yahooTicker: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', segment: 'NSE Stock' },
  BHARTIARTL: { yahooTicker: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', segment: 'NSE Stock' },
  LT: { yahooTicker: 'LT.NS', name: 'Larsen & Toubro Ltd', segment: 'NSE Stock' },
  BAJFINANCE: { yahooTicker: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', segment: 'NSE Stock' },
  POLICYBZR: { yahooTicker: 'POLICYBZR.NS', name: 'PB Fintech Ltd', segment: 'NSE Stock' },
};

async function fetchYahooQuote(internalSym: string, config: { yahooTicker: string; name: string; segment: string; isCommodity?: boolean }): Promise<LiveQuoteItem | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(config.yahooTicker)}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    let ltp = meta.regularMarketPrice || meta.chartPreviousClose;
    let previousClose = meta.chartPreviousClose || meta.previousClose || ltp;
    let high = meta.regularMarketDayHigh || ltp;
    let low = meta.regularMarketDayLow || ltp;
    let open = meta.regularMarketOpen || previousClose;

    // If commodity (Crude Oil in USD bbl), convert to approximate MCX 1 bbl in INR (approx 1 bbl * 85.5 INR)
    if (config.isCommodity) {
      const crudeMultiplier = 85.5;
      ltp = Math.round(ltp * crudeMultiplier);
      previousClose = Math.round(previousClose * crudeMultiplier);
      high = Math.round(high * crudeMultiplier);
      low = Math.round(low * crudeMultiplier);
      open = Math.round(open * crudeMultiplier);
    }

    const change = parseFloat((ltp - previousClose).toFixed(2));
    const changePct = previousClose > 0 ? parseFloat(((change / previousClose) * 100).toFixed(2)) : 0;
    const trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = change > 0 ? 'BULLISH' : change < 0 ? 'BEARISH' : 'NEUTRAL';

    let volStr = '--';
    if (meta.regularMarketVolume) {
      const v = meta.regularMarketVolume;
      volStr = v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`;
    }

    return {
      symbol: internalSym,
      name: config.name,
      segment: config.segment,
      ltp: parseFloat(ltp.toFixed(2)),
      change,
      changePct,
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      previousClose: parseFloat(previousClose.toFixed(2)),
      volume: volStr,
      trend,
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour12: false }),
      source: 'FREE_LIVE_FEED',
    };
  } catch (err) {
    console.error(`Error fetching quote for ${internalSym}:`, err);
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Angel One Status Endpoint
  app.get('/api/smartapi/status', (_req: Request, res: Response) => {
    const status = getMaskedSessionStatus();
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Angel One Genuine Authentication Endpoint
  app.post('/api/smartapi/authenticate', async (req: Request, res: Response) => {
    try {
      const { apiKey, clientCode, pin, totpSecret } = req.body || {};
      const result = await authenticateAngelOne({
        apiKey,
        clientCode,
        pin,
        totpSecret,
      });

      if (result.success) {
        return res.json({
          success: true,
          message: result.message,
          data: result.data,
          session: getMaskedSessionStatus(),
        });
      } else {
        return res.status(401).json({
          success: false,
          message: result.message,
          errorCode: result.errorCode,
          session: getMaskedSessionStatus(),
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Authentication processing error',
      });
    }
  });

  // 3. Angel One Configure Backend Credentials
  app.post('/api/smartapi/configure', (req: Request, res: Response) => {
    const { apiKey, clientCode, pin, totpSecret } = req.body || {};
    saveBackendCredentials({
      apiKey,
      clientCode,
      pin,
      totpSecret,
    });
    res.json({
      success: true,
      message: 'Credentials updated in backend environment securely.',
      session: getMaskedSessionStatus(),
    });
  });

  // 4. Angel One Quotes & Market Feed Endpoint
  app.get('/api/smartapi/quotes', async (_req: Request, res: Response) => {
    const status = getMaskedSessionStatus();
    // Return cached or active live quotes
    return res.json({
      success: true,
      source: status.isAuthenticated ? 'ANGEL_ONE_SMARTAPI' : 'FREE_LIVE_FEED',
      status: status.status,
      quotes: cachedQuotes,
      angelLiveQuotes,
      lastPingTime: status.lastPingTime,
      timestamp: new Date().toISOString(),
    });
  });

  // 5. Unified Live Quotes Endpoint (Streams Angel One or Real Free NSE Feed)
  app.get('/api/market/live-quotes', async (_req: Request, res: Response) => {
    const now = Date.now();
    const status = getMaskedSessionStatus();

    // If Angel One is authenticated and has live WebSocket quotes, merge them
    if (status.isAuthenticated && Object.keys(angelLiveQuotes).length > 0) {
      // Merge Angel One live quotes
      Object.entries(angelLiveQuotes).forEach(([token, q]) => {
        const mappedSym = Object.keys(SYMBOL_MAP).find(s => s === q.symbol);
        if (mappedSym && cachedQuotes[mappedSym]) {
          cachedQuotes[mappedSym].ltp = q.ltp;
          cachedQuotes[mappedSym].source = 'ANGEL_ONE';
          cachedQuotes[mappedSym].lastUpdated = q.timestamp;
        }
      });
    }

    // Return cached if within CACHE_DURATION_MS
    if (now - lastFetchTime < CACHE_DURATION_MS && Object.keys(cachedQuotes).length > 0) {
      return res.json({
        success: true,
        source: status.isAuthenticated ? 'Angel One SmartAPI Live Feed' : 'Free Live Market Feed (Yahoo Finance / NSE)',
        quotes: cachedQuotes,
        status: status.isAuthenticated ? status.status : 'LIVE',
        cached: true,
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Fetch symbols in parallel
      const fetchPromises = Object.entries(SYMBOL_MAP).map(async ([internalSym, config]) => {
        const quote = await fetchYahooQuote(internalSym, config);
        return { internalSym, quote };
      });

      const results = await Promise.all(fetchPromises);
      results.forEach(({ internalSym, quote }) => {
        if (quote) {
          cachedQuotes[internalSym] = quote;
        }
      });

      lastFetchTime = Date.now();

      return res.json({
        success: true,
        source: status.isAuthenticated ? 'Angel One SmartAPI Live Feed' : 'Free Live Market Feed (Yahoo Finance / NSE)',
        quotes: cachedQuotes,
        status: status.isAuthenticated ? status.status : 'LIVE',
        cached: false,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      return res.status(500).json({
        success: false,
        error: e.message || 'Failed to fetch live quotes',
        quotes: cachedQuotes,
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'UP',
      time: new Date().toISOString(),
      service: 'Nexus AI Trading Signals - Angel One SmartAPI Engine',
    });
  });

  // Mount Vite or serve static assets
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexus Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
