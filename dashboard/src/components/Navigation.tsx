type Page = 'home' | 'about' | 'projects'

interface NavigationProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className="mb-8">
      <ul className="flex gap-4">
        <li>
          <button
            onClick={() => onPageChange('home')}
            className={`transition-colors ${
              currentPage === 'home'
                ? 'text-white font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Home
          </button>
        </li>
        <li>
          <button
            onClick={() => onPageChange('about')}
            className={`transition-colors ${
              currentPage === 'about'
                ? 'text-white font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            About
          </button>
        </li>
        <li>
          <button
            onClick={() => onPageChange('projects')}
            className={`transition-colors ${
              currentPage === 'projects'
                ? 'text-white font-semibold'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Projects
          </button>
        </li>
      </ul>
    </nav>
  )
}
