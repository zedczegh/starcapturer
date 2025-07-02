
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import PageLoader from '@/components/loaders/PageLoader';
import './App.css';

// Lazy load components
const Index = lazy(() => import('@/pages/Index'));
const LocationDetailsPage = lazy(() => import('@/pages/LocationDetails'));
const PhotoPointsPage = lazy(() => import('@/pages/PhotoPoints'));
const CommunityPage = lazy(() => import('@/pages/Community'));
const CollectionsPage = lazy(() => import('@/pages/Collections'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const UserProfilePage = lazy(() => import('@/pages/UserProfile'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const BortleNowPage = lazy(() => import('@/pages/BortleNow'));
const AboutPage = lazy(() => import('@/pages/About'));
const UsefulLinksPage = lazy(() => import('@/pages/UsefulLinks'));
const AstroSpotsPage = lazy(() => import('@/pages/AstroSpots'));
const AstroSpotDetailsPage = lazy(() => import('@/pages/AstroSpotDetails'));
const ManageAstroSpotsPage = lazy(() => import('@/pages/ManageAstroSpots'));
const MyReservationsPage = lazy(() => import('@/pages/MyReservations'));
const MessagesPage = lazy(() => import('@/pages/Messages'));
const SonificationProcessorPage = lazy(() => import('@/pages/SonificationProcessor'));
const SamplingCalculatorPage = lazy(() => import('@/pages/SamplingCalculator'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Router>
                <div className="min-h-screen">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/location/:coordinates" element={<LocationDetailsPage />} />
                      <Route path="/photo-points" element={<PhotoPointsPage />} />
                      <Route path="/community" element={<CommunityPage />} />
                      <Route path="/collections" element={<CollectionsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/user/:userId" element={<UserProfilePage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/bortle-now" element={<BortleNowPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/useful-links" element={<UsefulLinksPage />} />
                      <Route path="/astro-spots" element={<AstroSpotsPage />} />
                      <Route path="/astro-spot/:id" element={<AstroSpotDetailsPage />} />
                      <Route path="/manage-astro-spots" element={<ManageAstroSpotsPage />} />
                      <Route path="/my-reservations" element={<MyReservationsPage />} />
                      <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/sonification" element={<SonificationProcessorPage />} />
                      <Route path="/sampling-calculator" element={<SamplingCalculatorPage />} />
                    </Routes>
                  </Suspense>
                  <Toaster 
                    position="top-right"
                    expand={true}
                    richColors
                    closeButton
                  />
                </div>
              </Router>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
