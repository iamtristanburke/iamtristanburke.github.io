/**
 * Formatted stock data point for charting
 */
export interface StockData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Raw time series data point from Alpha Vantage API
 */
export interface TimeSeriesDataPoint {
  '1. open': string
  '2. high': string
  '3. low': string
  '4. close': string
  '5. volume': string
}

/**
 * Raw time series response structure from Alpha Vantage API
 */
export interface TimeSeriesData {
  [date: string]: TimeSeriesDataPoint
}

/**
 * Meta data from Alpha Vantage API response
 */
export interface AlphaVantageMetaData {
  '1. Information': string
  '2. Symbol': string
  '3. Last Refreshed': string
  '4. Output Size': string
  '5. Time Zone': string
}

/**
 * Alpha Vantage API response structure
 */
export interface AlphaVantageResponse {
  'Meta Data'?: AlphaVantageMetaData
  'Time Series (Daily)'?: TimeSeriesData
  'Error Message'?: string
  'Note'?: string
}

/**
 * Formatted result from stock API fetch
 */
export interface StockDataResult {
  data: StockData[]
  symbol: string
  error?: string
}
