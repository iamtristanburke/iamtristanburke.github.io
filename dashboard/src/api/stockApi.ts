import type {
  StockData,
  TimeSeriesData,
  AlphaVantageResponse,
  StockDataResult,
} from '../types/stock'

// Using Alpha Vantage demo API key - users can replace with their own free key
const API_KEY = 'M637EF7PMKHFY9AA'
const API_BASE_URL = 'https://www.alphavantage.co/query'

/**
 * Formats raw time series data from Alpha Vantage API into chart-ready format
 */
function formatTimeSeriesData(timeSeries: TimeSeriesData): StockData[] {
  return Object.entries(timeSeries)
    .map(([date, values]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/**
 * Validates and extracts error messages from Alpha Vantage API response
 */
function extractError(data: AlphaVantageResponse): string | null {
  if (data['Error Message']) {
    return data['Error Message']
  }

  if (data['Note']) {
    return 'API rate limit exceeded. Please try again later or use your own API key.'
  }

  return null
}

/**
 * Fetches daily stock time series data from Alpha Vantage API
 * @param symbol - Stock ticker symbol (e.g., 'AAPL', 'MSFT')
 * @param days - Number of days to retrieve (default: 90)
 * @returns Promise with formatted stock data or error
 */
export async function fetchStockData(
  symbol: string,
  days: number = 90
): Promise<StockDataResult> {
  if (!symbol.trim()) {
    return {
      data: [],
      symbol: symbol.toUpperCase(),
      error: 'Please enter a ticker symbol',
    }
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol.toUpperCase()}&apikey=${API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: AlphaVantageResponse = await response.json()

    // Check for API errors
    const error = extractError(data)
    if (error) {
      return {
        data: [],
        symbol: symbol.toUpperCase(),
        error,
      }
    }

    const timeSeries = data['Time Series (Daily)']

    if (!timeSeries) {
      return {
        data: [],
        symbol: symbol.toUpperCase(),
        error: 'No data found for this ticker symbol. Please check the symbol and try again.',
      }
    }

    // Format and limit the data
    const formattedData = formatTimeSeriesData(timeSeries).slice(-days)

    const symbolName =
      data['Meta Data']?.['2. Symbol'] || symbol.toUpperCase()

    return {
      data: formattedData,
      symbol: symbolName,
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : 'Failed to fetch stock data. Please check your connection and try again.'

    return {
      data: [],
      symbol: symbol.toUpperCase(),
      error: errorMessage,
    }
  }
}
