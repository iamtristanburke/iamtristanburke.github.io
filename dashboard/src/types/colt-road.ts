export interface Stock {
  ticker: string;
  name: string;
  marketCap: number;
  pe: number;
  divYield: number;
  /** 3-year revenue CAGR in percent (null when unavailable). */
  revenueGrowth3y?: number | null;
  sector: string;
  index: 'SP500' | 'RUSSELL2000';
}

export interface StrategyParams {
  enabled: boolean;
  [key: string]: any;
}

/** Q1: Market factors that inform debt/equity allocation (Colt Road rebalances based on these) */
export interface MarketFactors {
  realBondYieldNote?: string;
  equityValuationNote?: string;
  buffettRatioNote?: string;
}

/** Q1: Current macro snapshot — cited stats and ratios for stocks vs bonds (regularly updated) */
export interface MarketMacroSnapshot {
  asOf: string;
  /** Colt Road daily commentary on macro and credit vs. equity (updated daily) */
  dailyCommentary: string;
  tenYearTreasuryYieldPct: number;
  twoYearTreasuryYieldPct: number;
  sp500ForwardPE: number;
  equityRiskPremiumEstimatePct: number;
  fedFundsRatePct: number;
  inflationCpiYoYPct: number;
  investmentGradeCorpSpreadBps: number;
  dividendYieldSp500Pct: number;
  /** S&P 500 earnings yield (100 / forward P/E); Fed model input */
  earningsYieldSp500Pct: number;
  /** Fed model: earnings yield minus 10Y Treasury; positive = stocks favored vs bonds */
  fedModelSpreadPct: number;
  /** Buffett indicator: market cap / GDP × 100; ~100 = fair, &gt;100 = expensive */
  buffettIndicatorPct: number;
  /** Yield curve: 10Y minus 2Y (bps or %); negative = inverted */
  yieldCurveSpreadPct: number;
  /** Real 10Y yield: 10Y Treasury minus CPI inflation */
  realTenYearYieldPct: number;
  /** Colt Road's daily baseline equity % (stock/bond split from macro alone); personal factors amend this */
  aiBaselineEquityPct: number;
  /** Short rationale for Colt Road's baseline split (daily perspective) */
  aiBaselineRationale: string;
}

/** Q1: Personal inputs for asset allocation (Colt Road uses these to suggest stocks/bonds mix) */
export interface PersonalFactors {
  timeHorizonYears: number;
  age: number;
  riskAppetite: 'conservative' | 'moderate' | 'aggressive';
  maxAcceptableLossPct: number;
  ifPortfolioDropped20: 'sell' | 'reduce' | 'hold' | 'add';
  avoidShortTermLosses: 'very' | 'somewhat' | 'notVery';
  /** % of total assets in this liquid portfolio (25 | 50 | 75 | 100 band). Higher % → more conservative. */
  pctOfAssetsInLiquidPortfolio: 25 | 50 | 75 | 100;
  /** Approximate value of real estate holdings (primary residence, investment property, etc.) */
  realEstateValue: number;
  /** Approximate value of alternative investments (private equity, hedge funds, commodities, etc.) */
  alternativeInvestmentsValue: number;
}

/** Q2: Investment style and themes */
export type InvestmentStyle = 'growth' | 'income' | 'balanced';
export type BuySignalType = 'technical' | 'fundamental' | 'ai';

/** Q3: What prompts buys/sells within the portfolio */
export type BalanceSignalType = 'technical' | 'ai' | 'other';

/** Exactly one trading strategy is active; backtest applies it retroactively. */
export type TradingStrategyId =
  | 'buyAndHold'
  | 'momentum'
  | 'meanReversion'
  | 'movingAverage'
  | 'breakout'
  | 'contrarian'
  | 'technical';

export const TRADING_STRATEGY_DISPLAY_NAMES: Record<TradingStrategyId, string> = {
  buyAndHold: 'Buy and Hold',
  momentum: 'Momentum',
  meanReversion: 'Mean Reversion',
  movingAverage: 'Moving Average Crossover',
  breakout: 'Breakout',
  contrarian: 'Contrarian',
  technical: 'Technical Indicators'
};

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
    buyAndHold?: StrategyParams;
    momentum?: StrategyParams;
    meanReversion?: StrategyParams;
    movingAverage?: StrategyParams;
    breakout?: StrategyParams;
    contrarian?: StrategyParams;
    technical?: StrategyParams;
  };
  // Q1: Debt/Equity – personal & context (market factors are Colt Road–driven)
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

export interface StrategyComparisonEntry {
  strategyId: TradingStrategyId;
  strategyName: string;
  annualizedReturnByPeriod: Record<string, number>;
  totalReturnByPeriod: Record<string, number>;
}

export interface SensitivityCell {
  annualized5Y: number;
  annualized10Y: number;
}

export interface SensitivityResult {
  strategyId: TradingStrategyId;
  strategyName: string;
  param1: { key: string; label: string; values: number[] };
  param2?: { key: string; label: string; values: number[] };
  /** matrix[row][col] — row = param1 index, col = param2 index (or col=0 for 1-param) */
  matrix: SensitivityCell[][];
  currentParam1Idx: number;
  currentParam2Idx: number;
}

export interface BacktestResults {
  periods: PeriodResult[];
  /** ISO date (YYYY-MM-DD) when historical price data was last updated. All returns are derived from this data. */
  lastUpdated: string;
  strategyComparison?: StrategyComparisonEntry[];
  sensitivity?: SensitivityResult;
}

export interface HistoricalReturns {
  equity: number[];
  bonds: number[];
  sp500: number[];
}

/** Per-ticker monthly series: dates (YYYY-MM-DD), prices (adjusted close). */
export interface HistoricalPriceSeries {
  dates: string[];
  prices: number[];
}

/** All tickers' historical data. Keys: ticker symbol (e.g. AAPL, SPY, AGG). */
export type HistoricalPrices = Record<string, HistoricalPriceSeries>;

/** Bundled file: lastUpdated date and per-ticker monthly prices (adjusted close). Auditable; no synthetic data. */
export interface HistoricalPricesData {
  lastUpdated: string;
  prices: Record<string, HistoricalPriceSeries>;
}

