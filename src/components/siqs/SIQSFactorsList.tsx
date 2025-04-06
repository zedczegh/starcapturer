import React, { memo, useMemo } from "react";
import EmptyFactors from "./factors/EmptyFactors";
import FactorItem from "./factors/FactorItem";
import { normalizeFactorScores } from "@/lib/siqs/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { SIQSFactor } from "@/lib/siqs/types";

interface SIQSFactorsListProps {
  factors?: Array<SIQSFactor>;
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
  
  // Give priority to nighttime cloud cover data
  const finalFactors = normalizedFactors.map(factor => {
    // If it's the cloud cover factor
    if ((factor.name === "Cloud Cover" || factor.name === "云层覆盖")) {
      // If we have nighttime data available
      if (factor.nighttimeData && factor.nighttimeData.average !== undefined) {
        // Prioritize the nighttime average for the score and update the name
        const nighttimeValue = factor.nighttimeData.average;
        
        // Adjust the factor name to indicate nighttime
        const nighttimeName = language === 'zh' ? '夜间云层覆盖' : 'Nighttime Cloud Cover';
        
        // Ensure there's a description
        const description = factor.description || (language === 'zh' 
          ? `夜间云层覆盖率为${nighttimeValue.toFixed(1)}%` 
          : `Nighttime cloud cover of ${nighttimeValue.toFixed(1)}%`);
        
        // If nighttime cloud cover is 0%, ensure score is 10
        if (nighttimeValue === 0) {
          return { 
            ...factor, 
            name: nighttimeName,
            score: 10,
            description: language === 'zh' 
              ? `夜间云层覆盖率为${nighttimeValue.toFixed(1)}%，非常适合成像`
              : `Nighttime cloud cover of ${nighttimeValue.toFixed(1)}%, excellent for imaging`
          };
        }
        
        return { 
          ...factor, 
          name: nighttimeName,
          // Leave score as is but update the description to show the nighttime value
          description: description + (description.includes('影响') || description.includes('quality') ? '' : 
            (language === 'zh' ? '，可能影响成像质量' : ', may affect imaging quality'))
        };
      }
      
      // Ensure description exists
      const cloudCoverDescription = factor.description || (language === 'zh' ? '云层覆盖数据' : 'Cloud cover data');
      
      // If description mentions 0%, ensure score is 10
      if (cloudCoverDescription.includes("0%")) {
        return { ...factor, description: cloudCoverDescription, score: 10 };
      }
      
      // Return with ensured description
      return { ...factor, description: cloudCoverDescription };
    }
    
    // For Chinese UI, ensure factor names are translated
    if (language === 'zh') {
      if (factor.name === 'Cloud Cover') return { ...factor, name: '云层覆盖', description: factor.description || '云层覆盖' };
      if (factor.name === 'Light Pollution') return { ...factor, name: '光污染', description: factor.description || '光污染' };
      if (factor.name === 'Moon Phase') return { ...factor, name: '月相', description: factor.description || '月相' };
      if (factor.name === 'Humidity') return { ...factor, name: '湿度', description: factor.description || '湿度' };
      if (factor.name === 'Wind Speed') return { ...factor, name: '风速', description: factor.description || '风速' };
      if (factor.name === 'Seeing Conditions') return { ...factor, name: '视宁度', description: factor.description || '视宁度' };
      if (factor.name === 'Air Quality') return { ...factor, name: '空气质量', description: factor.description || '空气质量' };
      if (factor.name === 'Clear Sky Rate') return { ...factor, name: '晴空率', description: factor.description || '晴空率' };
    }
    
    // Ensure all factors have a description
    return {
      ...factor,
      description: factor.description || factor.name
    };
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
