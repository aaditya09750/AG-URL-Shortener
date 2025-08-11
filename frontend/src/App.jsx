import { ThemeProvider } from './contexts/ThemeContext'
import { AppProvider } from './contexts/AppContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Results from './components/Results'
import AdminPanel from './components/AdminPanel'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <div className="app">
          <Navbar />
          <main>
            <Hero />
            <Results />
          </main>
          <Footer />
          <AdminPanel />
        </div>
      </AppProvider>
    </ThemeProvider>
  )
}

export default App
