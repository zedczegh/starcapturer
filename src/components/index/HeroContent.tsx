
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Satellite } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroContent: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 pt-10 pb-24 relative z-10">
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
              {t("SIQS Calculator", "SIQS计算器")}
            </span>
          </div>
        </motion.h1>
      </div>
    </div>
  );
};

export default HeroContent;
