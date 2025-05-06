
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { supabase } from './integrations/supabase/client';
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

const App = () => {
  // Check if the avatars bucket exists, create if it doesn't
  useEffect(() => {
    const checkAndCreateAvatarsBucket = async () => {
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
        
        if (!avatarsBucketExists) {
          // Create the avatars bucket if it doesn't exist
          const { data, error } = await supabase.storage.createBucket('avatars', {
            public: true, // Make it publicly accessible
            fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
          });
          
          if (error) {
            console.error('Error creating avatars bucket:', error);
          } else {
            console.log('Created avatars bucket successfully');
          }
        }
      } catch (error) {
        console.error('Error checking/creating avatars bucket:', error);
      }
    };
    
    checkAndCreateAvatarsBucket();
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
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
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
