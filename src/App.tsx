
import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/sonner';
import './App.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { supabase } from './integrations/supabase/client';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Check and ensure avatars bucket exists on app initialization
    const checkAvatarsBucket = async () => {
      try {
        // Check if bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error('Error checking storage buckets:', bucketsError);
          return;
        }
        
        const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
        
        if (!avatarsBucketExists) {
          console.warn('Avatars bucket not found. Creating bucket...');
          const { error: createError } = await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
          });
          
          if (createError) {
            console.error('Failed to create avatars bucket:', createError);
            return;
          }
          
          console.log('Avatars bucket created successfully');
        } else {
          console.log('Avatars bucket already exists');
        }
      } catch (error) {
        console.error('Error ensuring avatars bucket exists:', error);
      }
    };
    
    checkAvatarsBucket();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Router>
                <AppRoutes />
                <Toaster richColors />
              </Router>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
