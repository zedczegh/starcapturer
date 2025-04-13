
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, Calculator, ArrowRight, Github, Twitter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const AboutFooter = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className={`mt-12 text-center space-y-6 bg-cosmic-900/60 backdrop-blur-sm p-6 rounded-xl border border-cosmic-700/30 relative ${isMobile ? '' : 'overflow-hidden'}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
      }}
    >
      {!isMobile && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute top-0 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"
            animate={{ 
              y: [0, 10, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl"
            animate={{ 
              y: [0, -10, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          />
        </div>
      )}
      
      <motion.h3 
        className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-cosmic-100 flex items-center justify-center gap-2`}
        variants={buttonVariants}
      >
        {t("Ready to explore the night sky?", "准备探索夜空了吗？")}
        {!isMobile && <ArrowRight className="h-4 w-4 text-blue-400" />}
      </motion.h3>
      
      <motion.div 
        className="flex flex-wrap gap-4 justify-center"
        variants={buttonVariants}
      >
        <Link to="/">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/30 transition-all">
            <Home className="mr-2 h-4 w-4" />
            {t("Return to Home", "返回首页")}
          </Button>
        </Link>
        
        <Link to="/photo-points">
          <Button variant="outline" className="border-cosmic-400/30 hover:bg-cosmic-800/50 hover:border-cosmic-400/50 transition-colors">
            <MapPin className="mr-2 h-4 w-4 text-purple-400" />
            {t("Explore Photo Points", "探索摄影点")}
          </Button>
        </Link>
        
        <Link to="/siqs">
          <Button variant="outline" className="border-cosmic-400/30 hover:bg-cosmic-800/50 hover:border-cosmic-400/50 transition-colors">
            <Calculator className="mr-2 h-4 w-4 text-teal-400" />
            {t("Calculate SIQS", "计算SIQS")}
          </Button>
        </Link>
      </motion.div>
      
      {/* Social links */}
      <motion.div variants={buttonVariants} className="flex justify-center gap-4 pt-4">
        <a href="https://github.com/bortle-now" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-cosmic-200 transition-colors">
          <Github size={20} />
        </a>
        <a href="https://twitter.com/bortlenow" target="_blank" rel="noopener noreferrer" className="text-cosmic-400 hover:text-cosmic-200 transition-colors">
          <Twitter size={20} />
        </a>
      </motion.div>
      
      <motion.div 
        className="text-xs text-cosmic-400 mt-6 pt-4 border-t border-cosmic-700/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {t("Bortle Now © 2025 — Making astronomy accessible for everyone", "Bortle Now © 2025 — 让天文学人人可及")}
      </motion.div>
    </motion.div>
  );
};

export default AboutFooter;
