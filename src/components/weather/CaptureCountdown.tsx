
import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CaptureCountdownProps {
  countdown: number;
  mode: 'dark' | 'light';
}

const CaptureCountdown: React.FC<CaptureCountdownProps> = ({ countdown, mode }) => {
  const { t } = useLanguage();
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-cosmic-950/80 z-10">
      {mode === 'dark' ? (
        <Moon className="w-12 h-12 text-cosmic-300 mb-2" />
      ) : (
        <Sun className="w-12 h-12 text-cosmic-300 mb-2" />
      )}
      
      <motion.h3 
        className="text-2xl font-bold text-white"
        key={countdown}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.2, opacity: 0 }}
      >
        {countdown}
      </motion.h3>
      
      <p className="text-cosmic-100 mt-2">
        {mode === 'dark' 
          ? t("Cover camera lens", "遮住相机镜头") 
          : t("Point at the sky", "对准天空")}
      </p>
    </div>
  );
};

export default CaptureCountdown;
