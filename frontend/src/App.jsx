import { ThemeProvider } from './contexts/ThemeContext'
import { AppProvider } from './contexts/AppContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Results from './components/Results'
import AdminPanel from './components/AdminPanel'
import Footer from './components/Footer'
import ErrorNotification from './components/ErrorNotification'
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
          <ErrorNotification />
        </div>
      </AppProvider>
    </ThemeProvider>
  )
}

export default App
