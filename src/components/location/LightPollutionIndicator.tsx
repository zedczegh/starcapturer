
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { getBortleScaleDescription, getBortleScaleColor } from '@/data/utils/bortleScaleUtils';
import { Star } from 'lucide-react';
import { formatSIQSScore } from '@/utils/geoUtils';

interface LightPollutionIndicatorProps {
  bortleScale: number | null;
  siqs: number | null;
  compact?: boolean;
}

const LightPollutionIndicator: React.FC<LightPollutionIndicatorProps> = ({
  bortleScale,
  siqs,
  compact = false
}) => {
  const { t, language } = useLanguage();
  
  if (bortleScale === null) {
    return null;
  }
  
  const getBortleColor = (scale: number) => {
    const color = getBortleScaleColor(scale);
    return {
      textColor: color.text,
      bgColor: color.bg,
      borderColor: color.border
    };
  };
  
  const { textColor, bgColor, borderColor } = getBortleColor(bortleScale);
  
  const getSiqsColorClass = () => {
    if (!siqs) return 'text-neutral-400 bg-neutral-900/30';
    if (siqs > 8) return 'text-green-400 bg-green-900/30';
    if (siqs > 6) return 'text-purple-400 bg-purple-900/30';
    if (siqs > 4) return 'text-yellow-400 bg-yellow-900/30';
    if (siqs > 2) return 'text-orange-400 bg-orange-900/30';
    return 'text-red-400 bg-red-900/30';
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${bgColor} ${textColor} ${borderColor}`}>
          <span className="font-semibold mr-1">{t("Bortle", "波特尔")}</span> {bortleScale}
        </div>
        
        {siqs !== null && (
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${getSiqsColorClass()}`}>
            <Star className="h-3 w-3 mr-1" fill="currentColor" />
            {formatSIQSScore(siqs)}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <motion.div 
            className={`w-full h-4 rounded-full ${bgColor} relative overflow-hidden`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={`absolute inset-0 ${borderColor} opacity-30`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            />
          </motion.div>
          
          <div className="flex justify-between mt-1">
            <div className={`text-xs font-medium ${textColor}`}>
              {t("Bortle Scale", "波特尔亮度等级")}: {bortleScale}
            </div>
            <div className="text-xs text-muted-foreground">
              {t(getBortleScaleDescription(bortleScale), getBortleScaleDescription(bortleScale, 'zh'))}
            </div>
          </div>
        </div>
      </div>
      
      {siqs !== null && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <motion.div 
              className={`w-full h-4 rounded-full ${getSiqsColorClass()} relative overflow-hidden`}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="absolute inset-0 border border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              />
            </motion.div>
            
            <div className="flex justify-between mt-1">
              <div className={`text-xs font-medium ${getSiqsColorClass()}`}>
                {t("SIQS Score", "SIQS 评分")}: {formatSIQSScore(siqs)}
              </div>
              <div className="text-xs text-muted-foreground">
                {siqs > 7.5 
                  ? t("Excellent", "极佳")
                  : siqs > 6 
                    ? t("Good", "良好")
                    : siqs > 4
                      ? t("Fair", "一般")
                      : siqs > 2
                        ? t("Poor", "较差")
                        : t("Very Poor", "很差")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LightPollutionIndicator;
