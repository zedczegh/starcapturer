
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Star } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import NavBar from "@/components/NavBar";

import AboutHeader from "@/components/about/AboutHeader";
import PersonalIntro from "@/components/about/PersonalIntro";
import AboutTeam from "@/components/about/AboutTeam";
import SiqsSection from "@/components/about/SiqsSection";
import AboutIntro from "@/components/about/AboutIntro";
import LocationDiscoverySection from "@/components/about/LocationDiscoverySection";
import PhotoPointsFeature from "@/components/about/PhotoPointsFeature";
import DarkSkyKnowledge from "@/components/about/DarkSkyKnowledge";
import AboutFooter from "@/components/about/AboutFooter";
import ResourcesSection from "@/components/about/ResourcesSection";
import UtilitiesSection from "@/components/about/UtilitiesSection";
import AboutNavbar from "@/components/about/AboutNavbar";

const About = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

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
        
        {/* Main Page Header */}
        <AboutHeader />
        
        {/* Navigation */}
        <AboutNavbar />
        
        <div className="space-y-12">
          {/* About the Developer */}
          <section id="developer" className="space-y-6">
            <motion.h2 
              className="text-3xl font-bold text-cosmic-50 border-b border-cosmic-700 pb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t("About the Developer", "关于开发者")}
            </motion.h2>
            <PersonalIntro />
          </section>

          {/* About Utilities */}
          <section id="utilities" className="space-y-6">
            <motion.h2 
              className="text-3xl font-bold text-cosmic-50 border-b border-cosmic-700 pb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {t("About Utilities", "关于工具")}
            </motion.h2>
            <UtilitiesSection />
          </section>

          {/* About SIQS */}
          <section id="siqs" className="space-y-6">
            <motion.h2 
              className="text-3xl font-bold text-cosmic-50 border-b border-cosmic-700 pb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {t("About SIQS System", "关于SIQS系统")}
            </motion.h2>
            <SiqsSection />
            <AboutIntro />
            <PhotoPointsFeature />
            <AboutTeam />
          </section>

          {/* About Dark Sky */}
          <section id="darksky" className="space-y-6">
            <motion.h2 
              className="text-3xl font-bold text-cosmic-50 border-b border-cosmic-700 pb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {t("About Dark Sky Preservation", "关于暗夜保护")}
            </motion.h2>
            <DarkSkyKnowledge />
            <LocationDiscoverySection />
          </section>

          {/* Resources */}
          <section id="resources" className="space-y-6">
            <motion.h2 
              className="text-3xl font-bold text-cosmic-50 border-b border-cosmic-700 pb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {t("Resources", "资源")}
            </motion.h2>
            <ResourcesSection />
          </section>

          <AboutFooter />
        </div>
      </div>
    </div>
  );
};

export default About;
