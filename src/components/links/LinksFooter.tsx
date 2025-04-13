
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, Calculator, ArrowRight, Github, Twitter, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const LinksFooter = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className={`mt-16 text-center space-y-6 bg-cosmic-900/60 backdrop-blur-sm p-6 rounded-xl border border-cosmic-700/30 relative ${isMobile ? '' : 'overflow-hidden'}`}
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
        </div>
      )}
      
      <motion.h3 
        className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-cosmic-100 flex items-center justify-center gap-2`}
        variants={buttonVariants}
      >
        {t("Want to contribute more resources?", "想要贡献更多资源？")}
        {!isMobile && <ArrowRight className="h-4 w-4 text-blue-400" />}
      </motion.h3>
      
      <motion.p
        className="text-cosmic-300 max-w-2xl mx-auto"
        variants={buttonVariants}
      >
        {t(
          "Have a useful resource that should be included here? Reach out to us or contribute to our open source project.",
          "有应该包含在此处的实用资源？请联系我们或为我们的开源项目做出贡献。"
        )}
      </motion.p>
      
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
        
        <a href="https://github.com/bortle-now" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="border-cosmic-400/30 hover:bg-cosmic-800/50 hover:border-cosmic-400/50 transition-colors">
            <Github className="mr-2 h-4 w-4 text-cosmic-300" />
            {t("Contribute on GitHub", "在GitHub上贡献")}
          </Button>
        </a>
      </motion.div>
      
      <motion.div 
        className="text-xs text-cosmic-400 mt-6 pt-4 border-t border-cosmic-700/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {t("Bortle Now © 2025 — Making astronomical observation accessible for everyone", "Bortle Now © 2025 — 让天文观测人人可及")}
      </motion.div>
    </motion.div>
  );
};

export default LinksFooter;
