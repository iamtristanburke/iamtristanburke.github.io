import { useState } from 'react'
import MainLayout from './layouts/MainLayout'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import About from './pages/About'
import Projects from './pages/Projects'

type Page = 'home' | 'about' | 'projects'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />
      case 'about':
        return <About />
      case 'projects':
        return <Projects />
      default:
        return <Home />
    }
  }

  return (
    <MainLayout>
      <Header />
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      {renderPage()}
    </MainLayout>
  )
}

export default App
