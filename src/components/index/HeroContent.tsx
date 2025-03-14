
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Telescope, Rocket, Satellite } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const HeroContent: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 pt-10 pb-36 relative z-10">
      <div className="max-w-2xl mx-auto text-center">
        <Badge variant="outline" className="mb-6 py-1.5 px-6 border-primary/30 bg-primary/10 text-primary pulse-glow">
          <Star className="h-3.5 w-3.5 mr-1" />
          <span>{t("Stellar Imaging Quality Scores", "恒星成像质量分数")}</span>
        </Badge>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white drop-shadow-lg"
        >
          <div className="inline-flex items-center">
            <Satellite className="h-8 w-8 mr-2 text-primary" />
            <span className="text-gradient-blue">
              {t("Perfect Astrophotography", "完美的天文摄影")}
            </span>
          </div>
          <br />
          <span className="terminal-text">{t("Starts with the Perfect Location", "始于完美的地点")}</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-white text-opacity-90 mb-8 drop-shadow-md"
        >
          {t(
            "Discover optimal shooting locations with data-driven Stellar Imaging Quality Scores. Find the best spots for breathtaking night sky images anywhere on Earth.",
            "通过数据驱动的恒星成像质量分数发现最佳拍摄地点。在地球上任何地方找到拍摄令人惊叹的夜空图像的最佳地点。"
          )}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex justify-center space-x-4"
        >
          <a href="#calculator-section" className="sci-fi-btn group text-primary flex items-center space-x-2">
            <Telescope className="h-4 w-4 group-hover:text-primary-foreground transition-colors" />
            <span className="group-hover:text-primary-foreground transition-colors">{t("Calculate SIQS", "计算SIQS")}</span>
          </a>
          <Link to="/about" className="sci-fi-btn group text-primary-foreground/70 flex items-center space-x-2">
            <Rocket className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="group-hover:text-primary transition-colors">{t("Learn More", "了解更多")}</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroContent;
