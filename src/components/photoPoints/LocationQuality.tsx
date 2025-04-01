
import React from 'react';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, CloudRain, Wind, Compass, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatSIQSScore } from '@/utils/geoUtils';

export interface LocationQualityProps {
  bortleScale: number | null;
  siqs: number | null | undefined;
  weather: any | null;
  isChecking: boolean;
}

const LocationQuality: React.FC<LocationQualityProps> = ({
  bortleScale,
  siqs,
  weather,
  isChecking
}) => {
  const { t } = useLanguage();
  
  // Function to get color class based on SIQS score
  const getSiqsColorClass = () => {
    if (siqs === null || siqs === undefined) return 'text-blue-400 bg-blue-950/30';
    if (siqs > 8) return 'text-green-400 bg-green-950/30';
    if (siqs > 6) return 'text-purple-400 bg-purple-950/30';
    if (siqs > 4) return 'text-yellow-400 bg-yellow-950/30';
    if (siqs > 2) return 'text-orange-400 bg-orange-950/30';
    return 'text-red-400 bg-red-950/30';
  };
  
  // Function to get quality text based on SIQS score
  const getQualityText = () => {
    if (siqs === null || siqs === undefined) return t("Checking...", "正在检查...");
    if (siqs > 8) return t("Excellent", "极佳");
    if (siqs > 6) return t("Good", "良好");
    if (siqs > 4) return t("Fair", "一般");
    if (siqs > 2) return t("Poor", "较差");
    return t("Very Poor", "很差");
  };
  
  // Render loading state
  if (isChecking) {
    return (
      <Card className="p-4 glassmorphism">
        <h3 className="text-base font-medium mb-3">{t("Location Quality", "位置质量")}</h3>
        <div className="flex items-center justify-center py-6">
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("Checking location conditions...", "正在检查位置条件...")}
            </p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 glassmorphism overflow-hidden">
      <h3 className="text-base font-medium mb-3">{t("Location Quality", "位置质量")}</h3>
      
      {siqs !== null && siqs !== undefined ? (
        <div className="space-y-3">
          <div className="relative flex items-center justify-between">
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <Star className="h-5 w-5 text-yellow-400 mr-2" fill="rgba(250, 204, 21, 0.5)" />
              <span className="text-sm">{t("SIQS Score", "SIQS 评分")}</span>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`px-3 py-1 rounded-full text-sm font-semibold ${getSiqsColorClass()}`}
            >
              {formatSIQSScore(siqs)}
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`h-2 rounded-full ${getSiqsColorClass()}`}
          >
            <div 
              className="h-full rounded-full bg-current opacity-30"
              style={{ width: `${Math.min(100, (siqs / 10) * 100)}%` }}
            ></div>
          </motion.div>
          
          <div className="pt-2 text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-sm font-medium text-primary"
            >
              {getQualityText()}
            </motion.div>
          </div>
          
          {/* Weather indicators if available */}
          {weather && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-cosmic-700/30"
            >
              {weather.cloudCover !== undefined && (
                <div className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4 text-blue-400" />
                  <span className="text-xs">
                    {t("Cloud", "云层")} {weather.cloudCover}%
                  </span>
                </div>
              )}
              
              {weather.windSpeed !== undefined && (
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-blue-300" />
                  <span className="text-xs">
                    {weather.windSpeed} {t("km/h", "公里/小时")}
                  </span>
                </div>
              )}
              
              {weather.humidity !== undefined && (
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-green-400" />
                  <span className="text-xs">
                    {weather.humidity}% {t("humidity", "湿度")}
                  </span>
                </div>
              )}
              
              {weather.aqi !== undefined && (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <span className="text-xs">
                    AQI: {weather.aqi}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("No quality data available yet", "暂无质量数据")}
          </p>
        </div>
      )}
    </Card>
  );
};

export default LocationQuality;
