
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PageLoader: React.FC = () => {
  const { t, language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        <div className="relative">
          {/* Main spinner */}
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
          <div 
            className="absolute inset-[-8px] rounded-full border-2 border-primary/30"
            style={{
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }}
          ></div>
        </div>
        
        <p className="text-cosmic-300 text-lg font-medium animate-pulse">
          {language === 'zh' ? "让我们共赴山海！" : t("Into the Unknown", "Into the Unknown")}
        </p>
      </div>
    </div>
  );
};

export default PageLoader;
