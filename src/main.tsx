import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Keine Router-Bibliothek: Die Seite ist eine einzige Landingpage.
// Interne Navigation läuft über normale Anker (#buecher …) im selben Tab,
// Deep-Links über URL-Parameter (?buch=…, ?lang=…).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
