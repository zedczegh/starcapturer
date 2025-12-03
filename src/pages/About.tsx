
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Star, ShieldAlert } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import NavBar from "@/components/NavBar";
import { useUserRole } from "@/hooks/useUserRole";

import AboutHeader from "@/components/about/AboutHeader";
import AboutFooter from "@/components/about/AboutFooter";

const About = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { isAdmin } = useUserRole();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-cosmic-950 text-cosmic-50 pb-16 relative overflow-hidden">
      <NavBar />
      {/* Background elements with reduced quantity for cleaner look */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle stars - reduced quantity */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            initial={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              height: `${Math.random() * 2 + 1}px`,
              width: `${Math.random() * 2 + 1}px`,
              opacity: Math.random() * 0.4 + 0.2
            }}
            animate={{
              opacity: [
                Math.random() * 0.4 + 0.2,
                Math.random() * 0.6 + 0.3,
                Math.random() * 0.4 + 0.2
              ]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
        
        {/* Background gradient orbs - more subtle */}
        <motion.div 
          className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/5 rounded-full filter blur-3xl"
          animate={{
            y: [0, 15, 0],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        />
        
        <motion.div 
          className="absolute -bottom-32 -left-20 w-80 h-80 bg-purple-600/5 rounded-full filter blur-3xl"
          animate={{
            y: [0, -10, 0],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
        />
      </div>

      <div className="container max-w-4xl mx-auto px-5 py-8 md:py-10 relative z-10 pt-20">
        {/* Header with back button */}
        <div className="flex items-center mb-2">
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
        
        {/* Main Page Header */}
        <AboutHeader />
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link to="/about/developer">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="cursor-pointer group"
            >
              <div className="p-6 bg-cosmic-900/50 border border-cosmic-700 rounded-lg hover:border-cosmic-500 transition-all">
                <h3 className="text-xl font-bold text-cosmic-50 mb-2 group-hover:text-cosmic-200">
                  {t("About the Developer", "关于开发者")}
                </h3>
                <p className="text-cosmic-300 text-sm">
                  {t("Meet the researcher behind SIQS and explore academic publications", 
                     "了解SIQS背后的研究者并探索学术出版物")}
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to="/about/utilities">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="cursor-pointer group"
            >
              <div className="p-6 bg-cosmic-900/50 border border-cosmic-700 rounded-lg hover:border-cosmic-500 transition-all">
                <h3 className="text-xl font-bold text-cosmic-50 mb-2 group-hover:text-cosmic-200">
                  {t("Computational Utilities", "计算工具")}
                </h3>
                <p className="text-cosmic-300 text-sm">
                  {t("Explore advanced astrophotography processing tools and utilities", 
                     "探索先进的天文摄影处理工具和实用程序")}
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to="/about/siqs">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="cursor-pointer group"
            >
              <div className="p-6 bg-cosmic-900/50 border border-cosmic-700 rounded-lg hover:border-cosmic-500 transition-all">
                <h3 className="text-xl font-bold text-cosmic-50 mb-2 group-hover:text-cosmic-200">
                  {t("SIQS System", "SIQS系统")}
                </h3>
                <p className="text-cosmic-300 text-sm">
                  {t("Learn about the Stellar Imaging Quality Score system and methodology", 
                     "了解恒星成像质量评分系统和方法论")}
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to="/about/darksky">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="cursor-pointer group"
            >
              <div className="p-6 bg-cosmic-900/50 border border-cosmic-700 rounded-lg hover:border-cosmic-500 transition-all">
                <h3 className="text-xl font-bold text-cosmic-50 mb-2 group-hover:text-cosmic-200">
                  {t("Dark Sky Preservation", "暗夜保护")}
                </h3>
                <p className="text-cosmic-300 text-sm">
                  {t("Discover the importance of protecting dark skies and preserves", 
                     "发现保护暗夜和保护区的重要性")}
                </p>
              </div>
            </motion.div>
          </Link>

          <Link to="/about/resources">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="cursor-pointer group"
            >
              <div className="p-6 bg-cosmic-900/50 border border-cosmic-700 rounded-lg hover:border-cosmic-500 transition-all">
                <h3 className="text-xl font-bold text-cosmic-50 mb-2 group-hover:text-cosmic-200">
                  {t("Resources", "资源")}
                </h3>
                <p className="text-cosmic-300 text-sm">
                  {t("Access additional resources and community links", 
                     "访问其他资源和社区链接")}
                </p>
              </div>
            </motion.div>
          </Link>

          {/* Admin-only Account Management */}
          {isAdmin && (
            <Link to="/about/accounts">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="cursor-pointer group"
              >
                <div className="p-6 bg-purple-900/30 border border-purple-500/30 rounded-lg hover:border-purple-400/50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="h-5 w-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-cosmic-50 group-hover:text-cosmic-200">
                      {t("Account Management", "账户管理")}
                    </h3>
                  </div>
                  <p className="text-cosmic-300 text-sm">
                    {t("Manage user accounts and utility permissions", 
                       "管理用户账户和功能权限")}
                  </p>
                </div>
              </motion.div>
            </Link>
          )}
        </div>

        <AboutFooter />
      </div>
    </div>
  );
};

export default About;
