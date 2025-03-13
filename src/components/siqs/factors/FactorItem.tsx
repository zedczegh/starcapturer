
import React from "react";
import { Progress } from "@/components/ui/progress";
import { getScoreColorClass } from "../SIQSSummaryScore";
import { getTranslatedFactorName, getTranslatedDescription, getProgressColor } from "../utils/factorTranslations";
import { useLanguage } from "@/contexts/LanguageContext";

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
  
  // Convert score from 0-100 to 0-10 scale
  const scoreOn10Scale = factor.score / 10;
  const colorClass = getScoreColorClass(scoreOn10Scale);
  const progressColor = getProgressColor(scoreOn10Scale);
  const translatedName = getTranslatedFactorName(factor.name, language);
  const translatedDescription = getTranslatedDescription(factor.description, language);
  
  return (
    <div 
      className="p-3 rounded-lg bg-cosmic-800/40 hover:bg-cosmic-800/50 transition-colors border border-cosmic-600/20 shadow-md animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-medium">{translatedName}</h4>
        <span className={`text-sm ${colorClass} font-semibold px-2 py-0.5 rounded-full bg-cosmic-700/40`}>
          {scoreOn10Scale.toFixed(1)}
        </span>
      </div>
      
      <Progress 
        value={factor.score} 
        className="h-2 bg-cosmic-700/40 animate-enter"
        style={{ 
          '--progress-background': progressColor,
        } as React.CSSProperties}
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        {translatedDescription}
      </p>
    </div>
  );
};

export default React.memo(FactorItem);
