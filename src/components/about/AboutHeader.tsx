
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const AboutHeader = () => {
  const { t } = useLanguage();

  return (
    <motion.div 
      className="mb-10 text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400"
      >
        {t("About Bortle Now", "关于 Bortle Now")}
      </motion.h1>
      
      <motion.p
        className="mt-4 text-lg text-cosmic-200 max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
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
