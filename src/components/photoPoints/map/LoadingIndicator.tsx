
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import EnhancedLoader from '@/components/loaders/EnhancedLoader';

interface LoadingIndicatorProps {
  progress?: number;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  progress = 0, 
  message 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="max-w-md w-full p-6">
        <EnhancedLoader 
          size="medium" 
          message={message || t("Loading certified locations...", "正在加载认证位置...")}
          progress={progress}
        />
      </div>
    </div>
  );
};

export default LoadingIndicator;
