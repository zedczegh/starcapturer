
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const BortleNowHeader: React.FC = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const titleVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 0.3, duration: 0.5 }
    }
  };

  const descriptionVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { delay: 0.5, duration: 0.5 }
    }
  };
  
  return (
    <motion.div 
      className="relative z-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold mb-2 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent`}
        variants={titleVariants}
        initial="hidden"
        animate="visible"
      >
        {t("Bortle Now", "实时光污染")}
      </motion.h1>
      
      {/* Decorative line with animation */}
      <motion.div
        className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto my-4 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      />
      
      <motion.p 
        className="text-center text-sm text-cosmic-300 mb-6 max-w-md mx-auto"
        variants={descriptionVariants}
        initial="hidden"
        animate="visible"
      >
        {t("Measure light pollution levels at your location using your device camera or location data", 
           "使用设备摄像头或位置数据测量您所在位置的光污染水平")}
      </motion.p>
    </motion.div>
  );
};

export default BortleNowHeader;
