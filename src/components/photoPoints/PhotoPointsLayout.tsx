
import React, { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import NavBar from '@/components/NavBar';
import AuthDialog from '@/components/auth/AuthDialog';

interface PhotoPointsLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const PhotoPointsLayout: React.FC<PhotoPointsLayoutProps> = ({ 
  children, 
  pageTitle = "AstroSIQS - Find the Best Stargazing Spots"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Find perfect spots for stargazing and astrophotography with SIQS ratings and real-time data" />
      </Helmet>
      
      <NavBar />
      
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
};

export default PhotoPointsLayout;
