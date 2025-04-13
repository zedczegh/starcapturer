
import React from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, Camera, Gauge, Ruler } from 'lucide-react';
import { getBortleScaleColor } from '@/data/utils/bortleScaleUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getImageQualityDescription } from '@/utils/starAnalysis';

interface BortleScaleDisplayProps {
  bortleScale: number;
  starCount: number | null;
  isMeasuringRealtime: boolean;
  cameraReadings: {
    darkFrame: boolean;
    lightFrame: boolean;
  };
  bortleDescription: string | null;
  mpsas?: number | null;
  imageQuality?: number | null;
}

const BortleScaleDisplay: React.FC<BortleScaleDisplayProps> = ({
  bortleScale,
  starCount,
  isMeasuringRealtime,
  cameraReadings,
  bortleDescription,
  mpsas = null,
  imageQuality = null
}) => {
  const { t, language } = useLanguage();
  
  const { 
    backgroundColor,
    textColor,
    description
  } = getBortleScaleColor(bortleScale, language as 'en' | 'zh');
  
  const measurementMethod = cameraReadings.lightFrame 
    ? 'camera'
    : 'location';
  
  const qualityDesc = imageQuality !== null ? getImageQualityDescription(imageQuality) : null;
  
  const translateQuality = (quality: string | null): string => {
    if (!quality) return '';
    
    if (language === 'zh') {
      switch (quality) {
        case 'excellent': return '极佳';
        case 'good': return '良好';
        case 'fair': return '一般';
        case 'poor': return '较差';
        case 'unusable': return '不可用';
        default: return quality;
      }
    }
    
    return quality;
  };
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };
  
  return (
    <motion.div
      className={`rounded-xl p-6 relative overflow-hidden ${backgroundColor} border ${textColor === 'text-white' ? 'border-white/10' : 'border-black/10'}`}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -20 }}
    >
      {isMeasuringRealtime && (
        <div className="absolute inset-0 animate-pulse bg-white/5 z-0"></div>
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-lg font-medium ${textColor}`}>
              {t("Bortle Scale", "波尔特尔等级")}
            </h2>
            <p className={`text-sm opacity-80 ${textColor}`}>
              {bortleDescription || description}
            </p>
          </div>
          
          <div className="flex flex-col items-end">
            <div className={`text-4xl font-bold ${textColor}`}>
              {bortleScale.toFixed(1)}
              <span className="text-lg opacity-70">/9</span>
            </div>
            
            <div className={`text-xs mt-1 ${textColor} opacity-80 flex items-center gap-1`}>
              {measurementMethod === 'camera' ? (
                <>
                  <Camera size={12} className="inline-block" />
                  {t("Camera measurement", "相机测量")}
                </>
              ) : (
                <>
                  <EyeIcon size={12} className="inline-block" />
                  {t("Location estimate", "位置估计")}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Star Count */}
          <div className={`rounded-lg p-3 ${textColor === 'text-white' ? 'bg-black/20' : 'bg-white/20'} ${textColor}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium opacity-90">
                {t("Stars Visible", "可见星星")}
              </div>
              <div className={`text-lg font-bold ${starCount ? '' : 'opacity-50'}`}>
                {starCount !== null ? starCount : '-'}
              </div>
            </div>
            {starCount !== null && starCount > 0 && (
              <div className={`h-1.5 mt-2 rounded-full overflow-hidden ${textColor === 'text-white' ? 'bg-black/20' : 'bg-white/20'}`}>
                <div 
                  className={`h-full ${textColor === 'text-white' ? 'bg-white/70' : 'bg-black/70'}`} 
                  style={{ width: `${Math.min(100, (starCount / 200) * 100)}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* MPSAS Value */}
          <div className={`rounded-lg p-3 ${textColor === 'text-white' ? 'bg-black/20' : 'bg-white/20'} ${textColor}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium opacity-90 flex items-center gap-1">
                <Ruler size={12} className="inline-block" />
                {t("MPSAS", "MPSAS")}
              </div>
              <div className={`text-lg font-bold ${mpsas ? '' : 'opacity-50'}`}>
                {mpsas !== null ? mpsas.toFixed(2) : '-'}
              </div>
            </div>
            {mpsas !== null && (
              <div className={`h-1.5 mt-2 rounded-full overflow-hidden ${textColor === 'text-white' ? 'bg-black/20' : 'bg-white/20'}`}>
                <div 
                  className={`h-full ${textColor === 'text-white' ? 'bg-white/70' : 'bg-black/70'}`} 
                  style={{ width: `${Math.min(100, Math.max(0, ((mpsas - 16) / 6) * 100))}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Image Quality */}
          <div className={`rounded-lg p-3 ${textColor === 'text-white' ? 'bg-black/20' : 'bg-white/20'} ${textColor}`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium opacity-90 flex items-center gap-1">
                <Gauge size={12} className="inline-block" />
                {t("Image Quality", "图像质量")}
              </div>
              <div className={`text-lg font-bold ${imageQuality ? '' : 'opacity-50'}`}>
                {imageQuality !== null 
                  ? `${imageQuality.toFixed(0)}%` 
                  : '-'}
              </div>
            </div>
            {imageQuality !== null && (
              <div className="flex items-center mt-0.5">
                <div 
                  className={`text-xs opacity-80 ${imageQuality > 60 ? 'text-green-600' : imageQuality > 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {translateQuality(qualityDesc)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BortleScaleDisplay;
