import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Font Awesome self-hostovaný (dřív blokující <link> na cdnjs v index.html) —
// tabule tak nezávisí na dostupnosti CDN při startu po výpadku proudu.
import '@fortawesome/fontawesome-free/css/all.min.css'
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
