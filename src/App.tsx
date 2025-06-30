import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useBookingNotifications } from './hooks/useBookingNotifications';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components
import { LazyPhotoPointsNearby, LazyLocationDetails, LazyCommunityAstroSpots } from './components/lazy/LazyPhotoPoints';

// Keep light components as regular imports
import IndexPage from './pages/Index';
import NotFound from './pages/NotFound';
import AboutSIQS from './pages/AboutSIQS';
import About from './pages/About';
import UsefulLinks from './pages/UsefulLinks';
import ShareLocation from './pages/ShareLocation';
import Collections from './pages/Collections';
import Profile from './pages/Profile';
import PreferencesPage from './pages/Preferences';
import ManageAstroSpots from './pages/ManageAstroSpots';
import AstroSpotProfile from './pages/AstroSpotProfile';
import ProfileMini from "./pages/ProfileMini";
import Messages from './pages/Messages';
import MyReservations from './pages/MyReservations';
import ServiceTest from './pages/ServiceTest';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

import useAppInitializer from './hooks/useAppInitializer';

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-cosmic-200">Loading...</p>
    </div>
  </div>
);

function AppContent() {
  // Add the booking notifications hook
  useBookingNotifications();
  
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/photo-points" replace />} />
      <Route path="/photo-points" element={
        <Suspense fallback={<LoadingFallback />}>
          <LazyPhotoPointsNearby />
        </Suspense>
      } />
      <Route path="/community" element={
        <Suspense fallback={<LoadingFallback />}>
          <LazyCommunityAstroSpots />
        </Suspense>
      } />
      <Route path="/about-siqs" element={<AboutSIQS />} />
      <Route path="/about" element={<About />} />
      <Route path="/location/:id" element={
        <Suspense fallback={<LoadingFallback />}>
          <LazyLocationDetails />
        </Suspense>
      } />
      <Route path="/location/siqs-calculator" element={
        <Suspense fallback={<LoadingFallback />}>
          <LazyLocationDetails />
        </Suspense>
      } />
      <Route path="/links" element={<UsefulLinks />} />
      <Route path="/useful-links" element={<UsefulLinks />} />
      <Route path="/share" element={<ShareLocation />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:id" element={<ProfileMini />} />
      <Route path="/settings" element={<PreferencesPage />} />
      <Route path="/manage-astro-spots" element={<ManageAstroSpots />} />
      <Route path="/astro-spot/:id" element={<AstroSpotProfile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/my-reservations" element={<MyReservations />} />
      <Route path="/service-test" element={<ServiceTest />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  // Add the initializer hook to setup performance optimizations
  useAppInitializer();
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <Router>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </Router>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
