import { useState } from 'react'
import MainLayout from './layouts/MainLayout'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Actions from './pages/Actions'
import Analysis from './pages/Analysis'
import DataSources from './pages/DataSources'
import Model from './pages/Model'

type Page = 'actions' | 'analysis' | 'data-sources' | 'model'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('actions')

  const renderPage = () => {
    switch (currentPage) {
      case 'actions':
        return <Actions />
      case 'analysis':
        return <Analysis />
      case 'data-sources':
        return <DataSources />
      case 'model':
        return <Model />
      default:
        return <Actions />
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
