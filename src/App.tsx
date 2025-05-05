
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { TooltipProvider } from './components/ui/tooltip';
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
import ManageAstroSpots from './pages/ManageAstroSpots';
import AstroSpotProfile from './pages/AstroSpotProfile';
import CommunityAstroSpots from './pages/CommunityAstroSpots';
import ProfileMini from "./pages/ProfileMini";
import Messages from './pages/Messages';
import './App.css';

// Create a query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1, // Only retry once
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
});

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          {/* Move QueryClientProvider to wrap AuthProvider to avoid re-renders */}
          <QueryClientProvider client={queryClient}>
            <Router>
              <AuthProvider>
                <TooltipProvider>
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </TooltipProvider>
              </AuthProvider>
            </Router>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
