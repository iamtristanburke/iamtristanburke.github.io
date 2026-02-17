import { useState, useCallback } from 'react';
import { Config, BacktestResults, HistoricalPricesData } from './types/colt-road';
import ColtHeader from './components/ColtHeader';
import ColtRoadResearchModal from './components/ColtRoadResearchModal';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import StockSelectionPage from './pages/StockSelectionPage';
import StrategyPage from './pages/StrategyPage';
import ResultsPage from './pages/ResultsPage';
import { generateBacktest } from './utils/backtest';
import { COLT_ROAD_BEST_IDEAS_TICKERS } from './data/coltRoadBestIdeas';

function getHistoricalDataUrl(): string {
  const base = typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/';
  const path = base.endsWith('/') ? 'data/historicalPrices.json' : '/data/historicalPrices.json';
  return `${base}${path}`.replace(/\/+/g, '/');
}

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [config, setConfig] = useState<Config>({
    portfolioValue: 100000,
    targetEquityPct: 70,
    selectedStocks: [...COLT_ROAD_BEST_IDEAS_TICKERS],
    portfolioSizingMethod: 'equalWeight',
    rebalanceFreq: 'quarterly',
    commission: 0,
    slippage: 0.1,
    positionLimit: 10,
    accountType: 'taxable',
    taxBracket: 24,
    strategies: { buyAndHold: { enabled: true } },
    personalFactors: {
      timeHorizonYears: 10,
      age: 45,
      riskAppetite: 'moderate',
      maxAcceptableLossPct: 15,
      ifPortfolioDropped20: 'hold',
      avoidShortTermLosses: 'somewhat',
      pctOfAssetsInLiquidPortfolio: 50,
      realEstateValue: 0,
      alternativeInvestmentsValue: 0
    },
    investmentStyle: 'balanced',
    themes: [],
    buySignals: { technical: true, fundamental: true, ai: false },
    balanceSignals: { technical: true, ai: false, other: false }
  });
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [assetAllocationResearchOpen, setAssetAllocationResearchOpen] = useState(false);
  const [stockPickingResearchOpen, setStockPickingResearchOpen] = useState(false);
  const [positionSizingResearchOpen, setPositionSizingResearchOpen] = useState(false);

  const updateConfig = (key: keyof Config, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  const toggleStock = (ticker: string) => {
    setConfig(prev => ({
      ...prev,
      selectedStocks: prev.selectedStocks.includes(ticker)
        ? prev.selectedStocks.filter(t => t !== ticker)
        : [...prev.selectedStocks, ticker]
    }));
  };
  
  const runBacktest = useCallback(async () => {
    if (config.selectedStocks.length === 0) {
      alert('Please select at least one stock');
      return;
    }
    setBacktestLoading(true);
    try {
      const url = getHistoricalDataUrl();
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Market data could not be loaded (${res.status}). Make sure you run the app with "npm run dev" or deploy with the data file in place.`);
      }
      const raw = await res.json();
      const data: HistoricalPricesData = {
        lastUpdated: raw?.lastUpdated ?? '',
        prices: raw?.prices ?? {}
      };
      const backtestResults = generateBacktest(config, data);
      setResults(backtestResults);
      setCurrentPage(5);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backtest failed. Please try again.';
      alert(message);
    } finally {
      setBacktestLoading(false);
    }
  }, [config]);
  
  return (
    <div style={styles.app}>
      <ColtHeader />
      <ColtRoadResearchModal variant="assetAllocation" open={assetAllocationResearchOpen} onClose={() => setAssetAllocationResearchOpen(false)} />
      <ColtRoadResearchModal variant="stockPicking" open={stockPickingResearchOpen} onClose={() => setStockPickingResearchOpen(false)} />
      <ColtRoadResearchModal variant="positionSizing" open={positionSizingResearchOpen} onClose={() => setPositionSizingResearchOpen(false)} />

      {currentPage === 1 && <LandingPage onStart={() => setCurrentPage(2)} />}
      {currentPage === 2 && (
        <ProfilePage 
          config={config} 
          updateConfig={updateConfig} 
          onNext={() => setCurrentPage(3)} 
          onBack={() => setCurrentPage(1)}
          onStepClick={setCurrentPage}
          onOpenResearch={() => setAssetAllocationResearchOpen(true)}
        />
      )}
      {currentPage === 3 && (
        <StockSelectionPage 
          config={config} 
          updateConfig={updateConfig}
          toggleStock={toggleStock} 
          onNext={() => setCurrentPage(4)} 
          onBack={() => setCurrentPage(2)}
          onStepClick={setCurrentPage}
          onOpenResearch={() => setStockPickingResearchOpen(true)}
        />
      )}
      {currentPage === 4 && (
        <StrategyPage 
          config={config}
          updateConfig={updateConfig} 
          onRun={runBacktest}
          backtestLoading={backtestLoading}
          onBack={() => setCurrentPage(3)}
          onStepClick={setCurrentPage}
          onOpenPositionSizingResearch={() => setPositionSizingResearchOpen(true)}
        />
      )}
      {currentPage === 5 && results && (
        <ResultsPage 
          results={results} 
          config={config} 
          onRestart={() => { 
            setCurrentPage(1); 
            setResults(null); 
          }}
          onStepClick={setCurrentPage}
        />
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh'
  }
};

export default App;
