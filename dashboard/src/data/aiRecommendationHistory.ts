/**
 * Quarterly view of Colt Road's recommended equities/bond split over time.
 * Aligned with Colt Road's Research: 50/50 neutral stance when 10Y is near current levels;
 * framework shifts toward more bonds when rates rise (duration risk), more equities when rates are very low.
 * Data: Feb 2020 – Feb 2025. Replace with FRED/API for production.
 */

export interface AIRecommendationMonth {
  year: number;
  month: number;
  /** 10Y Treasury yield (%), used in baseline formula */
  tenYYieldPct: number;
  /** Colt Road baseline equities % from Research-aligned framework. 10Y 4.25% → 50%. */
  suggestedEquityPct: number;
}

/** Research-aligned framework: neutral 50% at 4.25% 10Y; higher rates → more bonds (short duration); very low rates → more equities. Clamped 35–65. */
function suggestedEquityFromMacro(tenYYieldPct: number): number {
  const neutralRate = 4.25;
  const sensitivity = 6;
  const base = 50; // 50% at 4.25% 10Y (Colt Road Research 50/50 baseline)
  const raw = base - (tenYYieldPct - neutralRate) * sensitivity;
  return Math.round(Math.max(35, Math.min(65, raw)));
}

/** Monthly 10Y yield (approx.) Feb 2020 – Feb 2025. Source: FRED DGS10-style. */
const MONTHLY_10Y: { y: number; m: number; rate: number }[] = [
  { y: 2020, m: 2, rate: 1.53 }, { y: 2020, m: 3, rate: 1.0 }, { y: 2020, m: 4, rate: 0.65 }, { y: 2020, m: 5, rate: 0.66 },
  { y: 2020, m: 6, rate: 0.66 }, { y: 2020, m: 7, rate: 0.60 }, { y: 2020, m: 8, rate: 0.68 }, { y: 2020, m: 9, rate: 0.69 },
  { y: 2020, m: 10, rate: 0.78 }, { y: 2020, m: 11, rate: 0.88 }, { y: 2020, m: 12, rate: 0.93 },
  { y: 2021, m: 1, rate: 1.08 }, { y: 2021, m: 2, rate: 1.26 }, { y: 2021, m: 3, rate: 1.52 }, { y: 2021, m: 4, rate: 1.63 },
  { y: 2021, m: 5, rate: 1.58 }, { y: 2021, m: 6, rate: 1.50 }, { y: 2021, m: 7, rate: 1.30 }, { y: 2021, m: 8, rate: 1.30 },
  { y: 2021, m: 9, rate: 1.35 }, { y: 2021, m: 10, rate: 1.55 }, { y: 2021, m: 11, rate: 1.45 }, { y: 2021, m: 12, rate: 1.47 },
  { y: 2022, m: 1, rate: 1.76 }, { y: 2022, m: 2, rate: 1.92 }, { y: 2022, m: 3, rate: 2.13 }, { y: 2022, m: 4, rate: 2.72 },
  { y: 2022, m: 5, rate: 2.84 }, { y: 2022, m: 6, rate: 3.09 }, { y: 2022, m: 7, rate: 2.90 }, { y: 2022, m: 8, rate: 2.90 },
  { y: 2022, m: 9, rate: 3.45 }, { y: 2022, m: 10, rate: 3.98 }, { y: 2022, m: 11, rate: 3.70 }, { y: 2022, m: 12, rate: 3.62 },
  { y: 2023, m: 1, rate: 3.53 }, { y: 2023, m: 2, rate: 3.92 }, { y: 2023, m: 3, rate: 3.55 }, { y: 2023, m: 4, rate: 3.46 },
  { y: 2023, m: 5, rate: 3.57 }, { y: 2023, m: 6, rate: 3.81 }, { y: 2023, m: 7, rate: 3.97 }, { y: 2023, m: 8, rate: 4.18 },
  { y: 2023, m: 9, rate: 4.34 }, { y: 2023, m: 10, rate: 4.80 }, { y: 2023, m: 11, rate: 4.50 }, { y: 2023, m: 12, rate: 4.02 },
  { y: 2024, m: 1, rate: 4.06 }, { y: 2024, m: 2, rate: 4.25 }, { y: 2024, m: 3, rate: 4.22 }, { y: 2024, m: 4, rate: 4.54 },
  { y: 2024, m: 5, rate: 4.48 }, { y: 2024, m: 6, rate: 4.28 }, { y: 2024, m: 7, rate: 4.20 }, { y: 2024, m: 8, rate: 4.12 },
  { y: 2024, m: 9, rate: 3.72 }, { y: 2024, m: 10, rate: 4.22 }, { y: 2024, m: 11, rate: 4.35 }, { y: 2024, m: 12, rate: 4.39 },
  { y: 2025, m: 1, rate: 4.15 }, { y: 2025, m: 2, rate: 4.25 }
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const aiRecommendationHistory: AIRecommendationMonth[] = MONTHLY_10Y.map(({ y, m, rate }) => ({
  year: y,
  month: m,
  tenYYieldPct: rate,
  suggestedEquityPct: suggestedEquityFromMacro(rate)
}));

export function getMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Short form for chart x-axis: "Feb '20" to reduce crowding */
export function getMonthLabelShort(year: number, month: number): string {
  const yy = year % 100;
  return `${MONTH_NAMES[month - 1]} '${yy}`;
}

/** Quarter label for chart: "Q1 '20" */
export function getQuarterLabel(year: number, month: number): string {
  const q = Math.ceil(month / 3);
  const yy = year % 100;
  return `Q${q} '${yy}`;
}

/** End-of-quarter months only (Mar, Jun, Sep, Dec); include latest month if not already quarter-end */
export function getQuarterlyRecommendationHistory(monthly: AIRecommendationMonth[]): AIRecommendationMonth[] {
  const quarterMonths = [3, 6, 9, 12];
  const quarterly = monthly.filter((d) => quarterMonths.includes(d.month));
  const last = monthly[monthly.length - 1];
  if (last && !quarterMonths.includes(last.month)) {
    return [...quarterly, last];
  }
  return quarterly;
}
