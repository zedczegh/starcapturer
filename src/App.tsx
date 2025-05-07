
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
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
import { toast } from 'sonner';

const App = () => {
  // Check if required buckets exist, create if they don't
  useEffect(() => {
    const checkAndCreateBuckets = async () => {
      try {
        console.log("Checking if required buckets exist...");
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error('Error listing buckets:', error);
          return;
        }
        
        const avatarsBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
        
        if (!avatarsBucketExists) {
          // Create the avatars bucket if it doesn't exist
          console.log("Avatars bucket doesn't exist, creating...");
          try {
            const { error: bucketError } = await supabase.storage.createBucket('avatars', {
              public: true, // Make it publicly accessible
              fileSizeLimit: 2 * 1024 * 1024 // 2MB limit
            });
            
            if (bucketError) {
              console.error("Error creating avatars bucket:", bucketError);
              toast.error("Error creating storage bucket. Some features may not work properly.");
            } else {
              console.log('Created avatars bucket successfully');
            }
          } catch (err) {
            console.error("Error creating bucket:", err);
            // Just log the error and continue, as the bucket might already exist
            // but not be visible due to permissions
          }
        } else {
          console.log("Avatars bucket already exists");
        }
        
        // Handle the user_tags bucket similarly
        const userTagsBucketExists = buckets?.some(bucket => bucket.name === 'user_tags');
        
        if (!userTagsBucketExists) {
          console.log("Creating user_tags bucket...");
          try {
            const { error: bucketError } = await supabase.storage.createBucket('user_tags', {
              public: true,
              fileSizeLimit: 1024 * 1024 * 1 // 1MB limit
            });
            
            if (bucketError) {
              console.error("Error creating user_tags bucket:", bucketError);
            } else {
              console.log('Created user_tags bucket successfully');
            }
          } catch (err) {
            console.error("Error creating user_tags bucket:", err);
          }
        }
      } catch (error) {
        console.error('Error checking/creating buckets:', error);
      }
    };
    
    checkAndCreateBuckets();
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <AuthProvider>
              <ModalProvider>
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
                    <Route path="/profile-mini/:id" element={<ProfileMini />} />
                    <Route path="/settings" element={<PreferencesPage />} />
                    <Route path="/manage-astro-spots" element={<ManageAstroSpots />} />
                    <Route path="/astro-spot/:id" element={<AstroSpotProfile />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster />
                </TooltipProvider>
              </ModalProvider>
            </AuthProvider>
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
