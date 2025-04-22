
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import IndexPage from './pages/Index';
import PhotoPointsNearby from './pages/PhotoPointsNearby';
import NotFound from './pages/NotFound';
import AboutSIQS from './pages/AboutSIQS';
import About from './pages/About';
import LocationDetails from './pages/LocationDetails';
import UsefulLinks from './pages/UsefulLinks';
import ShareLocation from './pages/ShareLocation';
import Collections from './pages/Collections';
import Profile from './pages/Profile';
import PreferencesPage from './pages/Preferences';
import CreateAstroSpot from '@/pages/CreateAstroSpot';
import MyAstroSpots from '@/pages/MyAstroSpots';
import './App.css';

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
            <Router>
              <AuthProvider>
                <Routes>
                  {/* Redirect root to photo-points */}
                  <Route path="/" element={<Navigate to="/photo-points" replace />} />
                  <Route path="/photo-points" element={<PhotoPointsNearby />} />
                  <Route path="/about-siqs" element={<AboutSIQS />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/location/:id" element={<LocationDetails />} />
                  <Route path="/location/siqs-calculator" element={<LocationDetails />} />
                  <Route path="/links" element={<UsefulLinks />} />
                  <Route path="/useful-links" element={<UsefulLinks />} />
                  <Route path="/share" element={<ShareLocation />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<PreferencesPage />} />
                  <Route path="/create-astro-spot" element={<CreateAstroSpot />} />
                  <Route path="/my-astro-spots" element={<MyAstroSpots />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AuthProvider>
            </Router>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
