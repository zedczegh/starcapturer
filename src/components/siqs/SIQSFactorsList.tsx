
import React, { memo, useMemo } from "react";
import EmptyFactors from "./factors/EmptyFactors";
import FactorItem from "./factors/FactorItem";
import { normalizeFactorScores } from "@/lib/siqs/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface SIQSFactorsListProps {
  factors?: Array<{
    name: string;
    score: number;
    description: string;
    nighttimeData?: {
      average: number;
      timeRange: string;
    };
  }>;
}

const SIQSFactorsList: React.FC<SIQSFactorsListProps> = ({ factors = [] }) => {
  const { language } = useLanguage();
  
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
    // If it's the cloud cover factor
    if ((factor.name === "Cloud Cover" || factor.name === "云层覆盖")) {
      // If description mentions 0%, ensure score is 10
      if (factor.description.includes("0%")) {
        return { ...factor, score: 10 };
      }
      
      // For high cloud cover, ensure we show the actual score (could be very low)
      if (factor.description.includes("over 50%") || 
          factor.description.includes("超过50%") ||
          factor.description.includes("Heavy cloud") ||
          factor.description.includes("重度云层")) {
        return factor;
      }
    }
    
    // For Chinese UI, ensure factor names are translated
    if (language === 'zh' && factor.name === 'Cloud Cover') {
      return { ...factor, name: '云层覆盖' };
    } else if (language === 'zh' && factor.name === 'Light Pollution') {
      return { ...factor, name: '光污染' };
    } else if (language === 'zh' && factor.name === 'Moon Phase') {
      return { ...factor, name: '月相' };
    } else if (language === 'zh' && factor.name === 'Humidity') {
      return { ...factor, name: '湿度' };
    } else if (language === 'zh' && factor.name === 'Wind Speed') {
      return { ...factor, name: '风速' };
    } else if (language === 'zh' && factor.name === 'Seeing Conditions') {
      return { ...factor, name: '视宁度' };
    } else if (language === 'zh' && factor.name === 'Air Quality') {
      return { ...factor, name: '空气质量' };
    }
    
    return factor;
  });
  
  return (
    <div className="space-y-4 mt-2">
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
