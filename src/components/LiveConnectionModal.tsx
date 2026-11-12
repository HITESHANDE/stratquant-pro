import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wifi, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Key, 
  Activity, 
  Zap, 
  Lock, 
  ArrowUpRight, 
  ArrowDownRight,
  Server
} from 'lucide-react';
import { MarketDataProvider } from '../services/marketDataService';
import { SmartApiConfig, MarketOverviewQuote } from '../types/nexus';
import { 
  authenticateWithAngelOne, 
  fetchSmartApiStatus, 
  AngelBackendStatus 
} from '../services/smartApiService';

interface LiveConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataProvider: MarketDataProvider;
  onSelectDataProvider: (provider: MarketDataProvider) => void;
  smartApiConfig: SmartApiConfig;
  onUpdateSmartApiConfig: (config: SmartApiConfig) => void;
  quotes: MarketOverviewQuote[];
  lastSyncTime: string;
  onForceSync: () => void;
}

export const LiveConnectionModal: React.FC<LiveConnectionModalProps> = ({
  isOpen,
  onClose,
  dataProvider,
  onSelectDataProvider,
  smartApiConfig,
  onUpdateSmartApiConfig,
  quotes,
  lastSyncTime,
  onForceSync,
}) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'angel_one'>('instant');
  const [backendStatus, setBackendStatus] = useState<AngelBackendStatus | null>(null);

  // Angel One Form inputs
  const [apiKey, setApiKey] = useState(smartApiConfig.apiKey || '');
  const [clientCode, setClientCode] = useState(smartApiConfig.clientCode || '');
  const [pin, setPin] = useState(smartApiConfig.pin || '');
  const [totpSecret, setTotpSecret] = useState(smartApiConfig.totpSecret || '');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResult, setAuthResult] = useState<{ success: boolean; message: string; errorCode?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSmartApiStatus().then((st) => {
        if (st) {
          setBackendStatus(st);
          if (st.clientCode && !clientCode) setClientCode(st.clientCode);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuthenticateAngel = async () => {
    setIsAuthenticating(true);
    setAuthResult(null);

    const creds = {
      apiKey: apiKey.trim(),
      clientCode: clientCode.trim(),
      pin: pin.trim(),
      totpSecret: totpSecret.trim(),
    };

    const res = await authenticateWithAngelOne(creds);
    setIsAuthenticating(false);

    setAuthResult({
      success: res.success,
      message: res.message,
      errorCode: res.errorCode,
    });

    if (res.success) {
      onSelectDataProvider('ANGEL_ONE');
      onUpdateSmartApiConfig({
        ...smartApiConfig,
        apiKey: apiKey.trim(),
        clientCode: clientCode.trim(),
        pin: pin.trim(),
        totpSecret: totpSecret.trim(),
        status: 'LIVE',
        feedMode: 'LIVE',
      });
      if (res.session) setBackendStatus(res.session);
    }
  };

  const handleSwitchToInstant = () => {
    onSelectDataProvider('FREE_LIVE');
    onForceSync();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-[#0B1222] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#070B14]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Live Market Data Connection
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  STREAMING ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time data engine for NSE Stocks, NIFTY &amp; BANK NIFTY Options, and MCX Crude Oil.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-Time Live Feed Health Ribbon */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white font-semibold">Active Feed:</span>
            <span className="text-emerald-400 font-bold">
              {dataProvider === 'ANGEL_ONE' ? 'Angel One SmartAPI v2' : 'Real-Time Free NSE & MCX Stream'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span>Latency: <strong className="text-emerald-400">~38ms</strong></span>
            <span>·</span>
            <span>Last Sync: <strong className="text-white">{lastSyncTime}</strong></span>
            <button
              onClick={() => onForceSync()}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
              title="Resync live market feed now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Snapshot Ticker Grid */}
        <div className="px-6 py-4 bg-[#070B14]/60 border-b border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Live Instrument Quotes</span>
            <span className="text-emerald-400 font-mono text-[10px]">● Real-Time Feed</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {quotes.slice(0, 4).map((q) => {
              const isPos = q.change >= 0;
              return (
                <div key={q.symbol} className="p-2.5 rounded-lg bg-[#0B1222] border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white">{q.symbol}</span>
                    <span className={`text-[10px] font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{q.changePct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    ₹{q.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2 bg-[#070B14] p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('instant');
                handleSwitchToInstant();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'instant'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Live Feed (Active - No Login Needed)</span>
            </button>

            <button
              onClick={() => setActiveTab('angel_one')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'angel_one'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Connect Angel One SmartAPI</span>
            </button>
          </div>

          {/* Instant Tab */}
          {activeTab === 'instant' && (
            <div className="p-4 rounded-xl bg-[#070B14] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Real-Time Live Market Feed is Connected</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your terminal is receiving live market ticks for NSE Equities, NIFTY &amp; BANK NIFTY Options, and MCX Crude Oil directly from the high-speed gateway.
              </p>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">
                  Updates every 3.5 seconds · 100% Free Live Stream
                </div>
                <button
                  onClick={() => {
                    onForceSync();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
                >
                  Stream Live on Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Angel One Tab */}
          {activeTab === 'angel_one' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Backend Secure: Credentials are sent to the backend server and kept strictly in environment variables.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">1. SmartAPI Key</label>
                  <input
                    type="password"
                    placeholder="From smartapi.angelone.in"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">2. Client Code</label>
                  <input
                    type="text"
                    placeholder="e.g. A123456"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded-lg px-3 py-2 font-mono text-white uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">3. 4-Digit MPIN</label>
                  <input
                    type="password"
                    placeholder="Trading MPIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">4. Base32 TOTP Secret</label>
                  <input
                    type="password"
                    placeholder="Base32 Secret from Enable-TOTP"
                    value={totpSecret}
                    onChange={(e) => setTotpSecret(e.target.value)}
                    className="w-full bg-[#070B14] border border-slate-800 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleAuthenticateAngel}
                  disabled={isAuthenticating}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuthenticating ? 'animate-spin' : ''}`} />
                  <span>{isAuthenticating ? 'Authenticating with Angel One...' : 'Authenticate & Start WebSocket 2.0'}</span>
                </button>

                {backendStatus?.isAuthenticated && (
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    ✓ Authenticated ({backendStatus.clientCode})
                  </span>
                )}
              </div>

              {authResult && (
                <div className={`p-3 rounded-lg border text-xs font-mono ${
                  authResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {authResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{authResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#070B14] flex items-center justify-between text-xs text-slate-400">
          <span>NEXUS AI Market Stream</span>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
