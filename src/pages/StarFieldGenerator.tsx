import React from 'react';
import NavBar from '@/components/NavBar';
import StarFieldGenerator from '@/components/starfield/StarFieldGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';

const StarFieldGeneratorPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? '3D Star Field Generator | SIQS' : '3D星场生成器 | SIQS'}</title>
        <meta 
          name="description" 
          content={language === 'en' 
            ? 'Generate stunning 3D star field animations from astronomy images with AI-powered star detection'
            : '使用AI驱动的星体检测从天文图像生成令人惊叹的3D星场动画'
          } 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
        <NavBar />
        
        <main className="container mx-auto px-4 py-8 pt-24">
          <StarFieldGenerator />
        </main>
      </div>
    </>
  );
};

export default StarFieldGeneratorPage;