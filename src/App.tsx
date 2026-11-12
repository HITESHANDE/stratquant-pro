import React, { useState, useEffect, useCallback } from 'react';
import { NavigationTab, NexusSignal, SmartApiConfig, MarketOverviewQuote } from './types/nexus';
import { 
  INITIAL_NEXUS_SIGNALS, 
  MARKET_OVERVIEW_QUOTES, 
  NEXUS_STRATEGIES 
} from './data/nexusData';
import { getStoredSmartApiConfig } from './services/smartApiService';
import { 
  MarketDataProvider, 
  getStoredDataProvider, 
  saveDataProvider, 
  fetchLiveIndianMarketQuotes 
} from './services/marketDataService';

// Nexus Components
import { NexusHeader } from './components/NexusHeader';
import { NexusSidebar } from './components/NexusSidebar';
import { AiSignalsPage } from './components/AiSignalsPage';
import { DashboardPage } from './components/DashboardPage';
import { MarketScannerPage } from './components/MarketScannerPage';
import { OptionsAnalyticsPage } from './components/OptionsAnalyticsPage';
import { WatchlistPage } from './components/WatchlistPage';
import { StrategyEnginePage } from './components/StrategyEnginePage';
import { BacktestingPage } from './components/BacktestingPage';
import { TradeHistoryPage } from './components/TradeHistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { SignalDetailModal } from './components/SignalDetailModal';
import { LiveConnectionModal } from './components/LiveConnectionModal';

export default function App() {
  // Navigation State: default to 'signals' as primary
  const [activeTab, setActiveTab] = useState<NavigationTab>('signals');

  // Live Data & Angel One Connection Modal state
  const [isLiveModalOpen, setIsLiveModalOpen] = useState<boolean>(false);

  // Market Data Provider: 'FREE_LIVE' (default, no broker login needed!), 'ANGEL_ONE', or 'SIMULATION'
  const [dataProvider, setDataProvider] = useState<MarketDataProvider>(getStoredDataProvider);
  const [lastLiveSyncTime, setLastLiveSyncTime] = useState<string>('Connecting...');

  // Signals Feed State
  const [signals, setSignals] = useState<NexusSignal[]>(INITIAL_NEXUS_SIGNALS);
  const [selectedSignal, setSelectedSignal] = useState<NexusSignal | null>(null);

  // Market Quotes State
  const [quotes, setQuotes] = useState<MarketOverviewQuote[]>(MARKET_OVERVIEW_QUOTES);

  // Real-time auto update & audio toggles
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Angel One SmartAPI Config State
  const [smartApiConfig, setSmartApiConfig] = useState<SmartApiConfig>(getStoredSmartApiConfig);

  // Check backend Angel One authentication status on load
  useEffect(() => {
    fetch('/api/smartapi/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.isAuthenticated) {
          setDataProvider('ANGEL_ONE');
          setSmartApiConfig((prev) => ({
            ...prev,
            status: data.status || 'LIVE',
            clientCode: data.clientCode || prev.clientCode,
            feedMode: 'LIVE',
          }));
        }
      })
      .catch((e) => console.warn('Could not read Angel One backend status:', e));
  }, []);

  // Sound chime helper using Web Audio API (no external sound asset dependency)
  const playAlertSound = useCallback((type: 'BUY' | 'SELL' | 'REFRESH' = 'REFRESH') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type === 'BUY' ? 'sine' : type === 'SELL' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(type === 'BUY' ? 880 : type === 'SELL' ? 440 : 660, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(type === 'BUY' ? 1320 : type === 'SELL' ? 330 : 880, audioCtx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      // AudioContext policy
    }
  }, [soundEnabled]);

  // Live Indian Market Data Fetcher (Angel One SmartAPI or Free Live Feed)
  const syncLiveMarketData = useCallback(async () => {
    if (dataProvider === 'SIMULATION') return;

    try {
      const liveData = await fetchLiveIndianMarketQuotes();
      if (liveData && liveData.success && liveData.quotes) {
        const liveMap = liveData.quotes;

        // 1. Update 4 Key Market Overview Quotes
        setQuotes((prev) =>
          prev.map((item) => {
            const liveItem = liveMap[item.symbol];
            if (!liveItem) return item;
            return {
              ...item,
              ltp: liveItem.ltp,
              change: liveItem.change,
              changePct: liveItem.changePct,
              high: liveItem.high,
              low: liveItem.low,
              open: liveItem.open,
              previousClose: liveItem.previousClose,
              volume: liveItem.volume !== '--' ? liveItem.volume : item.volume,
              trend: liveItem.trend,
              sparkline: [...item.sparkline.slice(1), liveItem.ltp],
            };
          })
        );

        // 2. Update Live Prices in Unified Signals
        setSignals((prev) =>
          prev.map((sig) => {
            // Match underlying symbol or option underlying
            const liveMatch = liveMap[sig.symbol];
            if (!liveMatch) return sig;

            // If it's a direct equity or commodity
            if (sig.marketSegment === 'NSE_STOCK' || sig.marketSegment === 'MCX_COMMODITY') {
              const newLtp = liveMatch.ltp;
              const ltpChangePct = liveMatch.changePct;
              // recalculate progress to Target 1
              const totalDistance = Math.abs(sig.target1 - sig.entryPrice);
              const currentDistance = Math.abs(newLtp - sig.entryPrice);
              const progressPct = Math.min(100, Math.max(0, Math.round((currentDistance / (totalDistance || 1)) * 100)));

              return {
                ...sig,
                currentLtp: newLtp,
                ltpChangePct,
                progressPct,
              };
            }

            return sig;
          })
        );

        const now = new Date();
        setLastLiveSyncTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} IST`);
      }
    } catch (err) {
      console.warn('Live sync error:', err);
    }
  }, [dataProvider]);

  // Initial fetch and recurring polling
  useEffect(() => {
    if (!autoUpdate) return;

    // Immediately run live sync
    if (dataProvider !== 'SIMULATION') {
      syncLiveMarketData();
    }

    // Polling interval: every 3.5 seconds for real-time live data
    const interval = setInterval(() => {
      if (dataProvider !== 'SIMULATION') {
        syncLiveMarketData();
      } else {
        // Fallback simulation ticks
        setSignals((prev) =>
          prev.map((sig) => {
            if (sig.status !== 'ACTIVE') return sig;
            const delta = (Math.random() - 0.48) * (sig.entryPrice * 0.0006);
            const newLtp = parseFloat((sig.currentLtp + delta).toFixed(2));
            return {
              ...sig,
              currentLtp: newLtp,
            };
          })
        );

        setQuotes((prevQuotes) =>
          prevQuotes.map((q) => {
            const delta = (Math.random() - 0.48) * (q.ltp * 0.0004);
            const newLtp = parseFloat((q.ltp + delta).toFixed(2));
            return {
              ...q,
              ltp: newLtp,
            };
          })
        );
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoUpdate, dataProvider, syncLiveMarketData]);

  // Manual Refresh Handler
  const handleRefreshSignals = () => {
    playAlertSound('REFRESH');
    if (dataProvider === 'FREE_LIVE') {
      syncLiveMarketData();
    }
    setSignals((prev) => [
      ...prev.map((s, idx) => (idx === 0 ? { ...s, isNew: true } : s))
    ]);
  };

  // Provider change handler
  const handleSelectDataProvider = (provider: MarketDataProvider) => {
    setDataProvider(provider);
    saveDataProvider(provider);
    if (provider === 'FREE_LIVE') {
      syncLiveMarketData();
    }
  };

  // Quick navigation helper from scanner/quotes
  const handleSelectSignalFromScanner = (symbol: string, action: 'BUY' | 'SELL') => {
    const matched = signals.find((s) => s.symbol === symbol && s.action === action) || signals.find((s) => s.symbol === symbol);
    if (matched) {
      setSelectedSignal(matched);
    } else {
      setActiveTab('signals');
    }
  };

  const activeSignalsCount = signals.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Header Bar */}
      <NexusHeader
        smartApiConfig={smartApiConfig}
        dataProvider={dataProvider}
        onNavigateTab={setActiveTab}
        activeSignalsCount={activeSignalsCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        lastLiveSyncTime={lastLiveSyncTime}
        onOpenConnectionModal={() => setIsLiveModalOpen(true)}
      />

      {/* Main Layout Area: Sidebar + Active Page */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1720px] w-full mx-auto">
        
        {/* Navigation Sidebar (Desktop + Mobile) */}
        <NexusSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeSignalsCount={activeSignalsCount}
        />

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          
          {/* 1. Dashboard Page */}
          {activeTab === 'dashboard' && (
            <DashboardPage
              signals={signals}
              quotes={quotes}
              strategies={NEXUS_STRATEGIES}
              onSelectSignal={setSelectedSignal}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* 2. AI Signals Page (PRIMARY FEATURE) */}
          {activeTab === 'signals' && (
            <AiSignalsPage
              signals={signals}
              onSelectSignal={setSelectedSignal}
              autoUpdate={autoUpdate}
              onToggleAutoUpdate={() => setAutoUpdate(!autoUpdate)}
              onRefreshSignals={handleRefreshSignals}
              onOpenConnectionModal={() => setIsLiveModalOpen(true)}
            />
          )}

          {/* 3. Market Scanner Page */}
          {activeTab === 'scanner' && (
            <MarketScannerPage
              onSelectSignalFromScanner={handleSelectSignalFromScanner}
            />
          )}

          {/* 4. Options Analytics Page */}
          {activeTab === 'options' && (
            <OptionsAnalyticsPage
              onTradeSignal={() => setActiveTab('signals')}
            />
          )}

          {/* 5. Watchlist Page */}
          {activeTab === 'watchlist' && (
            <WatchlistPage
              onSelectInstrument={(sym) => {
                const sig = signals.find((s) => s.symbol === sym);
                if (sig) setSelectedSignal(sig);
                else setActiveTab('signals');
              }}
            />
          )}

          {/* 6. Strategy Engine Page */}
          {activeTab === 'strategies' && (
            <StrategyEnginePage
              strategies={NEXUS_STRATEGIES}
            />
          )}

          {/* 7. Backtesting Page */}
          {activeTab === 'backtesting' && (
            <BacktestingPage />
          )}

          {/* 8. Trade History Page */}
          {activeTab === 'history' && (
            <TradeHistoryPage />
          )}

          {/* 9. Settings Page */}
          {activeTab === 'settings' && (
            <SettingsPage
              config={smartApiConfig}
              onUpdateConfig={setSmartApiConfig}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              dataProvider={dataProvider}
              onSelectDataProvider={handleSelectDataProvider}
            />
          )}

        </main>
      </div>

      {/* Deep AI Signal Analysis Modal */}
      <SignalDetailModal
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />

      {/* Live Data Feed & SmartAPI Modal */}
      <LiveConnectionModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        dataProvider={dataProvider}
        onSelectDataProvider={handleSelectDataProvider}
        smartApiConfig={smartApiConfig}
        onUpdateSmartApiConfig={setSmartApiConfig}
        quotes={quotes}
        lastSyncTime={lastLiveSyncTime}
        onForceSync={syncLiveMarketData}
      />

      {/* Institutional Terminal Footer */}
      <footer className="border-t border-slate-900 bg-[#070B14] px-6 py-3.5 text-xs text-slate-400">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">NEXUS AI TRADING SIGNALS</span>
            <span>·</span>
            <span className="text-slate-400">NSE Stocks · NIFTY &amp; BANK NIFTY Options · MCX Crude Oil</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {dataProvider === 'FREE_LIVE'
              ? '● Free Live Indian Market Stream (NSE & MCX) Active · No Broker Credentials Required'
              : '● Angel One SmartAPI Feed Active'}
          </div>
        </div>
      </footer>

    </div>
  );
}
