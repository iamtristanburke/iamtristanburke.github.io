import { Stock } from '../types/colt-road';
import { SP500_STOCKS } from '../data/sp500Constituents';

const RUSSELL_SECTORS = [
  'Information Technology',
  'Health Care',
  'Financials',
  'Consumer Discretionary',
  'Industrials',
  'Energy',
  'Consumer Staples',
  'Utilities',
  'Real Estate',
  'Materials',
  'Communication Services'
] as const;

export const generateStockDatabase = (): Stock[] => {
  const stocks: Stock[] = [...SP500_STOCKS];

  // Russell 2000 – placeholder small-cap universe (replace with real data when available)
  for (let i = 0; i < 100; i++) {
    stocks.push({
      ticker: `RSL${String(i).padStart(3, '0')}`,
      name: `Russell 2000 Company ${i + 1}`,
      marketCap: Math.max(500, 5000 - i * 40),
      pe: 10 + (i % 40),
      divYield: (i % 5) * 0.5,
      sector: RUSSELL_SECTORS[i % RUSSELL_SECTORS.length],
      index: 'RUSSELL2000'
    });
  }

  return stocks;
};

export const ALL_STOCKS = generateStockDatabase();
