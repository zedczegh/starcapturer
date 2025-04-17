
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Map, Camera } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import NavBar from "@/components/NavBar";

const HeroSection: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const scrollToCalculator = () => {
    const calculatorSection = document.getElementById("calculator-section");
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  const navigateToPhotoPoints = () => {
    navigate('/photo-points');
  };
  
  // Optimize background animation to reduce CPU load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Only render animations when visible
            entry.target.classList.add('animate-active');
          } else {
            // Pause animations when not visible
            entry.target.classList.remove('animate-active');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative min-h-screen overflow-hidden pt-16">
      {/* Cosmic nebula background with opacity */}
      <div className="absolute inset-0 bg-cosmic-950 bg-cover bg-center bg-no-repeat opacity-50 -z-10" />
      
      <NavBar />
      
      <div className="container mx-auto px-4 pt-20 pb-40 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 py-2 px-6 border-primary/30 bg-primary/10 text-primary pulse-glow">
              <Star className="h-4 w-4 mr-2 text-yellow-400" fill="#facc15" />
              <span className="text-sm md:text-base">{t("Stellar Imaging Quality Scores", "恒星成像质量分数")}</span>
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {t("Find Perfect ", "寻找完美")}{" "}
            <span className="text-gradient-blue">{t("Astrophotography", "天文摄影")}</span>
            {t(" Spots", "地点")}
          </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-300 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            {t(
              "Discover the ideal locations for capturing the night sky. Our SIQS algorithm evaluates light pollution, weather conditions, and more to help you find the perfect spot.",
              "发现拍摄夜空的理想位置。我们的SIQS算法评估光污染、天气条件等，帮助您找到完美的拍摄地点。"
            )}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <Button 
              onClick={scrollToCalculator}
              size="lg" 
              className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 py-6 px-8 shadow-lg hover:shadow-xl transition-all"
            >
              <Star className="mr-2 h-5 w-5" />
              {t("Calculate SIQS", "计算SIQS")}
            </Button>
            <Button 
              onClick={navigateToPhotoPoints}
              size="lg" 
              variant="outline"
              className="bg-cosmic-800/50 border-cosmic-700 hover:bg-cosmic-700/70 py-6 px-8"
            >
              <Map className="mr-2 h-5 w-5" />
              {t("Browse Locations", "浏览地点")}
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Gradient fade to the next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cosmic-900 to-transparent z-10"></div>
    </div>
  );
};

export default HeroSection;
