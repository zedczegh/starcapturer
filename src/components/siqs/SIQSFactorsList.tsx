
import React, { memo, useMemo } from "react";
import EmptyFactors from "./factors/EmptyFactors";
import FactorItem from "./factors/FactorItem";
import { normalizeFactorScores } from "@/lib/siqs/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { CloudMoonRain } from "lucide-react";

interface SIQSFactorsListProps {
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
  encouragementMessage?: string | null;
}

const SIQSFactorsList: React.FC<SIQSFactorsListProps> = ({ 
  factors = [], 
  encouragementMessage = null 
}) => {
  const { t } = useLanguage();
  
  // Ensure all factors are normalized to 0-10 scale for consistent display
  const normalizedFactors = useMemo(() => {
    return normalizeFactorScores(factors);
  }, [factors]);
  
  if (!normalizedFactors || normalizedFactors.length === 0) {
    return <EmptyFactors />;
  }
  
  // Special handling for cloud cover - ensure 0% cloud cover always shows score 10.0
  const finalFactors = normalizedFactors.map(factor => {
    if (factor.name === "Cloud Cover" || factor.name === "云层覆盖") {
      // If description mentions 0%, ensure score is 10
      if (factor.description.includes("0%")) {
        return { ...factor, score: 10 };
      }
    }
    return factor;
  });
  
  return (
    <div className="space-y-4 mt-2">
      {/* Display encouragement message for poor conditions */}
      {encouragementMessage && (
        <div className="p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-600/30 mb-4 animate-pulse">
          <div className="flex items-center gap-2">
            <CloudMoonRain className="h-5 w-5 text-blue-400" />
            <p className="text-sm text-blue-100">
              {t(encouragementMessage, "不要担心，晴朗的天空终会到来！尝试使用我们的'附近观测点'功能寻找理想的天文摄影地点！")}
            </p>
          </div>
        </div>
      )}
      
      {finalFactors.map((factor, index) => (
        <FactorItem 
          key={`factor-${factor.name}-${index}`}
          factor={factor}
          index={index}
        />
      ))}
    </div>
  );
};

export default memo(SIQSFactorsList);
