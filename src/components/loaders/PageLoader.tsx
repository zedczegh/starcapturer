
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PageLoader: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Minimalist spinner */}
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        
        <p className="text-cosmic-300 text-sm font-medium">
          {t("Loading", "加载中")}
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
