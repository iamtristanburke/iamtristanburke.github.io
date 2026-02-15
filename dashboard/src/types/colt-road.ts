export interface Stock {
  ticker: string;
  name: string;
  marketCap: number;
  pe: number;
  divYield: number;
  sector: string;
  index: 'SP500' | 'RUSSELL2000';
}

export interface StrategyParams {
  enabled: boolean;
  [key: string]: any;
}

export interface Config {
  portfolioValue: number;
  targetEquityPct: number;
  selectedStocks: string[];
  rebalanceFreq: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  commission: number;
  slippage: number;
  positionLimit: number;
  accountType: 'taxable' | 'ira' | 'roth';
  taxBracket: number;
  strategies: {
    momentum?: StrategyParams;
    meanReversion?: StrategyParams;
    movingAverage?: StrategyParams;
    breakout?: StrategyParams;
    contrarian?: StrategyParams;
    technical?: StrategyParams;
  };
}

export interface PeriodData {
  dates: string[];
  portfolioValues: number[];
  sp500Values: number[];
  balanced6040Values: number[];
  equityValues: number[];
  bondValues: number[];
}

export interface PeriodMetrics {
  totalReturn: string;
  annualizedReturn: string;
  finalValue: number;
}

export interface PeriodResult {
  period: string;
  years: number;
  data: PeriodData;
  metrics: {
    portfolio: PeriodMetrics;
    sp500: PeriodMetrics;
    balanced6040: PeriodMetrics;
  };
}

export interface BacktestResults {
  periods: PeriodResult[];
}

export interface HistoricalReturns {
  equity: number[];
  bonds: number[];
  sp500: number[];
}

