import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom' // Ganti BrowserRouter dengan HashRouter
import './index.css'
import App from './App.jsx'
import FreeOfferPage from './components/FreeOfferPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter> {/* Ganti BrowserRouter dengan HashRouter */}
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/free-offer" element={<FreeOfferPage />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
