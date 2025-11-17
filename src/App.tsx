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
import NotFound from './pages/NotFound';
import About from './pages/About';
import UsefulLinks from './pages/UsefulLinks';
import ShareLocation from './pages/ShareLocation';
import Collections from './pages/Collections';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import ProfileSettings from './pages/ProfileSettings';
import WalletSettings from './pages/WalletSettings';
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
import ParallelVideoGenerator from './pages/ParallelVideoGenerator';
import CriticalAnalysis from './pages/CriticalAnalysis';
import DeveloperPage from './pages/about/DeveloperPage';
import UtilitiesPage from './pages/about/UtilitiesPage';
import SiqsPage from './pages/about/SiqsPage';
import DarkSkyPage from './pages/about/DarkSkyPage';
import ResourcesPage from './pages/about/ResourcesPage';
import SeedObscuraSpots from './pages/SeedObscuraSpots';

const LazySpaceStationTracker = lazy(() => import('./pages/SpaceStationTracker'));
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2, // Increased from 1 for better reliability
      staleTime: 5 * 60 * 1000, // 5 minutes for better caching
      gcTime: 10 * 60 * 1000, // 10 minutes - increased for better memory usage
      refetchOnReconnect: 'always',
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 2, // Increased from 1
      networkMode: 'online',
    },
  },
});

import useAppInitializer from './hooks/useAppInitializer';
import { EnhancedLoadingFallback } from './components/ui/enhanced-loading';
import { useLanguage } from '@/contexts/LanguageContext';

// Simple loading fallback that doesn't need language context
const SimpleLoadingFallback = () => (
  <EnhancedLoadingFallback 
    message="Into the Unknown"
    variant="detailed"
  />
);

// Language-aware loading fallback for use within providers
const LanguageAwareLoadingFallback = () => {
  const { t, language } = useLanguage();
  
  return (
    <EnhancedLoadingFallback 
      message={language === 'zh' ? "让我们共赴山海！" : "Into the Unknown"}
      variant="detailed"
    />
  );
};

function AppContent() {
  // Add the booking notifications hook
  useBookingNotifications();
  
  return (
    <Routes>
      <Route path="/" element={
        <Suspense fallback={<SimpleLoadingFallback />}>
          <LazyCommunityAstroSpots />
        </Suspense>
      } />
      {/* Redirect deprecated /calculator route to community page */}
      <Route path="/calculator" element={<Navigate to="/" replace />} />
      <Route path="/photo-points" element={
        <Suspense fallback={<SimpleLoadingFallback />}>
          <LazyPhotoPointsNearby />
        </Suspense>
      } />
      <Route path="/about" element={<About />} />
      <Route path="/about/developer" element={<DeveloperPage />} />
      <Route path="/about/utilities" element={<UtilitiesPage />} />
      <Route path="/about/siqs" element={<SiqsPage />} />
      <Route path="/about/darksky" element={<DarkSkyPage />} />
      <Route path="/about/resources" element={<ResourcesPage />} />
      <Route path="/about-siqs" element={<Navigate to="/about/siqs" replace />} />
      <Route path="/location/:id" element={
        <ErrorBoundary>
          <Suspense fallback={<SimpleLoadingFallback />}>
            <LazyLocationDetails />
          </Suspense>
        </ErrorBoundary>
      } />
      <Route path="/location/siqs-calculator" element={
        <Suspense fallback={<SimpleLoadingFallback />}>
          <LazyLocationDetails />
        </Suspense>
      } />
      <Route path="/links" element={<UsefulLinks />} />
      <Route path="/useful-links" element={<UsefulLinks />} />
      <Route path="/share" element={<ShareLocation />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="/profile/settings" element={<ProfileSettings />} />
      <Route path="/profile/wallet" element={<WalletSettings />} />
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
      <Route path="/parallel-video-generator" element={<ParallelVideoGenerator />} />
      <Route path="/critical-analysis" element={<CriticalAnalysis />} />
      <Route path="/space-tracker" element={
        <Suspense fallback={<SimpleLoadingFallback />}>
          <LazySpaceStationTracker />
        </Suspense>
      } />
      <Route path="/service-test" element={<ServiceTest />} />
      <Route path="/admin/verification" element={<VerificationApplicationsManager />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/seed-obscura-spots" element={<SeedObscuraSpots />} />
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
