import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, Calculator, ArrowRight, Github, Twitter, BookOpen, MessageSquare, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const LinksFooter = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // Function to scroll to contact form
  const scrollToContactForm = () => {
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
      contactForm.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      className={`mt-16 text-center space-y-6 bg-gradient-to-b from-cosmic-900/80 to-cosmic-900/60 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-cosmic-700/30 relative shadow-xl ${isMobile ? '' : 'overflow-hidden'}`}
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
            className="absolute bottom-0 left-20 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>
      )}
      
      <motion.h3 
        className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold bg-gradient-to-r from-blue-100 to-purple-200 bg-clip-text text-transparent flex items-center justify-center gap-2`}
        variants={buttonVariants}
      >
        {t("Want to contribute more resources?", "想要贡献更多资源？")}
        {!isMobile && <ArrowRight className="h-5 w-5 text-blue-400" />}
      </motion.h3>
      
      <motion.p
        className="text-cosmic-300 max-w-2xl mx-auto"
        variants={buttonVariants}
      >
        {t(
          "Have a useful resource that should be included here? Reach out to us or contribute to our open source project. We're constantly working to improve this collection.",
          "有应该包含在此处的实用资源？请联系我们或为我们的开源项目做出贡献。我们正在不断努力改进这个集合。"
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
        
        <Button
          variant="ghost"
          className="text-cosmic-400 hover:text-cosmic-100 hover:bg-cosmic-800/30"
          onClick={scrollToContactForm}
        >
          <Mail className="mr-2 h-4 w-4" />
          {t("Contact Us", "联系我们")}
        </Button>
      </motion.div>
      
      <motion.div 
        className="pt-6 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 border-t border-cosmic-700/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Link to="/about" className="text-sm text-cosmic-400 hover:text-cosmic-200 transition-colors flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" /> {t("About SIQS", "关于SIQS")}
        </Link>
        
        <Link to="/photo-points" className="text-sm text-cosmic-400 hover:text-cosmic-200 transition-colors flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {t("Photo Points", "拍摄点")}
        </Link>
        
        <Link to="/share" className="text-sm text-cosmic-400 hover:text-cosmic-200 transition-colors flex items-center gap-1">
          <Calculator className="h-3.5 w-3.5" /> {t("Bortle Now", "实时光污染")}
        </Link>
      </motion.div>
      
      <motion.div 
        className="text-xs text-cosmic-400 mt-6 pt-4 border-t border-cosmic-700/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {t("Bortle Now © 2025 — Making astronomical observation accessible for everyone", "Bortle Now © 2025 — 让天文观测人人可及")}
      </motion.div>
    </motion.div>
  );
};

export default LinksFooter;
