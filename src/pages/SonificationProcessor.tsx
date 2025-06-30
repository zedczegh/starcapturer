
import React from 'react';
import NavBar from '@/components/NavBar';
import SonificationProcessor from '@/components/sonification/SonificationProcessor';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';

const SonificationProcessorPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? 'Astronomy Sonification | SIQS' : '天文声化 | SIQS'}</title>
        <meta 
          name="description" 
          content={language === 'en' 
            ? 'Transform astronomy images into harmonic tunes with AI-powered sonification'
            : '使用AI驱动的声化技术将天文图像转换为和声曲调'
          } 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
        <NavBar />
        
        <main className="container mx-auto px-4 py-8 pt-24">
          <SonificationProcessor />
        </main>
      </div>
    </>
  );
};

export default SonificationProcessorPage;
