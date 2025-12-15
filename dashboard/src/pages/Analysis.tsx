import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchStockData } from '../api/stockApi'
import type { StockData } from '../types/stock'

export default function Analysis() {
  const [ticker, setTicker] = useState('')
  const [stockData, setStockData] = useState<StockData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError(null)
    setStockData([])
    setCompanyName('')

    const result = await fetchStockData(ticker, 90)

    if (result.error) {
      setError(result.error)
    } else {
      setStockData(result.data)
      setCompanyName(result.symbol)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Stock Price Analysis</h2>
        
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker symbol (e.g., AAPL, MSFT, GOOGL)"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
            <p className="text-sm mt-2 text-red-400">
              Note: Using demo API key with rate limits. Get your free API key at{' '}
              <a 
                href="https://www.alphavantage.co/support/#api-key" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-red-300"
              >
                Alpha Vantage
              </a>
            </p>
          </div>
        )}

        {stockData.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">
              {companyName} - Stock Price (Last 90 Days)
            </h3>
            
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    border: '1px solid #374151', 
                    borderRadius: '4px',
                    color: '#f3f4f6'
                  }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  labelFormatter={(label) => {
                    const date = new Date(label)
                    return date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  }}
                />
                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  name="Closing Price"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="open" 
                  stroke="#34d399" 
                  strokeWidth={1}
                  name="Opening Price"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Current Price:</span>
                <p className="text-lg font-semibold text-white">
                  ${stockData[stockData.length - 1]?.close.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">90-Day High:</span>
                <p className="text-lg font-semibold text-green-400">
                  ${Math.max(...stockData.map(d => d.high)).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">90-Day Low:</span>
                <p className="text-lg font-semibold text-red-400">
                  ${Math.min(...stockData.map(d => d.low)).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Avg Volume:</span>
                <p className="text-lg font-semibold text-white">
                  {Math.round(stockData.reduce((sum, d) => sum + d.volume, 0) / stockData.length).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
