
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
      detail?: {
        evening: number;
        morning: number;
      };
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
  
  // Give strong priority to nighttime cloud cover data
  const finalFactors = normalizedFactors.map(factor => {
    // Prioritize nighttime cloud factors
    if ((factor.name === "Cloud Cover" || factor.name === "云层覆盖") ||
        (factor.name === "Nighttime Cloud Cover" || factor.name === "夜间云层覆盖")) {
      // If we have nighttime data available
      if (factor.nighttimeData && factor.nighttimeData.average !== undefined) {
        // Prioritize the nighttime average for the score and update the name
        const nighttimeValue = factor.nighttimeData.average;
        
        // Adjust the factor name to indicate nighttime
        const nighttimeName = language === 'zh' ? '天文夜间云层覆盖' : 'Astronomical Night Cloud Cover';
        
        // Calculate score based on nighttime cloud cover
        // Clear sky (0-10%) should have a high score (9-10)
        // Heavy cloud (>40%) should have a low score (0-4)
        let nighttimeScore = 10;
        
        if (nighttimeValue > 0) {
          // Exponential decay for score as cloud cover increases
          nighttimeScore = Math.max(0, Math.min(10, 10 * Math.exp(-0.05 * nighttimeValue)));
        }
        
        // If nighttime cloud cover is 0-10%, ensure score is excellent (9-10)
        if (nighttimeValue <= 10) {
          nighttimeScore = Math.max(9, nighttimeScore);
          return { 
            ...factor, 
            name: nighttimeName,
            score: nighttimeScore,
            description: language === 'zh' 
              ? `天文夜间云层覆盖率为${nighttimeValue.toFixed(1)}%，极佳的成像条件`
              : `Astronomical night cloud cover of ${nighttimeValue.toFixed(1)}%, excellent for imaging`
          };
        }
        
        // For moderate cloud cover (10-30%)
        if (nighttimeValue <= 30) {
          return { 
            ...factor, 
            name: nighttimeName,
            score: nighttimeScore,
            description: language === 'zh' 
              ? `天文夜间云层覆盖率为${nighttimeValue.toFixed(1)}%，良好的成像条件`
              : `Astronomical night cloud cover of ${nighttimeValue.toFixed(1)}%, good for imaging`
          };
        }
        
        // For higher cloud cover
        return { 
          ...factor, 
          name: nighttimeName,
          score: nighttimeScore,
          description: language === 'zh' 
            ? `天文夜间云层覆盖率为${nighttimeValue.toFixed(1)}%，可能影响成像质量`
            : `Astronomical night cloud cover of ${nighttimeValue.toFixed(1)}%, may affect imaging quality`
        };
      }
      
      // If description mentions 0%, ensure score is 10
      if (factor.description.includes("0%")) {
        return { ...factor, score: 10 };
      }
    }
    
    // For Chinese UI, ensure factor names are translated
    if (language === 'zh') {
      if (factor.name === 'Cloud Cover') return { ...factor, name: '云层覆盖' };
      if (factor.name === 'Nighttime Cloud Cover') return { ...factor, name: '夜间云层覆盖' };
      if (factor.name === 'Astronomical Night Cloud Cover') return { ...factor, name: '天文夜间云层覆盖' };
      if (factor.name === 'Light Pollution') return { ...factor, name: '光污染' };
      if (factor.name === 'Moon Phase') return { ...factor, name: '月相' };
      if (factor.name === 'Humidity') return { ...factor, name: '湿度' };
      if (factor.name === 'Wind Speed') return { ...factor, name: '风速' };
      if (factor.name === 'Seeing Conditions') return { ...factor, name: '视宁度' };
      if (factor.name === 'Air Quality') return { ...factor, name: '空气质量' };
      if (factor.name === 'Clear Sky Rate') return { ...factor, name: '晴空率' };
    }
    
    return factor;
  });
  
  // Sort factors to ensure consistent order with nighttime cloud cover at top
  const sortedFactors = [...finalFactors].sort((a, b) => {
    // Define the order of factors
    const order = [
      'Astronomical Night Cloud Cover', '天文夜间云层覆盖',
      'Nighttime Cloud Cover', '夜间云层覆盖',
      'Cloud Cover', '云层覆盖',
      'Light Pollution', '光污染',
      'Seeing Conditions', '视宁度',
      'Wind Speed', '风速',
      'Humidity', '湿度',
      'Moon Phase', '月相',
      'Air Quality', '空气质量',
      'Clear Sky Rate', '晴空率'
    ];
    
    const indexA = order.indexOf(a.name);
    const indexB = order.indexOf(b.name);
    
    // If both factors are in the order list, sort by that
    if (indexA >= 0 && indexB >= 0) {
      return indexA - indexB;
    }
    
    // If only one is in the list, prioritize it
    if (indexA >= 0) return -1;
    if (indexB >= 0) return 1;
    
    // Sort alphabetically otherwise
    return a.name.localeCompare(b.name);
  });
  
  // Render the factors
  return (
    <div className="my-6 space-y-4">
      {sortedFactors.map((factor, index) => (
        <FactorItem key={index} factor={factor} />
      ))}
    </div>
  );
};

export default memo(SIQSFactorsList);
