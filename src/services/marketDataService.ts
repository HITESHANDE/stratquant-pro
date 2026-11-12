import { MarketOverviewQuote, NexusSignal } from '../types/nexus';

export type MarketDataProvider = 'FREE_LIVE' | 'ANGEL_ONE' | 'SIMULATION';

export interface LiveMarketResponse {
  success: boolean;
  source: string;
  quotes: Record<string, {
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
  }>;
  cached?: boolean;
  timestamp: string;
}

const PROVIDER_KEY = 'nexus_market_data_provider';

export function getStoredDataProvider(): MarketDataProvider {
  try {
    const raw = localStorage.getItem(PROVIDER_KEY);
    if (raw === 'ANGEL_ONE' || raw === 'SIMULATION' || raw === 'FREE_LIVE') {
      return raw;
    }
  } catch (e) {
    // fallback
  }
  // Default to FREE_LIVE - Works out of the box without Angel One!
  return 'FREE_LIVE';
}

export function saveDataProvider(provider: MarketDataProvider): void {
  try {
    localStorage.setItem(PROVIDER_KEY, provider);
  } catch (e) {
    console.error('Failed to save provider', e);
  }
}

/**
 * Fetches real live Indian market quotes from backend endpoint (Free Yahoo Finance / NSE Feed)
 */
export async function fetchLiveIndianMarketQuotes(): Promise<LiveMarketResponse | null> {
  try {
    const res = await fetch('/api/market/live-quotes');
    if (!res.ok) return null;
    const json: LiveMarketResponse = await res.json();
    return json;
  } catch (err) {
    console.warn('[MarketDataService] Backend live quotes fetch failed, using fallback:', err);
    return null;
  }
}
