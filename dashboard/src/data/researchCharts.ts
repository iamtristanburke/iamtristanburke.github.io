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

/** One row per allocation: equity % and 10-year annualized real return (approx). Used for historical regression. */
export interface AllocationReturn {
  equityPct: number;
  debtPct: number;
  /** 10-year annualized real return (e.g. 1972–2022 or similar long window), percent */
  realReturn10yPct: number;
  /** Worst 12-month drawdown (percent) over same history */
  maxDrawdownPct: number;
}

/** Historical 10Y annualized real returns and drawdowns by static allocation (stocks vs bonds). Source: S&P 500 + intermediate Treasuries, long-run. */
export const ALLOCATION_HISTORICAL: AllocationReturn[] = [
  { equityPct: 100, debtPct: 0, realReturn10yPct: 6.2, maxDrawdownPct: -51 },
  { equityPct: 80, debtPct: 20, realReturn10yPct: 5.7, maxDrawdownPct: -44 },
  { equityPct: 70, debtPct: 30, realReturn10yPct: 5.4, maxDrawdownPct: -40 },
  { equityPct: 60, debtPct: 40, realReturn10yPct: 5.1, maxDrawdownPct: -36 },
  { equityPct: 50, debtPct: 50, realReturn10yPct: 4.7, maxDrawdownPct: -32 },
  { equityPct: 40, debtPct: 60, realReturn10yPct: 4.3, maxDrawdownPct: -28 },
  { equityPct: 30, debtPct: 70, realReturn10yPct: 3.8, maxDrawdownPct: -24 },
  { equityPct: 20, debtPct: 80, realReturn10yPct: 3.2, maxDrawdownPct: -20 },
  { equityPct: 0, debtPct: 100, realReturn10yPct: 2.1, maxDrawdownPct: -15 }
];

/** Macro regime: label, period, and annualized real return for a few key mixes. Informs when each allocation worked. */
export interface RegimeReturn {
  regime: string;
  period: string;
  /** Real return (ann.) for 100% equity in this period, percent */
  r100e: number;
  /** 60/40 */
  r6040: number;
  /** 50/50 */
  r5050: number;
  /** 40/60 */
  r4060: number;
  /** 100% bonds */
  r0e: number;
  note: string;
}

export const ALLOCATION_BY_REGIME: RegimeReturn[] = [
  { regime: 'High inflation, stocks & bonds hurt', period: '1973–1981', r100e: -1.2, r6040: -0.4, r5050: 0.1, r4060: 0.5, r0e: -1.0, note: '50/50 and 40/60 held up best; equity-heavy suffered.' },
  { regime: 'Disinflation, bond bull', period: '1982–1999', r100e: 14.1, r6040: 11.2, r5050: 10.0, r4060: 8.8, r0e: 7.2, note: 'More equity = higher return; bonds still added ballast.' },
  { regime: 'Dot-com bust + recovery', period: '2000–2008', r100e: -2.5, r6040: 0.2, r5050: 1.0, r4060: 1.8, r0e: 3.5, note: '50/50 and 40/60 again minimized pain; 100% stocks lost.' },
  { regime: 'Low rates, QE', period: '2009–2021', r100e: 13.8, r6040: 9.5, r5050: 8.2, r4060: 6.9, r0e: 2.1, note: 'Equity-heavy won; 50/50 captured most gains with less volatility.' },
  { regime: 'Rates up, correlation positive', period: '2022', r100e: -18.1, r6040: -16.2, r5050: -14.8, r4060: -13.5, r0e: -13.0, note: 'Bonds did not hedge; 50/50 and 40/60 lost less than 60/40.' }
];
