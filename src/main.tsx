import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely register ServiceWorker with unhandled rejection protection in iframe
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Gracefully handled for sandboxed/iframe preview contexts
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

