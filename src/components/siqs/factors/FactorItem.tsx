
import React, { useMemo, memo } from "react";
import { Progress } from "@/components/ui/progress";
import { getScoreColorClass } from "../utils/scoreUtils";
import { 
  getTranslatedFactorName, 
  getTranslatedDescription 
} from "../utils/factorTranslations";
import { getProgressColorClass } from "../utils/progressColor";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface FactorItemProps {
  factor: {
    name: string;
    score: number;
    description: string;
  };
  index: number;
}

const FactorItem: React.FC<FactorItemProps> = ({ factor, index }) => {
  const { language } = useLanguage();
  
  // Memoize expensive calculations to prevent unnecessary re-renders
  const memoizedValues = useMemo(() => {
    // Convert score from 0-100 to 0-10 scale if needed
    const scoreOn10Scale = factor.score > 10 ? factor.score / 10 : factor.score;
    const colorClass = getScoreColorClass(scoreOn10Scale);
    const progressColorClass = getProgressColorClass(scoreOn10Scale);
    const translatedName = getTranslatedFactorName(factor.name, language);
    const translatedDescription = getTranslatedDescription(factor.description, language);
    
    return {
      scoreOn10Scale,
      colorClass,
      progressColorClass,
      translatedName,
      translatedDescription
    };
  }, [factor.score, factor.name, factor.description, language]);
  
  return (
    <motion.div 
      className="p-3 rounded-lg bg-cosmic-800/40 hover:bg-cosmic-800/60 transition-colors border border-cosmic-600/20 shadow-md"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-medium">{memoizedValues.translatedName}</h4>
        <span className={`text-sm ${memoizedValues.colorClass} font-semibold px-2 py-0.5 rounded-full bg-cosmic-700/40`}>
          {memoizedValues.scoreOn10Scale.toFixed(1)}
        </span>
      </div>
      
      <Progress 
        value={factor.score > 10 ? factor.score : factor.score * 10} 
        className="h-2 bg-cosmic-700/40"
        colorClass={memoizedValues.progressColorClass}
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        {memoizedValues.translatedDescription}
      </p>
    </motion.div>
  );
};

export default memo(FactorItem);
