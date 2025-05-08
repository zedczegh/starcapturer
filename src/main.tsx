
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/sonner';
import { initializePreloadServices } from './services/preloadServices';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize preloading services as early as possible
initializePreloadServices();

// Create a query client with optimized settings for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime)
      retry: 1, // Only retry once
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
});

// Ensure Leaflet CSS is loaded
const ensureLeafletCSS = () => {
  if (typeof document !== 'undefined') {
    // Check if Leaflet CSS is already loaded
    const existingLink = document.querySelector('link[href*="leaflet.css"]');
    if (!existingLink) {
      console.log("Leaflet CSS not found, adding it");
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    } else {
      console.log("Leaflet CSS already loaded");
    }
  }
};

// Ensure Leaflet CSS is loaded immediately
ensureLeafletCSS();

// Create a wrapper component that uses hooks
const AppWithProviders = () => {
  const { theme } = useTheme();
  
  return (
    <>
      <App />
      <Toaster theme={theme} />
    </>
  );
};

// Add a DOMContentLoaded listener for better mobile performance
const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Root element not found, cannot render app");
    return;
  }

  console.log("Rendering app to root element");
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AppWithProviders />
            </LanguageProvider>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

// Check if document is already loaded, otherwise wait for it
if (document.readyState === 'loading') {
  console.log("Document still loading, waiting for DOMContentLoaded");
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  console.log("Document already loaded, rendering immediately");
  renderApp();
}
