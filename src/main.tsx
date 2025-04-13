
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

// Initialize preloading services as early as possible
initializePreloadServices();

// Error tracking for better debugging
const trackError = (error: Error) => {
  console.error('Application error:', error);
  // Send to error tracking service if available
};

// Global error handler
window.addEventListener('error', (event) => {
  trackError(event.error);
});

// Protect from unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  trackError(event.reason);
});

// Safer dynamic imports with fallbacks
const safeImport = async (path: string) => {
  try {
    return await import(/* @vite-ignore */ path);
  } catch (err) {
    console.error(`Failed to load module: ${path}`, err);
    throw err;
  }
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
