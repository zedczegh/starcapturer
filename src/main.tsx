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

// Immediately start loading critical resources
if (typeof window !== 'undefined') {
  // Preconnect to important domains
  const preconnectLinks = [
    { rel: 'preconnect', href: 'https://api.open-meteo.com' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: 'https://api.open-meteo.com' }
  ];
  
  preconnectLinks.forEach(({ rel, href }) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    document.head.appendChild(link);
  });
}

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

// Define a thinner mount function for faster startup
function mount() {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  
  // Use concurrent mode features
  root.render(
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
    </React.StrictMode>,
  );
}

// Check if the document is already interactive
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  // If it is, mount immediately
  mount();
} else {
  // Otherwise, wait for DOMContentLoaded
  document.addEventListener('DOMContentLoaded', mount);
}
