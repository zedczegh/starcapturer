
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownOverlayProps {
  countdown: number | null;
  cameraMode: "dark" | "light" | null;
}

const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  countdown,
  cameraMode
}) => {
  const { t } = useLanguage();
  
  if (countdown === null) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="text-6xl font-bold text-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.2, opacity: 0 }}
          key={countdown}
        >
          {countdown}
        </motion.div>
        <div className="absolute bottom-20 text-center text-white text-lg px-6">
          {cameraMode === "dark" ? (
            <p>{t("Cover your camera lens completely", "完全遮盖相机镜头")}</p>
          ) : (
            <p>{t("Point your camera at the sky (zenith)", "将相机指向天空（天顶）")}</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CountdownOverlay;
