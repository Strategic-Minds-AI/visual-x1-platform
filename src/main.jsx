import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
// Canonical X1 brand tokens, loaded once for every route. Pages used to import
// these individually, so a workspace without the import lost its palette.
import '@/styles/x1-brand-theme.css'
import { applyStoredTheme } from '@/hooks/useTheme'

applyStoredTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)