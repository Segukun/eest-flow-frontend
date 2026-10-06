import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './index.css'
import { initializeTheme } from './theme.js'

const stopThemeSync = initializeTheme()
if (import.meta.hot) import.meta.hot.dispose(stopThemeSync)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
