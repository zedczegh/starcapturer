
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BackgroundProvider } from './contexts/BackgroundContext';
import IndexPage from './pages/Index';
import PhotoPointsNearby from './pages/PhotoPointsNearby';
import NotFound from './pages/NotFound';
import AboutSIQS from './pages/AboutSIQS';
import About from './pages/About';
import LocationDetails from './pages/LocationDetails';
import UsefulLinks from './pages/UsefulLinks';
import ShareLocation from './pages/ShareLocation';
import './App.css';
import BackgroundSwitcher from './components/BackgroundSwitcher';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <BackgroundProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<IndexPage />} />
                  <Route path="/photo-points" element={<PhotoPointsNearby />} />
                  <Route path="/about-siqs" element={<AboutSIQS />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/location/:id" element={<LocationDetails />} />
                  <Route path="/links" element={<UsefulLinks />} />
                  <Route path="/useful-links" element={<UsefulLinks />} />
                  <Route path="/share" element={<ShareLocation />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <BackgroundSwitcher />
                <Toaster />
              </Router>
            </BackgroundProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
