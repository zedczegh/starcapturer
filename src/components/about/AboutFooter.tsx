
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, Calculator } from "lucide-react";

const AboutFooter = () => {
  const { t } = useLanguage();

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className="mt-12 text-center space-y-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
      }}
    >
      <motion.h3 
        className="text-xl font-semibold text-cosmic-100"
        variants={buttonVariants}
      >
        {t("Ready to explore the night sky?", "准备探索夜空了吗？")}
      </motion.h3>
      
      <motion.div 
        className="flex flex-wrap gap-4 justify-center"
        variants={buttonVariants}
      >
        <Link to="/">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Home className="mr-2 h-4 w-4" />
            {t("Return to Home", "返回首页")}
          </Button>
        </Link>
        
        <Link to="/photo-points">
          <Button variant="outline" className="border-cosmic-400/30 hover:bg-cosmic-800/50">
            <MapPin className="mr-2 h-4 w-4" />
            {t("Explore Photo Points", "探索摄影点")}
          </Button>
        </Link>
        
        <Link to="/siqs">
          <Button variant="outline" className="border-cosmic-400/30 hover:bg-cosmic-800/50">
            <Calculator className="mr-2 h-4 w-4" />
            {t("Calculate SIQS", "计算SIQS")}
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default AboutFooter;
