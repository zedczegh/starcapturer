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

const App = () => {
  // Check if the avatars bucket exists, create if it doesn't
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
        const userTagsBucketExists = buckets?.some(bucket => bucket.name === 'user_tags');
        
        if (!avatarsBucketExists) {
          // Create the avatars bucket if it doesn't exist
          console.log("Avatars bucket doesn't exist, creating...");
          const { error: bucketError } = await supabase.storage.createBucket('avatars', {
            public: true, // Make it publicly accessible
            fileSizeLimit: 2 * 1024 * 1024 // 2MB limit
          });
          
          if (bucketError) {
            console.error("Error creating avatars bucket:", bucketError);
            // Continue anyway, as this might be a permissions issue with the client
            // The policy is already set in the migration
          } else {
            console.log('Created avatars bucket successfully');
          }
        } else {
          console.log("Avatars bucket already exists");
        }
        
        if (!userTagsBucketExists) {
          // Create the user_tags bucket if it doesn't exist
          console.log("Creating user_tags bucket...");
          const { error: bucketError } = await supabase.storage.createBucket('user_tags', {
            public: true, // Make it publicly accessible
            fileSizeLimit: 1024 * 1024 * 1 // 1MB limit
          });
          
          if (bucketError) {
            console.error("Error creating user_tags bucket:", bucketError);
          } else {
            console.log('Created user_tags bucket successfully');
            
            // Create a directory structure for tag icons
            // This is a workaround as Supabase doesn't have a direct method to create directories
            const { error: uploadError } = await supabase.storage
              .from('user_tags')
              .upload('icons/.placeholder', new Blob([''], { type: 'text/plain' }));
            
            if (uploadError && !uploadError.message.includes('already exists')) {
              console.error('Error creating user_tags directory structure:', uploadError);
            }
          }
        } else {
          console.log("User tags bucket already exists");
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
