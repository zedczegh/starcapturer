
import React, { memo, useMemo } from "react";
import EmptyFactors from "./factors/EmptyFactors";
import FactorItem from "./factors/FactorItem";
import { normalizeFactorScores } from "@/lib/siqs/utils";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface SIQSFactorsListProps {
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
}

const SIQSFactorsList: React.FC<SIQSFactorsListProps> = ({ factors = [] }) => {
  const { t } = useLanguage();
  
  // Ensure all factors are normalized to 0-10 scale for consistent display
  const normalizedFactors = useMemo(() => {
    return normalizeFactorScores(factors);
  }, [factors]);
  
  if (!normalizedFactors || normalizedFactors.length === 0) {
    return <EmptyFactors />;
  }
  
  // Special handling for cloud cover - ensure 0% cloud cover always shows score 10.0
  // and don't penalize too harshly for high cloud cover
  const finalFactors = normalizedFactors.map(factor => {
    if (factor.name === "Cloud Cover" || factor.name === "云层覆盖") {
      // If description mentions 0%, ensure score is 10
      if (factor.description.includes("0%")) {
        return { ...factor, score: 10 };
      }
      
      // For high cloud cover, give a small score to make users feel better
      if (factor.description.includes("over 50%") || factor.description.includes("超过50%")) {
        // Calculate a score between 0 and 1.5 based on the original score
        const baseScore = factor.score;
        // Scale to max 1.5 - even terrible conditions get a small score
        const adjustedScore = Math.max(0, Math.min(1.5, baseScore));
        
        // Add an encouraging message
        const updatedDescription = factor.description + (
          factor.name === "Cloud Cover" ? 
            "\n\nDon't worry, clear skies will eventually come!" : 
            "\n\n别担心，晴朗的天空终将到来！"
        );
        
        return { 
          ...factor, 
          score: adjustedScore,
          description: updatedDescription
        };
      }
    }
    return factor;
  });
  
  // Check if we should show the photo points reminder
  const hasHighCloudCover = finalFactors.some(factor => 
    (factor.name === "Cloud Cover" || factor.name === "云层覆盖") && 
    factor.score <= 1.5
  );
  
  return (
    <div className="space-y-4 mt-2">
      {finalFactors.map((factor, index) => (
        <FactorItem 
          key={`factor-${factor.name}-${index}`}
          factor={factor}
          index={index}
        />
      ))}
      
      {hasHighCloudCover && (
        <div className="mt-6 bg-blue-900/30 border border-blue-700/30 rounded-lg p-3 text-sm">
          <p className="text-blue-200 mb-2">
            {t(
              "Try our Photo Points feature to find nearby locations with better viewing conditions!",
              "尝试使用我们的摄影点功能，寻找附近观测条件更好的地点！"
            )}
          </p>
          <Link 
            to="/photo-points" 
            className="text-primary hover:text-primary-focus text-sm font-medium"
          >
            {t("Find Photo Points Nearby →", "查找附近的摄影点 →")}
          </Link>
        </div>
      )}
    </div>
  );
};

export default memo(SIQSFactorsList);
