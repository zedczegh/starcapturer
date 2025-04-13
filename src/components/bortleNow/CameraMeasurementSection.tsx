
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { Camera, Info, Moon, Clock, CheckCircle } from 'lucide-react';

interface CameraMeasurementSectionProps {
  isProcessingImage: boolean;
  isMeasuringRealtime: boolean;
  cameraReadings: {
    darkFrame: boolean;
    lightFrame: boolean;
  };
  countdown: number | null;
  captureDarkFrame: () => void;
  captureLightFrame: () => void;
}

const CameraMeasurementSection: React.FC<CameraMeasurementSectionProps> = ({
  isProcessingImage,
  isMeasuringRealtime,
  cameraReadings,
  countdown,
  captureDarkFrame,
  captureLightFrame
}) => {
  const { t } = useLanguage();
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };
  
  return (
    <motion.div 
      className="glassmorphism border-cosmic-700/30 rounded-xl p-6 relative overflow-hidden"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.2 }}
    >
      <div className="absolute inset-0 z-0 opacity-20 bg-gradient-to-br from-cosmic-700/20 to-cosmic-900/20" />
      
      <div className="relative z-10">
        <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Camera size={18} className="text-primary" />
          {t("Camera Measurement", "相机测量")}
        </h2>
        
        <div className="bg-cosmic-800/50 p-4 rounded-lg border border-cosmic-700/30 shadow-inner mb-4">
          <p className="mb-4 text-sm text-cosmic-200">
            {t(
              "Accurate measurements use your camera to measure actual sky brightness and count visible stars. First capture a dark frame, then point your camera at the night sky.",
              "精确测量使用相机测量实际天空亮度并计算可见星星。首先捕获暗帧，然后将相机指向夜空。"
            )}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant={cameraReadings.darkFrame ? "outline" : "default"}
              onClick={captureDarkFrame}
              disabled={isProcessingImage || isMeasuringRealtime || countdown !== null}
              className={`relative overflow-hidden flex items-center gap-2 ${cameraReadings.darkFrame ? 'bg-cosmic-800/60 border-emerald-500/50' : 'bg-cosmic-800 hover:bg-cosmic-700'}`}
            >
              <Moon size={16} />
              {t("Capture Dark Frame", "捕获暗帧")}
              
              {cameraReadings.darkFrame && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              )}
              
              {isProcessingImage && !cameraReadings.darkFrame && (
                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </Button>
            
            <Button
              variant={cameraReadings.lightFrame ? "outline" : "secondary"}
              onClick={captureLightFrame}
              disabled={isProcessingImage || !cameraReadings.darkFrame || isMeasuringRealtime || countdown !== null}
              className={`relative overflow-hidden flex items-center gap-2 ${
                cameraReadings.lightFrame 
                  ? 'bg-cosmic-800/60 border-emerald-500/50 text-emerald-400' 
                  : cameraReadings.darkFrame 
                    ? 'bg-cosmic-700/80 hover:bg-cosmic-700' 
                    : 'bg-cosmic-700/80 hover:bg-cosmic-700 opacity-50'
              }`}
            >
              <Clock size={16} />
              {t("Measure Sky Brightness", "测量天空亮度")}
              
              {cameraReadings.lightFrame && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              )}
              
              {isProcessingImage && !cameraReadings.lightFrame && cameraReadings.darkFrame && (
                <div className="absolute inset-0 bg-secondary/5 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </Button>
          </div>
        </div>
      
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2 text-primary text-sm">
            <Info size={14} />
            {t("How to Measure", "如何测量")}
          </h3>
          
          <div className="space-y-3 text-sm text-cosmic-200">
            <div className="flex items-start gap-3 bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
              <div className="bg-primary/20 text-primary min-w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-medium text-cosmic-100 mb-1">{t("Cover Your Camera", "遮盖您的相机")}</p>
                <p className="text-xs">{t("Place your phone face down or cover the camera lens completely", "将手机正面朝下放置或完全遮盖相机镜头")}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
              <div className="bg-primary/20 text-primary min-w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-medium text-cosmic-100 mb-1">{t("Capture Dark Frame", "捕获暗帧")}</p>
                <p className="text-xs">{t("This sets the baseline for your camera sensor", "这为您的相机传感器设置基线")}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 bg-cosmic-800/30 p-3 rounded-lg border border-cosmic-700/20">
              <div className="bg-primary/20 text-primary min-w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-medium text-cosmic-100 mb-1">{t("Point at Sky", "指向天空")}</p>
                <p className="text-xs">{t("Point your camera at the zenith (directly overhead) to measure light pollution and count stars", "将相机指向天顶（正上方）以测量光污染并计算星星")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CameraMeasurementSection;
