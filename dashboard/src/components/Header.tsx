import { FaChartLine } from 'react-icons/fa'

export default function Header() {
  return (
    <header className="mb-8 border-b border-gray-900 pb-6">
      <div className="flex items-center gap-3">
        <FaChartLine className="text-red-500 text-7xl flex-shrink-0" />
        <div>
          <h1 className="text-4xl font-bold text-white">
            Smooth Brain Capital
          </h1>
          <p className="mt-2 text-gray-500">
            Trading Dashboard
          </p>
        </div>
      </div>
    </header>
  )
}
