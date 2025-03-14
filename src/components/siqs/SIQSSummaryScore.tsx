
import React, { useMemo, memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import ScoreBadge from "./ScoreBadge";
import RecommendationMessage from "./RecommendationMessage";
import { getScoreBackgroundClass, getScoreLabel, getRecommendationMessage } from "./utils/scoreUtils";

interface SIQSSummaryScoreProps {
  score: number;
  isViable: boolean;
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
}

// Export this for other components to use
export { getRecommendationMessage } from "./utils/scoreUtils";

const SIQSSummaryScore: React.FC<SIQSSummaryScoreProps> = ({ score, isViable, factors }) => {
  const { language } = useLanguage();
  
  // Memoize calculations to prevent unnecessary re-renders
  const { bgClass, scoreLabel } = useMemo(() => ({
    bgClass: getScoreBackgroundClass(score),
    scoreLabel: getScoreLabel(score, language)
  }), [score, language]);
  
  return (
    <div className="relative px-6 py-4 rounded-lg mb-6 flex flex-col md:flex-row items-center md:items-start gap-4 hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 opacity-10 ${bgClass} rounded-lg pointer-events-none`}></div>
      
      <ScoreBadge score={score} label={scoreLabel} />
      <RecommendationMessage score={score} isViable={isViable} />
    </div>
  );
};

export default memo(SIQSSummaryScore);
