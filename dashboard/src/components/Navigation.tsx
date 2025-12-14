import { FaBolt, FaChartBar, FaDatabase, FaRobot } from 'react-icons/fa'

type Page = 'actions' | 'analysis' | 'data-sources' | 'model'

interface NavigationProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const tabs = [
    { id: 'actions' as Page, label: 'Actions', icon: FaBolt },
    { id: 'analysis' as Page, label: 'Analysis', icon: FaChartBar },
    { id: 'data-sources' as Page, label: 'Data Sources', icon: FaDatabase },
    { id: 'model' as Page, label: 'Model', icon: FaRobot },
  ]

  return (
    <nav className="mb-8">
      <ul className="flex gap-1 border-b border-gray-900">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <li key={tab.id}>
              <button
                onClick={() => onPageChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 transition-colors border-b-2 ${
                  currentPage === tab.id
                    ? 'text-red-500 border-red-500 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 border-transparent'
                }`}
              >
                <Icon />
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
