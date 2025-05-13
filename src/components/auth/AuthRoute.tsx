
import React, { Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoader from '../loaders/PageLoader';
import AuthDialog from './AuthDialog';

interface AuthRouteProps {
  returnUrl?: string;
}

const AuthRoute: React.FC<AuthRouteProps> = () => {
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/photo-points';
  
  // Preload the profile components when on the auth route
  useEffect(() => {
    // Preload components likely to be used after login
    const preloadComponents = async () => {
      // Use dynamic imports to preload components
      const imports = [
        import('../navbar/ProfileButton'),
        import('../profile/ProfileHeader')
      ];
      
      await Promise.all(imports);
    };
    
    // Execute preload in the background
    preloadComponents().catch(console.error);
  }, []);
  
  return (
    <Suspense fallback={<PageLoader />}>
      <div className="min-h-screen bg-cosmic-950 flex items-center justify-center p-4">
        <AuthDialog 
          open={true} 
          onOpenChange={() => {}} 
          returnTo={returnTo}
        />
      </div>
    </Suspense>
  );
};

export default AuthRoute;
