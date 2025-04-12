
import React from 'react';
import { Loader } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';

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
      <div className="flex flex-col items-center space-y-4 bg-card p-6 rounded-lg shadow-lg">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        
        <div className="text-center">
          <p className="text-sm font-medium">
            {message || t("Loading certified locations...", "正在加载认证位置...")}
          </p>
          
          <div className="w-48 mt-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
