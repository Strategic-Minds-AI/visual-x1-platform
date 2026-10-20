import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
// Canonical X1 brand tokens, loaded once for every route. Pages used to import
// these individually, so a workspace without the import lost its palette.
import '@/styles/x1-brand-theme.css'
// The portal stylesheet — the X1 pricing page, the client portal and the /admin
// console all render with it — is loaded once for the whole app, so every route
// shares one set of component classes and one base look.
import '../vendor/x1/CommercePortal.css'
// Resolves the stock palette utilities still named by the earlier workspaces
// onto that portal palette. Last, so it settles after Tailwind's utilities.
import '@/styles/x1-portal-bridge.css'
import { applyStoredTheme } from '@/hooks/useTheme'

applyStoredTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)