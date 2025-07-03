
import React from 'react';
import NavBar from '@/components/NavBar';
import SamplingCalculator from '@/components/sampling/SamplingCalculator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';

const SamplingCalculatorPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? 'Sampling Calculator | SIQS' : '采样计算器 | SIQS'}</title>
        <meta 
          name="description" 
          content={language === 'en' 
            ? 'Calculate pixel scale and sampling rates for astronomy cameras and telescopes'
            : '计算天文相机和望远镜的像素比例和采样率'
          } 
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
        <NavBar />
        
        <main className="pt-24">
          <SamplingCalculator />
        </main>
      </div>
    </>
  );
};

export default SamplingCalculatorPage;
