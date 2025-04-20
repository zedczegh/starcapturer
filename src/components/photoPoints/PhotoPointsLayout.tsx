
import React, { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';

interface PhotoPointsLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const PhotoPointsLayout: React.FC<PhotoPointsLayoutProps> = ({ 
  children,
  pageTitle
}) => {
  const { t } = useLanguage();
  
  // Default page title
  const title = pageTitle || t("Photo Points Nearby | Sky Viewer", "附近拍摄点 | 天空观测");
  
  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      {/* Use Helmet component for setting page title */}
      <Helmet>
        <title>{title}</title>
      </Helmet>
      
      {/* Navbar */}
      <NavBar />
      
      <div className="pt-20 md:pt-28 pb-20 will-change-transform">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PhotoPointsLayout;
