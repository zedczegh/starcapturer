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
  
  // Fix cloud cover factor scoring and description
  const finalFactors = normalizedFactors.map(factor => {
    // If it's the cloud cover factor
    if ((factor.name === "Cloud Cover" || factor.name === "云层覆盖" || 
         factor.name === "Nighttime Cloud Cover" || factor.name === "夜间云层覆盖")) {
      
      // If we have nighttime data available
      if (factor.nighttimeData && factor.nighttimeData.average !== undefined) {
        // Prioritize the nighttime average for the score and update the name
        const nighttimeValue = factor.nighttimeData.average;
        
        // Adjust the factor name to indicate nighttime
        const nighttimeName = language === 'zh' ? '夜间云层覆盖' : 'Nighttime Cloud Cover';
        
        // CRITICAL FIX: Ensure cloud cover percentage is inversely related to score
        // 0% cloud cover = 10 score, 100% cloud cover = 0 score
        let correctedScore;
        let description;
        
        if (nighttimeValue <= 0) {
          // Clear skies
          correctedScore = 10;
          description = language === 'zh' 
            ? '夜间晴朗无云，非常适合天文摄影'
            : 'Clear night skies, excellent for astrophotography';
        } else if (nighttimeValue >= 100) {
          // Completely overcast
          correctedScore = 0;
          description = language === 'zh'
            ? '夜间完全被云层覆盖，不适合天文摄影'
            : 'Completely overcast night skies, not suitable for astrophotography';
        } else if (nighttimeValue > 80) {
          // Heavy cloud cover
          correctedScore = Math.max(0, (100 - nighttimeValue) / 10);
          description = language === 'zh'
            ? `夜间云层覆盖率为${nighttimeValue.toFixed(1)}%，不推荐进行天文摄影`
            : `Nighttime cloud cover of ${nighttimeValue.toFixed(1)}%, not recommended for imaging`;
        } else {
          // Partial cloud cover
          correctedScore = Math.max(0, (100 - nighttimeValue) / 10);
          description = language === 'zh' 
            ? `夜间云层覆盖率为${nighttimeValue.toFixed(1)}%` + (nighttimeValue > 50 ? '，可能影响成像质量' : '')
            : `Nighttime cloud cover of ${nighttimeValue.toFixed(1)}%` + (nighttimeValue > 50 ? ', may affect imaging quality' : '');
        }
        
        return { 
          ...factor, 
          name: nighttimeName,
          score: correctedScore,
          description: description
        };
      }
      
      // Regular cloud cover (non-nighttime)
      // Extract cloud cover percentage from description if available
      let cloudCoverPercentage = 50; // Default value
      const percentMatch = factor.description.match(/(\d+(?:\.\d+)?)%/);
      if (percentMatch && percentMatch[1]) {
        cloudCoverPercentage = parseFloat(percentMatch[1]);
      }
      
      // CRITICAL FIX: Ensure cloud cover percentage is inversely related to score
      let correctedScore;
      let description;
      
      if (cloudCoverPercentage <= 0) {
        // Clear skies
        correctedScore = 10;
        description = language === 'zh' 
          ? '晴朗无云，非常适合天文摄影'
          : 'Clear skies, excellent for astrophotography';
      } else if (cloudCoverPercentage >= 100) {
        // Completely overcast
        correctedScore = 0;
        description = language === 'zh'
          ? '完全被云层覆盖，不适合天文摄影'
          : 'Completely overcast, not suitable for astrophotography';
      } else if (cloudCoverPercentage > 80) {
        // Heavy cloud cover
        correctedScore = Math.max(0, (100 - cloudCoverPercentage) / 10);
        description = language === 'zh'
          ? `云层覆盖率为${cloudCoverPercentage.toFixed(1)}%，不推荐进行天文摄影`
          : `Cloud cover of ${cloudCoverPercentage.toFixed(1)}%, not recommended for imaging`;
      } else {
        // Partial cloud cover
        correctedScore = Math.max(0, (100 - cloudCoverPercentage) / 10);
        description = language === 'zh' 
          ? `云层覆盖率为${cloudCoverPercentage.toFixed(1)}%` + (cloudCoverPercentage > 50 ? '，可能影响成像质量' : '')
          : `Cloud cover of ${cloudCoverPercentage.toFixed(1)}%` + (cloudCoverPercentage > 50 ? ', may affect imaging quality' : '');
      }
      
      return { 
        ...factor, 
        score: correctedScore,
        description: description
      };
    }
    
    // For Chinese UI, ensure factor names are translated
    if (language === 'zh') {
      if (factor.name === 'Cloud Cover') return { ...factor, name: '云层覆盖' };
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
  
  // Sort factors to ensure Clear Sky Rate appears after Air Quality
  const sortedFactors = [...finalFactors].sort((a, b) => {
    // Define the order of factors
    const order = [
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
    
    // If both factors are in the order array, sort by index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one factor is in the order array, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // Otherwise, keep original order
    return 0;
  });
  
  return (
    <div className="space-y-4 mt-2">
      {sortedFactors.map((factor, index) => (
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
