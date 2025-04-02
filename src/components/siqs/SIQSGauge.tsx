
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';

interface SIQSGaugeProps {
  score: number | null;
  level: string;
  color: string;
  loading?: boolean;
  hasCalculatedOnce?: boolean;
}

const SIQSGauge: React.FC<SIQSGaugeProps> = ({
  score,
  level,
  color,
  loading = false,
  hasCalculatedOnce = false
}) => {
  const { t } = useLanguage();
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">
          {t("Calculating SIQS...", "正在计算SIQS...")}
        </p>
      </div>
    );
  }
  
  if (score === null) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        {hasCalculatedOnce ? (
          <div className="text-center">
            <p className="text-lg font-medium">
              {t("Enter location to calculate SIQS", "输入位置以计算SIQS")}
            </p>
          </div>
        ) : (
          <div className="h-36 w-36 rounded-full border-4 border-dashed border-muted flex items-center justify-center">
            <p className="text-xl font-bold text-muted-foreground">SIQS</p>
          </div>
        )}
      </div>
    );
  }

  // Calculate angle for gauge needle
  const angle = (score / 10) * 180 - 90;
  
  // Display message for poor conditions at 100% cloud cover
  const showPoorConditionsMessage = score <= 1.3;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        {/* Semi-circle background */}
        <div className="absolute inset-0 h-20 w-40 mx-auto mt-20 bg-cosmic-700 rounded-t-full overflow-hidden">
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full"
            style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 0)' }}
          />
        </div>
        
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 h-16 w-1 bg-white origin-bottom transform -translate-x-1/2 shadow-lg"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        />
        
        {/* Central pivot */}
        <div className="absolute bottom-0 left-1/2 h-4 w-4 bg-white rounded-full transform -translate-x-1/2 translate-y-1/2 border-2 border-cosmic-700 z-10" />
        
        {/* Score display */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <div 
            className={`text-4xl font-bold mb-1`}
            style={{ color }}
          >
            {formatSIQSScoreForDisplay(score)}
          </div>
          <div className="text-sm font-medium text-white">
            {level}
          </div>
        </div>
      </div>
      
      {/* Message for poor conditions */}
      {showPoorConditionsMessage && (
        <div className="mt-4 text-center max-w-xs text-sm text-amber-300 bg-cosmic-700/50 p-3 rounded-lg">
          <p>{t("Don't worry, clear skies will come! Try our", "别担心，晴朗的天空会到来！请尝试我们的")} <a href="/photopoints" className="underline hover:text-primary">
            {t("Photo Points feature", "摄影点功能")}
          </a> {t("to find nearby ideal astro-spots!", "寻找附近理想的天文摄影地点！")}</p>
        </div>
      )}
    </div>
  );
};

export default SIQSGauge;
