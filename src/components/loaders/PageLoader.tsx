
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PageLoader: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
        </div>
        <p className="text-cosmic-300 animate-pulse">
          {t("Loading...", "正在加载...")}
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
