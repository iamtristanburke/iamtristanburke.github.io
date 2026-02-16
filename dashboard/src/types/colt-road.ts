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

/** Q1: Market factors that inform debt/equity allocation (AI rebalances based on these) */
export interface MarketFactors {
  realBondYieldNote?: string;
  equityValuationNote?: string;
  buffettRatioNote?: string;
}

/** Q1: Personal inputs for debt/equity split (AI uses these to suggest allocation) */
export interface PersonalFactors {
  timeHorizonYears: number;
  age: number;
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  /** Largest portfolio drop in a bad year you could tolerate (%) */
  maxAcceptableLossPct: number;
  /** If your portfolio dropped 20% in a year, you would... */
  ifPortfolioDropped20: 'sell' | 'reduce' | 'hold' | 'add';
  /** How important is avoiding short-term losses? */
  avoidShortTermLosses: 'very' | 'somewhat' | 'notVery';
}

/** Q2: Investment style and themes */
export type InvestmentStyle = 'growth' | 'income' | 'balanced';
export type BuySignalType = 'technical' | 'fundamental' | 'ai';

/** Q3: What prompts buys/sells within the portfolio */
export type BalanceSignalType = 'technical' | 'ai' | 'other';

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
  // Q1: Debt/Equity – personal & context (market factors are AI-driven)
  personalFactors?: PersonalFactors;
  // Q2: What stocks – style, themes, buy signals
  investmentStyle?: InvestmentStyle;
  themes: string[];
  buySignals: { technical: boolean; fundamental: boolean; ai: boolean };
  // Q3: Portfolio balance – what triggers trades
  balanceSignals: { technical: boolean; ai: boolean; other: boolean };
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

