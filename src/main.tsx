import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Safely suppress benign iframe noise (ResizeObserver loop and sandboxed ServiceWorker)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (
      e.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
      e.message?.includes('ResizeObserver loop limit exceeded')
    ) {
      e.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    if (
      e.reason?.message?.includes('ResizeObserver') ||
      e.reason?.message?.includes('The play() request was interrupted') ||
      e.reason?.name === 'AbortError'
    ) {
      e.preventDefault();
    }
  });

  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Gracefully handled for sandboxed/iframe preview contexts
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallbackTitle="Buzzing Brain Portal">
    <App />
  </ErrorBoundary>
);

