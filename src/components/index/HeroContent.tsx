
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const HeroContent: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-0 sm:px-4 pt-6 sm:pt-10 pb-16 sm:pb-24 relative z-10">
      <div className="max-w-2xl mx-auto text-center">
        <Badge variant="outline" className="mb-6 py-1.5 px-6 border-primary/30 bg-primary/10 text-primary pulse-glow">
          <Star className="h-3.5 w-3.5 mr-1" />
          <span>{t("Stellar Imaging Quality Scores", "恒星成像质量分数")}</span>
        </Badge>
      </div>
    </div>
  );
};

export default HeroContent;
