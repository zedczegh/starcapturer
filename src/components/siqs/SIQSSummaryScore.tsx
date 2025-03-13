
import React from "react";
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

export const getRecommendationMessage = (score: number, language: string): string => {
  if (language === 'en') {
    if (score >= 8) return "Excellent conditions for astrophotography. Optimal imaging possible.";
    if (score >= 6) return "Good conditions for imaging. Minor adjustments may be needed.";
    if (score >= 4) return "Fair conditions. Expect some challenges with image quality.";
    if (score >= 2) return "Poor conditions. Consider rescheduling or changing location.";
    return "Unsuitable conditions. Not recommended for imaging.";
  } else {
    if (score >= 8) return "天文摄影的绝佳条件。可以进行最佳成像。";
    if (score >= 6) return "成像条件良好。可能需要微小调整。";
    if (score >= 4) return "条件一般。图像质量可能面临一些挑战。";
    if (score >= 2) return "条件较差。建议重新安排或更换地点。";
    return "不适合的条件。不推荐进行成像。";
  }
};

export const getScoreColorClass = (score: number): string => {
  if (score >= 8) return "text-green-400";
  if (score >= 6) return "text-green-300";
  if (score >= 4) return "text-yellow-300";
  if (score >= 2) return "text-orange-300";
  return "text-red-400";
};

export const getScoreBackgroundClass = (score: number): string => {
  if (score >= 8) return "bg-green-400/20";
  if (score >= 6) return "bg-green-300/20";
  if (score >= 4) return "bg-yellow-300/20";
  if (score >= 2) return "bg-orange-300/20";
  return "bg-red-400/20";
};

const SIQSSummaryScore: React.FC<SIQSSummaryScoreProps> = ({ score, isViable, factors }) => {
  const { language, t } = useLanguage();
  
  const colorClass = getScoreColorClass(score);
  const bgClass = getScoreBackgroundClass(score);
  
  let scoreLabel;
  if (score >= 8) scoreLabel = t("Excellent", "极佳");
  else if (score >= 6) scoreLabel = t("Good", "良好");
  else if (score >= 4) scoreLabel = t("Fair", "一般");
  else if (score >= 2) scoreLabel = t("Poor", "较差");
  else scoreLabel = t("Bad", "很差");
  
  const recommendation = getRecommendationMessage(score, language);
  
  return (
    <div className="relative px-6 py-4 rounded-lg mb-6 flex flex-col md:flex-row items-center md:items-start gap-4 hover:shadow-lg transition-all duration-300">
      <div className={`absolute inset-0 opacity-10 ${bgClass} rounded-lg pointer-events-none`}></div>
      
      <div className="flex flex-col items-center justify-center">
        <div className={`text-3xl md:text-4xl font-bold ${colorClass}`}>
          {score.toFixed(1)}
        </div>
        <Badge variant="outline" className={`mt-1 ${colorClass} border-current`}>
          {scoreLabel}
        </Badge>
      </div>
      
      <div className="flex-1 flex flex-col gap-2 text-center md:text-left">
        <h3 className="text-lg font-medium">
          {isViable 
            ? t("Conditions Summary", "条件总结") 
            : t("Not Recommended", "不推荐")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {recommendation}
        </p>
      </div>
    </div>
  );
};

export default React.memo(SIQSSummaryScore);
