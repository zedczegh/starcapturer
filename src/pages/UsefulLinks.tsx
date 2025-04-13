
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Link2, Star, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LinksHeader from "@/components/links/LinksHeader";
import LinksGrid from "@/components/links/LinksGrid";
import LinksFooter from "@/components/links/LinksFooter";

const UsefulLinks = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Set page title
    document.title = t("Useful Links - AstroSIQS", "实用链接 - AstroSIQS");
  }, [t]);
  
  return (
    <div className="min-h-screen bg-cosmic-950 text-cosmic-50 pb-20 relative overflow-hidden">
      {/* Background stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            initial={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              height: `${Math.random() * 3 + 1}px`,
              width: `${Math.random() * 3 + 1}px`,
              opacity: Math.random() * 0.5 + 0.3
            }}
            animate={{
              opacity: [
                Math.random() * 0.5 + 0.3,
                Math.random() * 0.8 + 0.5,
                Math.random() * 0.5 + 0.3
              ]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
        
        {/* Background gradient orbs */}
        <motion.div 
          className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl"
          animate={{
            y: [0, 15, 0],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
        />
        
        <motion.div 
          className="absolute -bottom-32 -left-20 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"
          animate={{
            y: [0, -15, 0],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 7, repeat: Infinity, repeatType: "reverse" }}
        />
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="flex items-center mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mr-2 text-cosmic-200 hover:text-cosmic-50 hover:bg-cosmic-800/50">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {t("Back", "返回")}
            </Button>
          </Link>
          
          {!isMobile && (
            <motion.div
              className="ml-auto flex items-center text-cosmic-300 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Star className="h-3 w-3 mr-1.5 text-yellow-400" />
              {t("Updated for 2025", "2025年更新")}
            </motion.div>
          )}
        </div>
        
        <LinksHeader />
        <LinksGrid />
        <LinksFooter />
      </div>
    </div>
  );
};

export default UsefulLinks;
