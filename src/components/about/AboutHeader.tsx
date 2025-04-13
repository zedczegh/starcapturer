
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const AboutHeader = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <motion.div 
      className="mb-10 text-center relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-teal-400/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 0.5, 0.7]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </div>
      
      <motion.h1 
        className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 px-4`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {t("About Bortle Now", "关于 Bortle Now")}
      </motion.h1>
      
      <motion.div
        className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto my-4 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      />
      
      <motion.p
        className={`mt-4 ${isMobile ? 'text-base px-4' : 'text-lg'} text-cosmic-200 max-w-2xl mx-auto`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {t(
          "Your companion for stargazing and astrophotography in optimal conditions", 
          "您在最佳条件下进行星空观测和天文摄影的助手"
        )}
      </motion.p>
    </motion.div>
  );
};

export default AboutHeader;
