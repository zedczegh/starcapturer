
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Star, Moon, Shield, MapPin } from 'lucide-react';
import { DynamicLightbulbIcon } from '@/components/weather/DynamicIcons';
import ConditionItem from '@/components/weather/ConditionItem';

interface BortleScaleDisplayProps {
  bortleScale: number | null;
  starCount: number | null;
  isMeasuringRealtime: boolean;
  cameraReadings: {
    darkFrame: boolean;
    lightFrame: boolean;
  };
  bortleDescription: string | null;
}

const BortleScaleDisplay: React.FC<BortleScaleDisplayProps> = ({
  bortleScale,
  starCount,
  isMeasuringRealtime,
  cameraReadings,
  bortleDescription
}) => {
  const { t } = useLanguage();
  
  const circleAnimations = {
    pulse: {
      scale: [1, 1.03, 1],
      boxShadow: [
        "0 0 0 rgba(255, 255, 255, 0.1)",
        "0 0 15px rgba(255, 255, 255, 0.3)",
        "0 0 0 rgba(255, 255, 255, 0.1)"
      ],
      transition: { 
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  const getBortleScaleGradient = (scale: number | null) => {
    if (scale === null) return { bg: "", text: "" };
    
    if (scale >= 7) {
      return {
        bg: "bg-gradient-to-br from-orange-500/80 to-red-500/80",
        text: "text-white"
      };
    } else if (scale >= 4) {
      return {
        bg: "bg-gradient-to-br from-yellow-400/80 to-lime-500/80",
        text: "text-cosmic-950"
      };
    } else {
      return {
        bg: "bg-gradient-to-br from-blue-500/80 to-cyan-500/80",
        text: "text-white"
      };
    }
  };

  const bortleGradient = bortleScale ? getBortleScaleGradient(bortleScale) : { bg: "", text: "" };
  
  if (!bortleScale) return null;
  
  return (
    <motion.div 
      className="relative overflow-hidden glassmorphism border-cosmic-700/30 rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-cosmic-600/20 to-cosmic-900/20" />
      
      <div className="relative z-10">
        <div className="flex flex-col items-center mb-5">
          <motion.div 
            className={`relative w-32 h-32 rounded-full flex items-center justify-center ${bortleGradient.bg} backdrop-blur-sm shadow-lg border-2 border-cosmic-700/50`}
            variants={circleAnimations}
            animate="pulse"
          >
            <div className="absolute inset-0 rounded-full bg-cosmic-950/10 backdrop-blur-sm"></div>
            <div className="z-10 flex flex-col items-center">
              <span className={`text-4xl font-bold ${bortleGradient.text}`}>{bortleScale.toFixed(1)}</span>
              <span className={`text-xs mt-1 ${bortleGradient.text} opacity-80`}>{t("Bortle Scale", "伯特尔等级")}</span>
            </div>
          </motion.div>
          
          {isMeasuringRealtime && (
            <div className="absolute top-0 right-0 mt-2 mr-2">
              <div className="flex items-center gap-1.5 bg-blue-500/20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs text-blue-300">{t("Measuring", "测量中")}</span>
              </div>
            </div>
          )}
          
          <h3 className="text-lg font-semibold text-gradient-primary mt-4 mb-1">
            {t("Light Pollution Level", "光污染水平")}
          </h3>
          
          <div className="mt-1 flex items-center justify-center text-sm">
            <span className="text-blue-400 mr-3">{t("Dark", "黑暗")}</span>
            <DynamicLightbulbIcon bortleScale={1} animated={true} />
            <span className="mx-2">→</span>
            <DynamicLightbulbIcon bortleScale={5} animated={true} />
            <span className="mx-2">→</span>
            <DynamicLightbulbIcon bortleScale={9} animated={true} />
            <span className="text-red-400 ml-3">{t("Urban", "城市")}</span>
          </div>
        </div>
        
        <div className="bg-cosmic-900/50 p-4 rounded-lg border border-cosmic-800/30 mb-3">
          <p className="text-sm text-cosmic-200">
            {bortleDescription}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <ConditionItem
            icon={<Star className="h-5 w-5 text-primary" />}
            label={t("Visible Stars", "可见星星")}
            value={
              starCount !== null ? 
              <span className="text-lg font-medium">{starCount}</span> : 
              (bortleScale <= 3 
                ? t("Many", "许多") 
                : bortleScale <= 6 
                  ? t("Some", "一些") 
                  : t("Few", "很少"))
            }
            tooltip={t("Estimated visible stars at zenith", "天顶处估计可见星星")}
          />
          
          <ConditionItem
            icon={<Moon className="h-5 w-5 text-sky-200" />}
            label={t("Sky Quality", "夜空质量")}
            value={bortleScale <= 3 
              ? t("Excellent", "极好") 
              : bortleScale <= 6 
                ? t("Moderate", "中等") 
                : t("Poor", "较差")}
            tooltip={t("Overall sky darkness level", "整体夜空黑暗程度")}
          />
        </div>
        
        {cameraReadings.lightFrame ? (
          <div className="mt-3 flex items-center justify-center p-1 bg-green-950/30 rounded-full w-fit mx-auto">
            <div className="text-xs text-emerald-400 flex items-center gap-2 px-3 py-1">
              <Shield size={14} className="text-emerald-400" />
              {t("Camera-verified measurement", "相机验证的测量")}
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-center p-1 bg-amber-950/30 rounded-full w-fit mx-auto">
            <div className="text-xs text-amber-400/90 flex items-center gap-2 px-3 py-1">
              <MapPin size={14} />
              {t("Based on location estimate", "基于位置估计")}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BortleScaleDisplay;
