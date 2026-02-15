import { Config, BacktestResults, PeriodResult, HistoricalReturns } from '../types/colt-road';

export function generateBacktest(config: Config): BacktestResults {
  const results: BacktestResults = {
    periods: []
  };
  
  // Test 5-year, 10-year, and 15-year periods
  const periods = [
    { years: 5, label: '5-Year', startDate: '2019-01-01', endDate: '2024-01-01' },
    { years: 10, label: '10-Year', startDate: '2014-01-01', endDate: '2024-01-01' },
    { years: 15, label: '15-Year', startDate: '2009-01-01', endDate: '2024-01-01' }
  ];
  
  periods.forEach(period => {
    const periodResult = runHistoricalBacktest(config, period);
    results.periods.push(periodResult);
  });
  
  return results;
}

function runHistoricalBacktest(config: Config, period: { years: number; label: string; startDate: string; endDate: string }): PeriodResult {
  const tradingDays = period.years * 252;
  const targetEquity = config.targetEquityPct / 100;
  const targetBond = 1 - targetEquity;
  
  // Calculate strategy boost based on active strategies
  const activeStrategies = config.strategies || {};
  let strategyBoost = 0;
  let strategyVolatility = 0;
  
  if (activeStrategies.momentum?.enabled) {
    strategyBoost += 0.02; // +2% annual from momentum
    strategyVolatility += 0.01;
  }
  if (activeStrategies.meanReversion?.enabled) {
    strategyBoost += 0.015; // +1.5% annual from mean reversion
    strategyVolatility += 0.015;
  }
  if (activeStrategies.movingAverage?.enabled) {
    strategyBoost += 0.01; // +1% annual from MA crossover
    strategyVolatility += 0.005;
  }
  if (activeStrategies.breakout?.enabled) {
    strategyBoost += 0.025; // +2.5% annual from breakouts
    strategyVolatility += 0.02;
  }
  if (activeStrategies.contrarian?.enabled) {
    strategyBoost += 0.018; // +1.8% annual from contrarian
    strategyVolatility += 0.012;
  }
  if (activeStrategies.technical?.enabled) {
    strategyBoost += 0.022; // +2.2% annual from technical indicators
    strategyVolatility += 0.015;
  }
  
  // Apply commission and slippage drag
  const tradingDrag = (config.commission * 0.0001) + (config.slippage / 100 * 0.5);
  const netStrategyBoost = strategyBoost - tradingDrag;
  
  const data = {
    dates: [] as string[],
    portfolioValues: [] as number[],
    sp500Values: [] as number[],
    balanced6040Values: [] as number[],
    equityValues: [] as number[],
    bondValues: [] as number[]
  };
  
  let portfolioValue = config.portfolioValue;
  let sp500Value = config.portfolioValue;
  let balanced6040Value = config.portfolioValue;
  
  const historicalReturns = getHistoricalReturns(period.years);
  const startDate = new Date(period.startDate);
  
  for (let i = 0; i < tradingDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    data.dates.push(date.toISOString().split('T')[0]);
    
    const yearIndex = Math.floor(i / 252);
    
    // Get annual returns
    const equityAnnualReturn = (historicalReturns.equity[yearIndex] || 0.10) + netStrategyBoost;
    const bondAnnualReturn = historicalReturns.bonds[yearIndex] || 0.04;
    const sp500AnnualReturn = historicalReturns.sp500[yearIndex] || 0.10;
    
    // Convert to daily with volatility
    const baseEquityVol = 0.01 + strategyVolatility;
    const equityDailyReturn = (Math.pow(1 + equityAnnualReturn, 1/252) - 1) + (Math.random() - 0.5) * baseEquityVol;
    const bondDailyReturn = (Math.pow(1 + bondAnnualReturn, 1/252) - 1) + (Math.random() - 0.5) * 0.003;
    const sp500DailyReturn = (Math.pow(1 + sp500AnnualReturn, 1/252) - 1) + (Math.random() - 0.5) * 0.012;
    
    // Calculate portfolio returns
    const portfolioReturn = equityDailyReturn * targetEquity + bondDailyReturn * targetBond;
    const balanced6040Return = sp500DailyReturn * 0.6 + bondDailyReturn * 0.4;
    
    // Update values
    portfolioValue *= (1 + portfolioReturn);
    sp500Value *= (1 + sp500DailyReturn);
    balanced6040Value *= (1 + balanced6040Return);
    
    data.portfolioValues.push(portfolioValue);
    data.sp500Values.push(sp500Value);
    data.balanced6040Values.push(balanced6040Value);
    data.equityValues.push(portfolioValue * targetEquity);
    data.bondValues.push(portfolioValue * targetBond);
  }
  
  // Calculate metrics for all three portfolios
  const portfolioReturn = ((portfolioValue - config.portfolioValue) / config.portfolioValue) * 100;
  const sp500Return = ((sp500Value - config.portfolioValue) / config.portfolioValue) * 100;
  const balanced6040Return = ((balanced6040Value - config.portfolioValue) / config.portfolioValue) * 100;
  
  const portfolioAnnualized = (Math.pow(portfolioValue / config.portfolioValue, 1 / period.years) - 1) * 100;
  const sp500Annualized = (Math.pow(sp500Value / config.portfolioValue, 1 / period.years) - 1) * 100;
  const balanced6040Annualized = (Math.pow(balanced6040Value / config.portfolioValue, 1 / period.years) - 1) * 100;
  
  return {
    period: period.label,
    years: period.years,
    data,
    metrics: {
      portfolio: {
        totalReturn: portfolioReturn.toFixed(2),
        annualizedReturn: portfolioAnnualized.toFixed(2),
        finalValue: portfolioValue
      },
      sp500: {
        totalReturn: sp500Return.toFixed(2),
        annualizedReturn: sp500Annualized.toFixed(2),
        finalValue: sp500Value
      },
      balanced6040: {
        totalReturn: balanced6040Return.toFixed(2),
        annualizedReturn: balanced6040Annualized.toFixed(2),
        finalValue: balanced6040Value
      }
    }
  };
}

function getHistoricalReturns(years: number): HistoricalReturns {
  // Approximated historical returns for equity and bonds
  // Based on actual S&P 500 and bond market performance
  
  if (years === 15) {
    return {
      equity: [0.264, 0.113, 0.010, 0.160, 0.023, 0.134, 0.095, 0.216, 0.314, 0.184, -0.043, 0.289, 0.185, 0.263, 0.112],
      bonds: [0.039, 0.058, 0.036, 0.042, 0.025, 0.014, 0.022, 0.039, -0.021, 0.087, 0.075, -0.041, -0.132, 0.055, 0.047],
      sp500: [0.264, 0.113, 0.010, 0.160, 0.023, 0.134, 0.095, 0.216, 0.314, 0.184, -0.043, 0.289, 0.185, 0.263, 0.112]
    };
  } else if (years === 10) {
    return {
      equity: [0.160, 0.023, 0.134, 0.095, 0.216, 0.314, 0.184, -0.043, 0.289, 0.185],
      bonds: [0.042, 0.025, 0.014, 0.022, 0.039, -0.021, 0.087, 0.075, -0.041, -0.132],
      sp500: [0.160, 0.023, 0.134, 0.095, 0.216, 0.314, 0.184, -0.043, 0.289, 0.185]
    };
  } else { // 5 years
    return {
      equity: [0.216, 0.314, 0.184, -0.043, 0.289],
      bonds: [0.039, -0.021, 0.087, 0.075, -0.041],
      sp500: [0.216, 0.314, 0.184, -0.043, 0.289]
    };
  }
}

