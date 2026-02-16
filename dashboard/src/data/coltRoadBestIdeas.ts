/**
 * Colt Road's 15 Best Ideas — S&P 500 names that best fit the Structural Alpha methodology
 * (Thematic Universe + Piotroski F-Score ≥7, ROIC > WACC, Shareholder Yield > 0, ranked by Value/Quality/Yield).
 * convictionScore: 0–100 attractiveness based on quantitative (Value 40%, Quality 40%, Yield 20%) and
 * qualitative (thematic fit, durability of moat) factors from Research on Stock Picking (#2).
 */

export interface ColtRoadBestIdea {
  ticker: string;
  name: string;
  theme: string;
  /** Colt Road attractiveness score 0–100 from Structural Alpha composite + qualitative fit. Used for conviction weighting. */
  convictionScore: number;
}

export const COLT_ROAD_BEST_IDEAS: ColtRoadBestIdea[] = [
  // AI Physical Infrastructure — scores reflect EBIT/EV, GP/Assets, shareholder yield, thematic fit
  { ticker: 'ETN', name: 'Eaton', theme: 'AI Physical Infrastructure: Power management, electrical grid, data center power', convictionScore: 92 },
  { ticker: 'NEE', name: 'NextEra Energy', theme: 'AI Physical Infrastructure: Utilities, power for growth', convictionScore: 90 },
  { ticker: 'MSFT', name: 'Microsoft', theme: 'AI Physical Infrastructure: Cloud/data centers, power-efficient software', convictionScore: 88 },
  { ticker: 'EQIX', name: 'Equinix', theme: 'AI Physical Infrastructure: Data centers, interconnection', convictionScore: 84 },
  { ticker: 'GOOGL', name: 'Alphabet', theme: 'AI Physical Infrastructure: Data centers, AI infrastructure', convictionScore: 82 },
  { ticker: 'AMZN', name: 'Amazon', theme: 'AI Physical Infrastructure: AWS, data centers, logistics', convictionScore: 78 },
  // Silver Economy — quality, yield, demographic tailwind
  { ticker: 'ABBV', name: 'AbbVie', theme: 'Silver Economy: Pharma, durable cash flows', convictionScore: 91 },
  { ticker: 'JNJ', name: 'Johnson & Johnson', theme: 'Silver Economy: Pharma, MedTech, healthcare', convictionScore: 89 },
  { ticker: 'UNH', name: 'UnitedHealth Group', theme: 'Silver Economy: Healthcare services, senior care', convictionScore: 87 },
  { ticker: 'ABT', name: 'Abbott Laboratories', theme: 'Silver Economy: MedTech, diagnostics, nutrition', convictionScore: 86 },
  { ticker: 'MDT', name: 'Medtronic', theme: 'Silver Economy: MedTech, devices', convictionScore: 85 },
  // Industrial Reshoring — defense, automation, pricing power
  { ticker: 'LMT', name: 'Lockheed Martin', theme: 'Industrial Reshoring: Defense, critical infrastructure', convictionScore: 88 },
  { ticker: 'HON', name: 'Honeywell', theme: 'Industrial Reshoring: Automation, aerospace, building tech', convictionScore: 86 },
  { ticker: 'GD', name: 'General Dynamics', theme: 'Industrial Reshoring: Defense, aerospace', convictionScore: 85 },
  { ticker: 'CAT', name: 'Caterpillar', theme: 'Industrial Reshoring: Machinery, logistics support', convictionScore: 83 }
];

/** Ticker symbols only, for default selectedStocks. */
export const COLT_ROAD_BEST_IDEAS_TICKERS = COLT_ROAD_BEST_IDEAS.map(({ ticker }) => ticker);

/** Conviction score 0–100 by ticker. Best Ideas get their score; others get 0 (excluded from conviction-weight numerator). */
export const COLT_ROAD_CONVICTION_BY_TICKER: Record<string, number> = Object.fromEntries(
  COLT_ROAD_BEST_IDEAS.map((idea) => [idea.ticker, idea.convictionScore])
);
