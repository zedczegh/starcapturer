
import React from 'react';
import { Camera } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '../ui/progress';

interface CaptureProgressProps {
  progress: number;
  mode: 'dark' | 'light';
  isComplete: boolean;
}

const CaptureProgress: React.FC<CaptureProgressProps> = ({ 
  progress, 
  mode, 
  isComplete 
}) => {
  const { t } = useLanguage();
  
  const getProgressColor = () => {
    if (mode === 'dark') {
      return isComplete ? 'bg-indigo-400' : 'bg-indigo-600';
    } else {
      return isComplete ? 'bg-amber-400' : 'bg-amber-500';
    }
  };
  
  return (
    <div className="p-4 bg-cosmic-900 text-white">
      <div className="flex justify-between mb-2">
        <span>
          {mode === 'dark' 
            ? t("Capturing dark frame...", "正在捕获暗帧...") 
            : t("Capturing frame...", "正在捕获帧...")}
        </span>
        <span>{progress.toFixed(0)}%</span>
      </div>
      
      <Progress 
        value={progress} 
        className="h-2 bg-cosmic-700"
        colorClass={getProgressColor()}
      />
      
      <div className="flex items-center justify-center mt-2 text-cosmic-100 bg-cosmic-800/40 px-4 py-2 rounded-full text-xs">
        <Camera className="mr-2 h-4 w-4" />
        {mode === 'dark' 
          ? t("Keep lens covered", "保持镜头遮盖") 
          : t("Keep pointing at sky", "继续指向天空")}
      </div>
    </div>
  );
};

export default CaptureProgress;
