/**
 * Historical US equity risk premium (approx. 50 years).
 * ERP = implied or realized excess return of stocks over risk-free (e.g. 10Y Treasury).
 * Replace with Damodaran or FRED series for production.
 */
export interface EquityRiskPremiumPoint {
  year: number;
  erpPct: number;
}

/** 50-year series: 1975–2024. Plausible pattern from historical ERP (e.g. Damodaran-style). */
export const equityRiskPremiumHistory: EquityRiskPremiumPoint[] = [
  { year: 1975, erpPct: 5.2 }, { year: 1976, erpPct: 4.8 }, { year: 1977, erpPct: 3.9 }, { year: 1978, erpPct: 4.1 },
  { year: 1979, erpPct: 6.5 }, { year: 1980, erpPct: 4.2 }, { year: 1981, erpPct: 5.8 }, { year: 1982, erpPct: 6.1 },
  { year: 1983, erpPct: 4.5 }, { year: 1984, erpPct: 3.7 }, { year: 1985, erpPct: 4.0 }, { year: 1986, erpPct: 3.4 },
  { year: 1987, erpPct: 2.9 }, { year: 1988, erpPct: 4.2 }, { year: 1989, erpPct: 3.8 }, { year: 1990, erpPct: 3.2 },
  { year: 1991, erpPct: 4.5 }, { year: 1992, erpPct: 3.6 }, { year: 1993, erpPct: 3.2 }, { year: 1994, erpPct: 2.8 },
  { year: 1995, erpPct: 2.5 }, { year: 1996, erpPct: 2.4 }, { year: 1997, erpPct: 2.3 }, { year: 1998, erpPct: 2.2 },
  { year: 1999, erpPct: 2.1 }, { year: 2000, erpPct: 2.8 }, { year: 2001, erpPct: 3.6 }, { year: 2002, erpPct: 4.1 },
  { year: 2003, erpPct: 3.8 }, { year: 2004, erpPct: 3.4 }, { year: 2005, erpPct: 3.2 }, { year: 2006, erpPct: 3.0 },
  { year: 2007, erpPct: 3.5 }, { year: 2008, erpPct: 6.4 }, { year: 2009, erpPct: 5.2 }, { year: 2010, erpPct: 4.8 },
  { year: 2011, erpPct: 5.5 }, { year: 2012, erpPct: 4.6 }, { year: 2013, erpPct: 4.2 }, { year: 2014, erpPct: 4.0 },
  { year: 2015, erpPct: 4.5 }, { year: 2016, erpPct: 4.2 }, { year: 2017, erpPct: 3.8 }, { year: 2018, erpPct: 4.2 },
  { year: 2019, erpPct: 4.0 }, { year: 2020, erpPct: 4.8 }, { year: 2021, erpPct: 3.5 }, { year: 2022, erpPct: 4.6 },
  { year: 2023, erpPct: 4.2 }, { year: 2024, erpPct: 3.8 }
];
