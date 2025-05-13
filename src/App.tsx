
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import PageLoader from './components/loaders/PageLoader';
import useAppInitializer from './hooks/useAppInitializer';

// Lazy-loaded pages
const IndexPage = lazy(() => import('./pages/Index'));
const PhotoPointsNearby = lazy(() => import('./pages/PhotoPointsNearby'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AboutSIQS = lazy(() => import('./pages/AboutSIQS'));
const About = lazy(() => import('./pages/About'));
const LocationDetails = lazy(() => import('./pages/LocationDetails'));
const UsefulLinks = lazy(() => import('./pages/UsefulLinks'));
const ShareLocation = lazy(() => import('./pages/ShareLocation'));
const Collections = lazy(() => import('./pages/Collections'));
const Profile = lazy(() => import('./pages/Profile'));
const PreferencesPage = lazy(() => import('./pages/Preferences'));
const ManageAstroSpots = lazy(() => import('./pages/ManageAstroSpots'));
const AstroSpotProfile = lazy(() => import('./pages/AstroSpotProfile'));
const CommunityAstroSpots = lazy(() => import('./pages/CommunityAstroSpots'));
const ProfileMini = lazy(() => import('./pages/ProfileMini'));
const Messages = lazy(() => import('./pages/Messages'));
const AuthRoute = lazy(() => import('./components/auth/AuthRoute'));

// Configure query client with performance optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});

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
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/photo-points" replace />} />
                    <Route path="/photo-points" element={<PhotoPointsNearby />} />
                    <Route path="/community" element={<CommunityAstroSpots />} />
                    <Route path="/about-siqs" element={<AboutSIQS />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/location/:id" element={<LocationDetails />} />
                    <Route path="/location/siqs-calculator" element={<LocationDetails />} />
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
                    <Route path="/auth" element={<AuthRoute />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AuthProvider>
            </Router>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
