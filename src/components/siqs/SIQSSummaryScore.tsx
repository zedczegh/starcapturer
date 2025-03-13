
import React, { useMemo, memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

interface SIQSSummaryScoreProps {
  score: number;
  isViable: boolean;
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
}

// Memoize recommendation messages to avoid recalculations
const recommendationCache: Record<number, Record<string, string>> = {};

export const getRecommendationMessage = (score: number, language: string): string => {
  // Round to nearest 0.5 for caching purposes
  const roundedScore = Math.round(score * 2) / 2;
  
  // Check cache first
  if (recommendationCache[roundedScore]?.[language]) {
    return recommendationCache[roundedScore][language];
  }
  
  let result = "";
  if (language === 'en') {
    if (score >= 8) result = "Excellent conditions for astrophotography. Optimal imaging possible.";
    else if (score >= 6) result = "Good conditions for imaging. Minor adjustments may be needed.";
    else if (score >= 4) result = "Fair conditions. Expect some challenges with image quality.";
    else if (score >= 2) result = "Poor conditions. Consider rescheduling or changing location.";
    else result = "Unsuitable conditions. Not recommended for imaging.";
  } else {
    if (score >= 8) result = "天文摄影的绝佳条件。可以进行最佳成像。";
    else if (score >= 6) result = "成像条件良好。可能需要微小调整。";
    else if (score >= 4) result = "条件一般。图像质量可能面临一些挑战。";
    else if (score >= 2) result = "条件较差。建议重新安排或更换地点。";
    else result = "不适合的条件。不推荐进行成像。";
  }
  
  // Cache the result
  if (!recommendationCache[roundedScore]) {
    recommendationCache[roundedScore] = {};
  }
  recommendationCache[roundedScore][language] = result;
  
  return result;
};

// Color class cache
const scoreColorCache: Record<number, string> = {};

export const getScoreColorClass = (score: number): string => {
  // Round to nearest 0.1 for caching
  const roundedScore = Math.round(score * 10) / 10;
  
  if (scoreColorCache[roundedScore] !== undefined) {
    return scoreColorCache[roundedScore];
  }
  
  let result = "text-red-400";
  if (score >= 8) result = "text-green-400";
  else if (score >= 6) result = "text-green-300";
  else if (score >= 4) result = "text-yellow-300";
  else if (score >= 2) result = "text-orange-300";
  
  scoreColorCache[roundedScore] = result;
  return result;
};

// Background class cache
const scoreBgCache: Record<number, string> = {};

export const getScoreBackgroundClass = (score: number): string => {
  // Round to nearest 0.1 for caching
  const roundedScore = Math.round(score * 10) / 10;
  
  if (scoreBgCache[roundedScore] !== undefined) {
    return scoreBgCache[roundedScore];
  }
  
  let result = "bg-red-400/20";
  if (score >= 8) result = "bg-green-400/20";
  else if (score >= 6) result = "bg-green-300/20";
  else if (score >= 4) result = "bg-yellow-300/20";
  else if (score >= 2) result = "bg-orange-300/20";
  
  scoreBgCache[roundedScore] = result;
  return result;
};

const SIQSSummaryScore: React.FC<SIQSSummaryScoreProps> = ({ score, isViable, factors }) => {
  const { language, t } = useLanguage();
  
  // Memoize calculations to prevent unnecessary re-renders
  const memoizedValues = useMemo(() => {
    const colorClass = getScoreColorClass(score);
    const bgClass = getScoreBackgroundClass(score);
    
    let scoreLabel;
    if (score >= 8) scoreLabel = t("Excellent", "极佳");
    else if (score >= 6) scoreLabel = t("Good", "良好");
    else if (score >= 4) scoreLabel = t("Fair", "一般");
    else if (score >= 2) scoreLabel = t("Poor", "较差");
    else scoreLabel = t("Bad", "很差");
    
    const recommendation = getRecommendationMessage(score, language);
    
    return {
      colorClass,
      bgClass,
      scoreLabel,
      recommendation
    };
  }, [score, language, t]);
  
  return (
    <div className="relative px-6 py-4 rounded-lg mb-6 flex flex-col md:flex-row items-center md:items-start gap-4 hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 opacity-10 ${memoizedValues.bgClass} rounded-lg pointer-events-none`}></div>
      
      <div className="flex flex-col items-center justify-center">
        <div className={`text-3xl md:text-4xl font-bold ${memoizedValues.colorClass}`}>
          {score.toFixed(1)}
        </div>
        <Badge variant="outline" className={`mt-1 ${memoizedValues.colorClass} border-current`}>
          {memoizedValues.scoreLabel}
        </Badge>
      </div>
      
      <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
        <h3 className="text-lg font-medium">
          {isViable 
            ? t("Conditions Summary", "条件总结") 
            : t("Not Recommended", "不推荐")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {memoizedValues.recommendation}
        </p>
      </div>
    </div>
  );
};

export default memo(SIQSSummaryScore);
