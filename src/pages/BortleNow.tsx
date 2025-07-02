
import React from 'react';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';
import BortleNowHeader from '@/components/bortleNow/BortleNowHeader';
import LocationSection from '@/components/bortleNow/LocationSection';

const BortleNow: React.FC = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? 'Bortle Now | SIQS' : '实时光污染 | SIQS'}</title>
        <meta 
          name="description" 
          content={language === 'en' 
            ? 'Measure real-time light pollution levels at your location'
            : '测量您所在位置的实时光污染水平'
          } 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
        <NavBar />
        
        <main className="container mx-auto px-4 py-8 pt-24">
          <BortleNowHeader />
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center text-cosmic-400">
              <p>{language === 'en' 
                ? 'This feature is currently under development.' 
                : '此功能正在开发中。'
              }</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BortleNow;
