import React from 'react';
import NavBar from '@/components/NavBar';
import StereoscopeProcessor from '@/components/stereoscope/StereoscopeProcessor';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';

const StereoscopeProcessorPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? 'Stereoscope Processor | SIQS' : '立体镜处理器 | SIQS'}</title>
        <meta 
          name="description" 
          content={language === 'en' 
            ? 'Convert 2D astronomy images into 3D stereoscopic pairs for immersive viewing'
            : '将2D天文图像转换为3D立体对，提供沉浸式观看体验'
          } 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
        <NavBar />
        
        <main className="pt-24">
          <StereoscopeProcessor />
        </main>
      </div>
    </>
  );
};

export default StereoscopeProcessorPage;