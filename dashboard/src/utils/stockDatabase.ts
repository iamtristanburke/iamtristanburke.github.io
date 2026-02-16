import { Stock } from '../types/colt-road';
import { SP500_STOCKS } from '../data/sp500Constituents';

/** S&P 500 only. Russell 2000 removed to keep the universe simple. */
export const generateStockDatabase = (): Stock[] => [...SP500_STOCKS];

export const ALL_STOCKS = generateStockDatabase();
