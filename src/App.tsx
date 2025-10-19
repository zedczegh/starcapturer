import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useBookingNotifications } from './hooks/useBookingNotifications';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components for better performance
const LazyPhotoPointsNearby = lazy(() => import('@/pages/PhotoPointsNearby'));
const LazyLocationDetails = lazy(() => import('@/pages/LocationDetails'));  
const LazyCommunityAstroSpots = lazy(() => import('@/pages/CommunityAstroSpots'));

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
import MyWallet from './pages/MyWallet';
import Messages from './pages/Messages';
import MyReservations from './pages/MyReservations';
import ServiceTest from './pages/ServiceTest';
import VerificationApplicationsManager from './components/admin/VerificationApplicationsManager';
import PaymentSuccess from './pages/PaymentSuccess';
import SonificationProcessor from './pages/SonificationProcessor';
import SamplingCalculator from './pages/SamplingCalculator';
import StereoscopeProcessor from './pages/StereoscopeProcessor';
import StarFieldGenerator from './pages/StarFieldGenerator';
import AstroMath from './pages/AstroMath';

const LazySpaceStationTracker = lazy(() => import('./pages/SpaceStationTracker'));
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 3 * 60 * 1000, // 3 minutes - reduced for faster updates
      gcTime: 5 * 60 * 1000, // 5 minutes - reduced to free memory faster
      refetchOnReconnect: 'always',
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

import useAppInitializer from './hooks/useAppInitializer';

import { EnhancedLoadingFallback } from './components/ui/enhanced-loading';

const LoadingFallback = () => (
  <EnhancedLoadingFallback 
    message="Opening your next starry journey..."
    variant="detailed"
    showProgress={true}
  />
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
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <LazyLocationDetails />
          </Suspense>
        </ErrorBoundary>
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
      <Route path="/my-wallet" element={<MyWallet />} />
      <Route path="/sonification" element={<SonificationProcessor />} />
      <Route path="/sampling-calculator" element={<SamplingCalculator />} />
      <Route path="/stereoscope" element={<StereoscopeProcessor />} />
      <Route path="/star-field-generator" element={<StarFieldGenerator />} />
      <Route path="/astro-math" element={<AstroMath />} />
      <Route path="/space-tracker" element={
        <Suspense fallback={<LoadingFallback />}>
          <LazySpaceStationTracker />
        </Suspense>
      } />
      <Route path="/service-test" element={<ServiceTest />} />
      <Route path="/admin/verification" element={<VerificationApplicationsManager />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
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
