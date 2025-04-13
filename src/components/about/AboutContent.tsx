
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import AboutIntro from "./AboutIntro";
import LocationDiscoverySection from "./LocationDiscoverySection";
import SiqsSection from "./SiqsSection";
import ScienceSection from "./ScienceSection";
import { useIsMobile } from "@/hooks/use-mobile";

export const AboutContent = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: isMobile ? 0.1 : 0.15,
        delayChildren: 0.2
      }
    }
  };
  
  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AboutIntro />
      <LocationDiscoverySection />
      <SiqsSection />
      <ScienceSection />
      
      <motion.div 
        className="w-full h-px bg-gradient-to-r from-cosmic-800/10 via-cosmic-400/30 to-cosmic-800/10 my-8"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      />
    </motion.div>
  );
};

export default AboutContent;
