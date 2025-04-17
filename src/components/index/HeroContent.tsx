
import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Map } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroContent: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const scrollToCalculator = () => {
    const calculatorSection = document.getElementById("calculator-section");
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  return (
    <div className="container mx-auto px-4 pt-16 pb-32 relative z-10">
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
          {t("Capture the ", "捕捉")}{" "}
          <span className="text-gradient-blue">{t("Cosmos", "宇宙")}</span>
        </motion.h1>
        
        <motion.p 
          className="text-lg text-gray-300 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          {t(
            "Find the perfect spots for astrophotography with our SIQS algorithm that evaluates viewing conditions in real-time.",
            "利用我们的SIQS算法实时评估观测条件，找到天文摄影的完美地点。"
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
            className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 py-6"
          >
            {t("Get Started", "开始使用")}
          </Button>
          <Button 
            onClick={() => navigate('/photo-points')}
            size="lg" 
            variant="outline"
            className="bg-cosmic-800/50 border-cosmic-700 hover:bg-cosmic-700/70"
          >
            <Map className="mr-2 h-5 w-5" />
            {t("Explore Locations", "探索位置")}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroContent;
