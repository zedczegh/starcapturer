
import React from 'react';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/contexts/LanguageContext';

const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-6">{t("About Us", "关于我们")}</h1>
        <div className="prose max-w-none">
          <p>{t("Welcome to our platform dedicated to helping astronomers and stargazers find the best locations for observing the night sky.", 
            "欢迎来到我们的平台，我们致力于帮助天文学家和观星者找到观测夜空的最佳位置。")}</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
