import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env if present
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.replace(/^['"]|['"]$/g, '').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  // Ignore env read error
}

export interface AngelCredentials {
  apiKey: string;
  clientCode: string;
  pin: string;
  totpSecret: string;
}

export interface AngelSessionState {
  isAuthenticated: boolean;
  status: 'LIVE' | 'DELAYED' | 'OFFLINE';
  clientCode: string;
  userName?: string;
  jwtToken?: string;
  refreshToken?: string;
  feedToken?: string;
  loginTime?: string;
  lastPingTime?: string;
  lastError?: string;
  exchangesEnabled: string[];
  feedSource: 'ANGEL_ONE_SMARTAPI' | 'FREE_LIVE_FEED';
}

// In-memory session state (Never exposed raw to frontend)
let currentSession: AngelSessionState = {
  isAuthenticated: false,
  status: 'OFFLINE',
  clientCode: '',
  exchangesEnabled: ['NSE', 'NFO', 'MCX'],
  feedSource: 'FREE_LIVE_FEED',
};

// WebSocket 2.0 instance
let smartApiWs: WebSocket | null = null;
let wsHeartbeatTimer: NodeJS.Timeout | null = null;
let wsReconnectTimer: NodeJS.Timeout | null = null;

// In-memory live price cache from Angel One
export const angelLiveQuotes: Record<string, {
  symbol: string;
  token: string;
  exchange: 'NSE' | 'NFO' | 'MCX';
  ltp: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: string;
  timestamp: string;
}> = {};

// Symbol to Angel One Exchange Token mapping
export const ANGEL_TOKEN_MAP: Record<string, { exchange: 'NSE' | 'NFO' | 'MCX'; token: string; name: string }> = {
  NIFTY: { exchange: 'NSE', token: '99926000', name: 'NIFTY 50' },
  BANKNIFTY: { exchange: 'NSE', token: '99926009', name: 'NIFTY BANK' },
  INDIAVIX: { exchange: 'NSE', token: '99926017', name: 'INDIA VIX' },
  RELIANCE: { exchange: 'NSE', token: '2885', name: 'Reliance Industries' },
  HDFCBANK: { exchange: 'NSE', token: '1333', name: 'HDFC Bank Ltd' },
  TCS: { exchange: 'NSE', token: '11536', name: 'Tata Consultancy Services' },
  INFY: { exchange: 'NSE', token: '1594', name: 'Infosys Ltd' },
  SBIN: { exchange: 'NSE', token: '3045', name: 'State Bank of India' },
  TATAMOTORS: { exchange: 'NSE', token: '3456', name: 'Tata Motors Ltd' },
  BHARTIARTL: { exchange: 'NSE', token: '10604', name: 'Bharti Airtel Ltd' },
  LT: { exchange: 'NSE', token: '11483', name: 'Larsen & Toubro Ltd' },
  BAJFINANCE: { exchange: 'NSE', token: '317', name: 'Bajaj Finance Ltd' },
  POLICYBZR: { exchange: 'NSE', token: '5826', name: 'PB Fintech Ltd' },
  CRUDEOIL: { exchange: 'MCX', token: '254820', name: 'MCX Crude Oil' },
};

/**
 * RFC 6238 Standard Base32 Decoder and TOTP Generator
 */
function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export function generateTOTP(secret: string): string {
  // If user passed an existing 6-digit TOTP code
  if (/^\d{6}$/.test(secret.trim())) {
    return secret.trim();
  }

  try {
    const key = base32Decode(secret);
    const counter = Math.floor(Date.now() / 1000 / 30);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  } catch (err) {
    console.error('[AngelSmartAPI] Error generating TOTP:', err);
    return '000000';
  }
}

/**
 * Get credentials from backend environment variables or memory
 */
export function getBackendCredentials(): AngelCredentials {
  return {
    apiKey: process.env.ANGEL_API_KEY || '',
    clientCode: process.env.ANGEL_CLIENT_CODE || '',
    pin: process.env.ANGEL_PIN || '',
    totpSecret: process.env.ANGEL_TOTP_SECRET || '',
  };
}

/**
 * Save credentials securely on backend only
 */
export function saveBackendCredentials(creds: Partial<AngelCredentials>): void {
  if (creds.apiKey !== undefined) process.env.ANGEL_API_KEY = creds.apiKey.trim();
  if (creds.clientCode !== undefined) process.env.ANGEL_CLIENT_CODE = creds.clientCode.trim().toUpperCase();
  if (creds.pin !== undefined) process.env.ANGEL_PIN = creds.pin.trim();
  if (creds.totpSecret !== undefined) process.env.ANGEL_TOTP_SECRET = creds.totpSecret.trim();

  // Try appending/updating .env file on backend server
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    const updateOrAppend = (key: string, val: string) => {
      const reg = new RegExp(`^${key}=.*$`, 'm');
      if (reg.test(content)) {
        content = content.replace(reg, `${key}="${val}"`);
      } else {
        content += `\n${key}="${val}"`;
      }
    };

    if (process.env.ANGEL_API_KEY) updateOrAppend('ANGEL_API_KEY', process.env.ANGEL_API_KEY);
    if (process.env.ANGEL_CLIENT_CODE) updateOrAppend('ANGEL_CLIENT_CODE', process.env.ANGEL_CLIENT_CODE);
    if (process.env.ANGEL_PIN) updateOrAppend('ANGEL_PIN', process.env.ANGEL_PIN);
    if (process.env.ANGEL_TOTP_SECRET) updateOrAppend('ANGEL_TOTP_SECRET', process.env.ANGEL_TOTP_SECRET);

    fs.writeFileSync(envPath, content.trim() + '\n', 'utf8');
  } catch (err) {
    console.warn('[AngelSmartAPI] Could not persist to .env file:', err);
  }
}

/**
 * Perform genuine authentication with Angel One SmartAPI endpoint
 */
export async function authenticateAngelOne(customCreds?: Partial<AngelCredentials>): Promise<{
  success: boolean;
  message: string;
  errorCode?: string;
  data?: any;
}> {
  if (customCreds) {
    saveBackendCredentials(customCreds);
  }

  const creds = getBackendCredentials();

  if (!creds.apiKey || !creds.clientCode || !creds.pin || !creds.totpSecret) {
    currentSession.isAuthenticated = false;
    currentSession.status = 'OFFLINE';
    currentSession.lastError = 'Missing required Angel One credentials (API Key, Client Code, PIN, TOTP)';
    return {
      success: false,
      message: 'Incomplete credentials. Please provide API Key, Client Code, PIN, and TOTP Secret in backend environment variables.',
      errorCode: 'MISSING_CREDENTIALS',
    };
  }

  const totpCode = generateTOTP(creds.totpSecret);

  const payload = {
    clientcode: creds.clientCode,
    password: creds.pin,
    totp: totpCode,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '106.193.147.98',
    'X-MACAddress': 'fe80::216e:6507:4b90:3719',
    'X-PrivateKey': creds.apiKey,
  };

  // Primary Angel One Auth API URL
  const authUrl = 'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword';

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result && result.status === true && result.data?.jwtToken) {
      currentSession.isAuthenticated = true;
      currentSession.clientCode = creds.clientCode;
      currentSession.jwtToken = result.data.jwtToken;
      currentSession.refreshToken = result.data.refreshToken;
      currentSession.feedToken = result.data.feedToken;
      currentSession.loginTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      currentSession.lastPingTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      currentSession.lastError = undefined;
      currentSession.feedSource = 'ANGEL_ONE_SMARTAPI';

      // Check Indian market trading hours to set accurate status: LIVE or DELAYED
      const now = new Date();
      const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utcMs + (5.5 * 3600000));
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const minsTotal = hours * 60 + minutes;
      const isWeekend = istDate.getDay() === 0 || istDate.getDay() === 6;
      const isMarketOpen = !isWeekend && (
        (minsTotal >= 9 * 60 + 15 && minsTotal <= 15 * 60 + 30) || // NSE
        (minsTotal >= 9 * 60 && minsTotal <= 23 * 60 + 30) // MCX
      );

      currentSession.status = isMarketOpen ? 'LIVE' : 'DELAYED';

      // Fetch user profile from Angel One
      try {
        const profileRes = await fetch('https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile', {
          headers: {
            ...headers,
            'Authorization': `Bearer ${result.data.jwtToken}`,
          },
        });
        const profileData = await profileRes.json();
        if (profileData && profileData.data) {
          currentSession.userName = profileData.data.name || profileData.data.clientcode;
          if (profileData.data.exchanges) {
            currentSession.exchangesEnabled = profileData.data.exchanges;
          }
        }
      } catch (pe) {
        console.warn('[AngelSmartAPI] Profile fetch skipped:', pe);
      }

      // Initialize Angel One WebSocket 2.0 connection
      initializeSmartApiWebSocket(creds.clientCode, result.data.feedToken, creds.apiKey);

      return {
        success: true,
        message: `Authenticated successfully with Angel One SmartAPI [Client: ${creds.clientCode}]`,
        data: {
          clientCode: creds.clientCode,
          userName: currentSession.userName || creds.clientCode,
          exchanges: currentSession.exchangesEnabled,
          status: currentSession.status,
          loginTime: currentSession.loginTime,
        },
      };
    } else {
      currentSession.isAuthenticated = false;
      currentSession.status = 'OFFLINE';
      const errMsg = result.message || 'Angel One authentication failed';
      currentSession.lastError = `${result.errorcode ? `[${result.errorcode}] ` : ''}${errMsg}`;
      return {
        success: false,
        message: currentSession.lastError || errMsg,
        errorCode: result.errorcode || 'AUTH_FAILED',
      };
    }
  } catch (err: any) {
    currentSession.isAuthenticated = false;
    currentSession.status = 'OFFLINE';
    currentSession.lastError = err.message || 'Network error connecting to Angel One API servers';
    return {
      success: false,
      message: currentSession.lastError || 'Network error connecting to Angel One API servers',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Angel One WebSocket 2.0 (SmartStream) Client
 * Connects to wss://smartapisocket.angelone.in/smart-stream
 */
export function initializeSmartApiWebSocket(clientCode: string, feedToken: string, apiKey: string) {
  if (smartApiWs) {
    try {
      smartApiWs.close();
    } catch (e) {
      // ignore
    }
    smartApiWs = null;
  }

  if (wsHeartbeatTimer) clearInterval(wsHeartbeatTimer);
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer);

  const wsUrl = `wss://smartapisocket.angelone.in/smart-stream?clientCode=${encodeURIComponent(clientCode)}&feedToken=${encodeURIComponent(feedToken)}&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    smartApiWs = new WebSocket(wsUrl);

    smartApiWs.onopen = () => {
      console.log('[AngelSmartAPI WebSocket 2.0] Connected to SmartStream');
      currentSession.status = 'LIVE';
      currentSession.lastPingTime = new Date().toLocaleTimeString('en-US', { hour12: false });

      // Subscribe to instruments: NSE Equities, Indices, MCX
      const subscribePayload = {
        action: 1, // 1: Subscribe
        params: {
          mode: 1, // 1: LTP
          tokenList: [
            { exchangeType: 1, tokens: ['2885', '1333', '11536', '1594', '3045', '3456', '10604', '11483', '317', '5826'] }, // NSE Cash
            { exchangeType: 1, tokens: ['26000', '26009', '26017'] }, // Indices
            { exchangeType: 2, tokens: ['35000', '35001'] }, // NFO
            { exchangeType: 5, tokens: ['254820'] }, // MCX
          ],
        },
      };

      if (smartApiWs && smartApiWs.readyState === WebSocket.OPEN) {
        smartApiWs.send(JSON.stringify(subscribePayload));
      }

      // Heartbeat ping every 30s
      wsHeartbeatTimer = setInterval(() => {
        if (smartApiWs && smartApiWs.readyState === WebSocket.OPEN) {
          smartApiWs.send('ping');
          currentSession.lastPingTime = new Date().toLocaleTimeString('en-US', { hour12: false });
        }
      }, 30000);
    };

    smartApiWs.onmessage = (event: MessageEvent) => {
      currentSession.lastPingTime = new Date().toLocaleTimeString('en-US', { hour12: false });
      // If binary or text
      if (typeof event.data === 'string' && event.data !== 'pong') {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.token && parsed.last_traded_price) {
            const token = String(parsed.token);
            const ltp = parsed.last_traded_price / 100; // paise to rupees
            angelLiveQuotes[token] = {
              symbol: token,
              token,
              exchange: 'NSE',
              ltp,
              change: 0,
              changePct: 0,
              high: ltp,
              low: ltp,
              open: ltp,
              close: ltp,
              volume: '--',
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            };
          }
        } catch (e) {
          // ignore pong / binary ping
        }
      }
    };

    smartApiWs.onerror = (err) => {
      console.warn('[AngelSmartAPI WebSocket 2.0] WebSocket error:', err);
    };

    smartApiWs.onclose = () => {
      console.log('[AngelSmartAPI WebSocket 2.0] Closed. Reconnecting in 10s...');
      if (currentSession.isAuthenticated) {
        wsReconnectTimer = setTimeout(() => {
          const creds = getBackendCredentials();
          if (currentSession.feedToken && creds.apiKey) {
            initializeSmartApiWebSocket(currentSession.clientCode, currentSession.feedToken, creds.apiKey);
          }
        }, 10000);
      }
    };
  } catch (err) {
    console.error('[AngelSmartAPI WebSocket 2.0] Init failed:', err);
  }
}

/**
 * Fetch genuine market quote from Angel One REST API
 */
export async function fetchAngelOneMarketQuote(exchangeTokens: Record<string, string[]>): Promise<any> {
  const creds = getBackendCredentials();
  if (!currentSession.jwtToken || !creds.apiKey) {
    return null;
  }

  const quoteUrl = 'https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/';
  const headers = {
    'Authorization': `Bearer ${currentSession.jwtToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '106.193.147.98',
    'X-MACAddress': 'fe80::216e:6507:4b90:3719',
    'X-PrivateKey': creds.apiKey,
  };

  try {
    const res = await fetch(quoteUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mode: 'FULL',
        exchangeTokens,
      }),
    });

    const data = await res.json();
    if (data && data.status && data.data?.fetched) {
      return data.data.fetched;
    }
    return null;
  } catch (e) {
    console.error('[AngelSmartAPI] Market quote fetch error:', e);
    return null;
  }
}

/**
 * Get masked session status for frontend (Never leaks raw secret or PIN)
 */
export function getMaskedSessionStatus() {
  const creds = getBackendCredentials();
  const mask = (str: string) => {
    if (!str || str.length <= 4) return str ? '****' : '';
    return str.slice(0, 2) + '****' + str.slice(-2);
  };

  return {
    isAuthenticated: currentSession.isAuthenticated,
    status: currentSession.status,
    feedSource: currentSession.feedSource,
    clientCode: currentSession.clientCode || (creds.clientCode ? mask(creds.clientCode) : ''),
    userName: currentSession.userName || 'Angel One Client',
    hasApiKey: Boolean(creds.apiKey),
    hasClientCode: Boolean(creds.clientCode),
    hasPin: Boolean(creds.pin),
    hasTotpSecret: Boolean(creds.totpSecret),
    maskedApiKey: creds.apiKey ? mask(creds.apiKey) : '',
    maskedClientCode: creds.clientCode ? mask(creds.clientCode) : '',
    loginTime: currentSession.loginTime,
    lastPingTime: currentSession.lastPingTime,
    lastError: currentSession.lastError,
    exchangesEnabled: currentSession.exchangesEnabled,
  };
}
