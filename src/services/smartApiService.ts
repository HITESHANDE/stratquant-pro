import { SmartApiConfig } from '../types/nexus';

const STORAGE_KEY = 'nexus_angel_smartapi_config';

export function getStoredSmartApiConfig(): SmartApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }

  return {
    apiKey: '',
    clientCode: '',
    pin: '',
    totpSecret: '',
    feedMode: 'LIVE',
    status: 'OFFLINE',
    lastPingTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
  };
}

export function saveSmartApiConfig(config: SmartApiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    // ignore
  }
}

export interface AngelBackendStatus {
  isAuthenticated: boolean;
  status: 'LIVE' | 'DELAYED' | 'OFFLINE';
  feedSource: 'ANGEL_ONE_SMARTAPI' | 'FREE_LIVE_FEED';
  clientCode: string;
  userName: string;
  hasApiKey: boolean;
  hasClientCode: boolean;
  hasPin: boolean;
  hasTotpSecret: boolean;
  maskedApiKey: string;
  maskedClientCode: string;
  loginTime?: string;
  lastPingTime?: string;
  lastError?: string;
  exchangesEnabled: string[];
}

/**
 * Fetch genuine Angel One SmartAPI backend status
 */
export async function fetchSmartApiStatus(): Promise<AngelBackendStatus | null> {
  try {
    const res = await fetch('/api/smartapi/status');
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (e) {
    console.warn('[SmartAPI] Status fetch failed:', e);
    return null;
  }
}

/**
 * Genuine authentication with Angel One SmartAPI via backend
 */
export async function authenticateWithAngelOne(credentials: {
  apiKey?: string;
  clientCode?: string;
  pin?: string;
  totpSecret?: string;
}): Promise<{
  success: boolean;
  message: string;
  errorCode?: string;
  session?: AngelBackendStatus;
}> {
  try {
    const res = await fetch('/api/smartapi/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to reach Angel One backend gateway',
      errorCode: 'GATEWAY_ERROR',
    };
  }
}

/**
 * Configure credentials securely on backend environment
 */
export async function configureBackendCredentials(credentials: {
  apiKey?: string;
  clientCode?: string;
  pin?: string;
  totpSecret?: string;
}): Promise<{ success: boolean; message: string; session?: AngelBackendStatus }> {
  try {
    const res = await fetch('/api/smartapi/configure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to configure backend credentials',
    };
  }
}

export interface MarketSessionInfo {
  isNseOpen: boolean;
  isMcxOpen: boolean;
  sessionTitle: string;
  istTimeString: string;
  nextSessionText: string;
}

/**
 * Checks Indian Market timing (IST is UTC+5:30)
 * NSE Equity & F&O: 09:15 - 15:30 IST (Mon-Fri)
 * MCX Commodity: 09:00 - 23:30 IST (Mon-Fri)
 */
export function getIndianMarketSessionInfo(): MarketSessionInfo {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 3600000;
  const istDate = new Date(utcMs + istOffset);

  const day = istDate.getDay();
  const isWeekend = day === 0 || day === 6;

  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const nseOpenMin = 9 * 60 + 15; // 09:15
  const nseCloseMin = 15 * 60 + 30; // 15:30
  const mcxOpenMin = 9 * 60; // 09:00
  const mcxCloseMin = 23 * 60 + 30; // 23:30

  const isNseOpen = !isWeekend && timeInMinutes >= nseOpenMin && timeInMinutes <= nseCloseMin;
  const isMcxOpen = !isWeekend && timeInMinutes >= mcxOpenMin && timeInMinutes <= mcxCloseMin;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const istTimeString = `${pad(hours)}:${pad(minutes)}:${pad(istDate.getSeconds())} IST`;

  let sessionTitle = 'MARKETS CLOSED';
  let nextSessionText = 'NSE opens at 09:15 IST (Mon-Fri)';

  if (isWeekend) {
    sessionTitle = 'WEEKEND SESSION (CLOSED)';
    nextSessionText = 'Markets reopen Monday 09:15 IST';
  } else if (isNseOpen) {
    sessionTitle = 'NSE & MCX LIVE SESSION';
    nextSessionText = `NSE closes at 15:30 IST · MCX until 23:30 IST`;
  } else if (isMcxOpen) {
    sessionTitle = 'MCX COMMODITY EVENING SESSION';
    nextSessionText = `MCX closes at 23:30 IST · NSE opens tomorrow 09:15 IST`;
  } else {
    sessionTitle = 'PRE/POST MARKET CLOSED';
    nextSessionText = 'Next market session starts 09:15 IST';
  }

  return {
    isNseOpen,
    isMcxOpen,
    sessionTitle,
    istTimeString,
    nextSessionText,
  };
}
