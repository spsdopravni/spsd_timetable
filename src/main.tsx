import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Font Awesome self-hostovaný (dřív blokující <link> na cdnjs v index.html) —
// tabule tak nezávisí na dostupnosti CDN při startu po výpadku proudu.
// Subset generuje scripts/fa-subset.mjs při každém buildu: 72 kB → 11 kB,
// protože z tisíců ikon jich používáme čtyřicet.
import './styles/fontawesome-subset.css'
import { installKioskRecovery } from './utils/kioskRecovery'

// Tabule běží 24/7 bez klávesnice — musí se umět zotavit sama.
installKioskRecovery()

// Notifikace (Firebase + Supabase) dávají smysl jen v mobilní PWA.
// Na desktopové tabuli by se jen zaregistroval SW navíc a při nedostupném
// gstatic to házelo "firebase is not defined". Proto jen na /m*.
if (location.pathname === '/m' || location.pathname.startsWith('/m/')) {
  import('./utils/notificationService').then(m => m.initNotifications())
}

createRoot(document.getElementById("root")!).render(<App />);
