import React from 'react';
import NavBar from '@/components/NavBar';
import AstroMathProcessor from '@/components/astromath/AstroMathProcessor';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';

const AstroMathPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? 'Astro Math - Mathematical Universe | SIQS' : '天文数学 - 数学宇宙 | SIQS'}</title>
        <meta 
          name="description" 
          content={language === 'en' 
            ? 'Reverse-engineer mathematical equations from astrophotography. Discover Fourier series, parametric equations, fractals, and celestial mechanics hidden in cosmic images.'
            : '从天文摄影中逆向工程数学方程。发现隐藏在宇宙图像中的傅里叶级数、参数方程、分形和天体力学。'
          } 
        />
        <meta 
          name="keywords" 
          content={language === 'en'
            ? 'astrophotography mathematics, fourier analysis, parametric equations, fractal dimension, celestial mechanics, mathematical universe'
            : '天文摄影数学, 傅里叶分析, 参数方程, 分形维度, 天体力学, 数学宇宙'
          }
        />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
        <NavBar />
        
        <main className="pt-24 pb-16">
          <AstroMathProcessor />
        </main>
      </div>
    </>
  );
};

export default AstroMathPage;
