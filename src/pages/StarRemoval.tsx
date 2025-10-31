import React from 'react';
import NavBar from '@/components/NavBar';
import StarRemovalProcessor from '@/components/star-removal/StarRemovalProcessor';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';

const StarRemovalPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? 'Star Removal Tool | SIQS' : '星点移除工具 | SIQS'}</title>
        <meta 
          name="description" 
          content={language === 'en' 
            ? 'Remove stars from deep sky astrophotography images to reveal nebulae and galaxies. StarNet/StarXTerminator-like processing for astronomy images.'
            : '从深空天体摄影图像中移除星点，揭示星云和星系。类似StarNet/StarXTerminator的天文图像处理工具。'
          } 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
        <NavBar />
        
        <main className="container mx-auto px-4 py-8 pt-24">
          <StarRemovalProcessor />
        </main>
      </div>
    </>
  );
};

export default StarRemovalPage;
