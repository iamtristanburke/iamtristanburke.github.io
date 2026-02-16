/**
 * Data for Colt Road's Research charts: CAPE over time, stock-bond correlation.
 * CAPE: Shiller-style cyclically adjusted P/E (annual, simplified). Correlation: 10-year rolling.
 * Replace with live data (e.g. FRED, Shiller) for production.
 */

export interface CapeYear {
  year: number;
  cape: number;
}

/** S&P 500 CAPE ratio by year (simplified from Shiller-style series). */
export const CAPE_BY_YEAR: CapeYear[] = [
  { year: 1881, cape: 18.2 }, { year: 1890, cape: 14.1 }, { year: 1900, cape: 18.4 }, { year: 1910, cape: 12.5 },
  { year: 1920, cape: 5.6 }, { year: 1925, cape: 12.2 }, { year: 1929, cape: 32.6 }, { year: 1932, cape: 5.6 },
  { year: 1940, cape: 10.2 }, { year: 1950, cape: 12.0 }, { year: 1960, cape: 18.4 }, { year: 1970, cape: 15.2 },
  { year: 1980, cape: 8.3 }, { year: 1990, cape: 15.4 }, { year: 2000, cape: 43.8 }, { year: 2003, cape: 22.5 },
  { year: 2007, cape: 27.3 }, { year: 2009, cape: 13.3 }, { year: 2015, cape: 26.0 }, { year: 2020, cape: 30.4 },
  { year: 2022, cape: 27.2 }, { year: 2024, cape: 34.2 }, { year: 2025, cape: 32.1 }
];

export interface CorrelationYear {
  year: number;
  /** 10-year rolling correlation of stock and bond returns (decimal, e.g. -0.2 = -20%) */
  correlation: number;
}

/** Stock-bond return correlation by year (10-year rolling, simplified). Negative = bonds hedge stocks. */
export const STOCK_BOND_CORRELATION: CorrelationYear[] = [
  { year: 1926, correlation: 0.15 }, { year: 1935, correlation: 0.08 }, { year: 1945, correlation: -0.05 },
  { year: 1955, correlation: 0.12 }, { year: 1965, correlation: 0.18 }, { year: 1975, correlation: 0.42 },
  { year: 1985, correlation: 0.28 }, { year: 1995, correlation: -0.12 }, { year: 2000, correlation: -0.18 },
  { year: 2005, correlation: -0.22 }, { year: 2010, correlation: -0.25 }, { year: 2015, correlation: -0.18 },
  { year: 2019, correlation: -0.12 }, { year: 2020, correlation: 0.05 }, { year: 2022, correlation: 0.38 },
  { year: 2024, correlation: 0.32 }, { year: 2025, correlation: 0.28 }
];
