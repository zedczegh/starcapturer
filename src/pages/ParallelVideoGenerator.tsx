import React from 'react';
import NavBar from '@/components/NavBar';
import ParallelVideoGenerator from '@/components/parallelvideo/ParallelVideoGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';

const ParallelVideoGeneratorPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? '3D Parallel Video Generator | SIQS' : '3D平行视频生成器 | SIQS'}</title>
        <meta 
          name="description" 
          content={language === 'en' 
            ? 'Generate stereoscopic 3D parallel videos from astronomy images with traditional morph processing'
            : '使用传统变形处理从天文图像生成立体3D平行视频'
          } 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
        <NavBar />
        
        <main className="pt-24">
          <ParallelVideoGenerator />
        </main>
      </div>
    </>
  );
};

export default ParallelVideoGeneratorPage;
