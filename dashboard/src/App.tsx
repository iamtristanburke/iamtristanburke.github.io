import { useState } from 'react';
import { Config, BacktestResults } from './types/colt-road';
import ColtHeader from './components/ColtHeader';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import StockSelectionPage from './pages/StockSelectionPage';
import StrategyPage from './pages/StrategyPage';
import ResultsPage from './pages/ResultsPage';
import { generateBacktest } from './utils/backtest';

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [config, setConfig] = useState<Config>({
    portfolioValue: 100000,
    targetEquityPct: 70,
    selectedStocks: [],
    rebalanceFreq: 'quarterly',
    commission: 0,
    slippage: 0.1,
    positionLimit: 10,
    accountType: 'taxable',
    taxBracket: 24,
    strategies: {}
  });
  const [results, setResults] = useState<BacktestResults | null>(null);
  
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
  
  const runBacktest = () => {
    if (config.selectedStocks.length === 0) {
      alert('Please select at least one stock');
      return;
    }
    
    const backtestResults = generateBacktest(config);
    setResults(backtestResults);
    setCurrentPage(5);
  };
  
  return (
    <div style={styles.app}>
      <ColtHeader />
      
      {currentPage === 1 && <LandingPage onStart={() => setCurrentPage(2)} />}
      {currentPage === 2 && (
        <ProfilePage 
          config={config} 
          updateConfig={updateConfig} 
          onNext={() => setCurrentPage(3)} 
          onBack={() => setCurrentPage(1)} 
        />
      )}
      {currentPage === 3 && (
        <StockSelectionPage 
          config={config} 
          toggleStock={toggleStock} 
          onNext={() => setCurrentPage(4)} 
          onBack={() => setCurrentPage(2)} 
        />
      )}
      {currentPage === 4 && (
        <StrategyPage 
          config={config} 
          updateConfig={updateConfig} 
          onRun={runBacktest} 
          onBack={() => setCurrentPage(3)} 
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
