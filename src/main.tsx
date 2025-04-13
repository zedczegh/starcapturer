
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { initializePreloadServices } from './services/preloadServices';
import { trackError } from './services/errorTracking';

// Initialize preloading services as early as possible
initializePreloadServices();

// Global error handler for unhandled exceptions
window.addEventListener('error', (event) => {
  trackError('unhandled-global-error', event.error || new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  trackError('unhandled-promise-rejection', event.reason || new Error('Unhandled promise rejection'), {
    reason: event.reason ? String(event.reason) : undefined
  });
});

// Add a specific handler for dynamic import errors
const originalImport = window.import;
window.import = function(...args) {
  return originalImport.apply(this, args).catch(error => {
    if (error.message && error.message.includes('Failed to fetch dynamically imported module')) {
      trackError('dynamic-import-error', error, { module: args[0] });
      
      // Attempt recovery by clearing cache and reloading the page
      try {
        // Clear browser cache for this domain
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        // Reload after a delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (e) {
        console.error('Cache clearing failed:', e);
      }
    }
    
    throw error;
  });
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <App />
          <Toaster />
          <SonnerToaster position="top-center" closeButton richColors />
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
