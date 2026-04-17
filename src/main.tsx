import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initNotifications } from './utils/notificationService'

// Pre-register Firebase SW
initNotifications();

createRoot(document.getElementById("root")!).render(<App />);
