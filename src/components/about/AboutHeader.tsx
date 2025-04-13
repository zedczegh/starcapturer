
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Sparkles, MoonStar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const AboutHeader = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <motion.div 
      className="mb-8 text-center relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Simplified gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-teal-400/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.4, 0.5]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </div>
      
      {/* Logo and SIQS Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex justify-center items-center gap-3 mb-3"
      >
        <MoonStar className="h-8 w-8 text-primary" />
        <div className="bg-cosmic-800/30 backdrop-blur-sm p-2 rounded-full inline-flex items-center border border-cosmic-700/30">
          <Sparkles className="h-4 w-4 text-blue-400 mr-1.5" />
          <span className="text-xs text-cosmic-200">
            {t("Astro SIQS 1.0", "Astro SIQS 1.0")}
          </span>
        </div>
      </motion.div>
      
      {/* Main title with gradient */}
      <motion.h1 
        className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {t("About SIQS", "关于 SIQS")}
      </motion.h1>
      
      {/* Decorative line */}
      <motion.div
        className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto my-4 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: 80 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      />
      
      {/* Subtitle */}
      <motion.p
        className={`mt-4 ${isMobile ? 'text-base' : 'text-lg'} text-cosmic-200 max-w-2xl mx-auto`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {t(
          "Our companion for stargazing and astrophotography in optimal conditions", 
          "我们的星空观测和天文摄影最佳伙伴"
        )}
      </motion.p>
    </motion.div>
  );
};

export default AboutHeader;
