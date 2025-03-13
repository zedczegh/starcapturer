
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getScoreColorClass } from "./SIQSSummaryScore";
import { Progress } from "@/components/ui/progress";

interface SIQSFactorsListProps {
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
}

const SIQSFactorsList: React.FC<SIQSFactorsListProps> = ({ factors = [] }) => {
  const { t, language } = useLanguage();
  
  if (!factors || factors.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        {t("No factors available", "没有可用的因素")}
      </div>
    );
  }
  
  // Translate factor names and descriptions to Chinese if language is set to Chinese
  const getTranslatedFactorName = (name: string): string => {
    if (language === 'en') return name;
    
    const translations: Record<string, string> = {
      "Light Pollution": "光污染",
      "Weather Conditions": "天气条件",
      "Moon Phase": "月相",
      "Seeing Conditions": "视宁度",
      "Cloud Cover": "云层覆盖",
      "Humidity": "湿度",
      "Wind Speed": "风速",
      "Precipitation": "降水量",
      "Elevation": "海拔高度",
      "Air Quality": "空气质量",
      "Season": "季节",
      "Temperature": "温度"
    };
    
    return translations[name] || name;
  };
  
  const getTranslatedDescription = (description: string): string => {
    if (language === 'en') return description;
    
    // Common phrases to translate
    if (description.includes("excellent")) {
      return description.replace("excellent", "极佳的");
    } else if (description.includes("good")) {
      return description.replace("good", "良好的");
    } else if (description.includes("moderate")) {
      return description.replace("moderate", "中等的");
    } else if (description.includes("poor")) {
      return description.replace("poor", "较差的");
    } else if (description.includes("very poor")) {
      return description.replace("very poor", "非常差的");
    }
    
    // For descriptions that don't match patterns above
    const descriptionsMap: Record<string, string> = {
      "Low light pollution levels provide excellent visibility": "低光污染水平提供了极佳的可见度",
      "Moderate light pollution may affect faint objects": "中等光污染可能影响微弱天体的观测",
      "High light pollution significantly reduces visibility": "高光污染显著降低了可见度",
      "Clear skies provide optimal viewing conditions": "晴朗的天空提供了最佳的观测条件",
      "Partially cloudy conditions with some visibility": "局部多云条件下有一定的可见度",
      "Mostly cloudy with limited visibility": "大部分多云，能见度有限",
      "New moon provides darkest sky conditions": "新月提供最暗的天空条件",
      "Quarter moon provides moderate sky brightness": "半月提供中等的天空亮度",
      "Full moon significantly brightens the night sky": "满月显著增亮夜空",
      "Stable atmosphere with excellent seeing": "大气稳定，视宁度极佳",
      "Average seeing conditions for imaging": "成像的平均视宁度条件",
      "Turbulent atmosphere with poor seeing": "大气湍流，视宁度较差",
      "Low wind conditions are favorable for imaging": "低风条件有利于成像",
      "High winds may affect stability and image quality": "大风可能影响稳定性和图像质量",
      "Low humidity provides better transparency": "低湿度提供更好的透明度",
      "High humidity may reduce contrast and clarity": "高湿度可能降低对比度和清晰度"
    };
    
    return descriptionsMap[description] || description;
  };
  
  return (
    <div className="space-y-4 mt-2">
      {factors.map((factor, index) => {
        // Convert score from 0-100 to 0-10 scale
        const scoreOn10Scale = factor.score / 10;
        const colorClass = getScoreColorClass(scoreOn10Scale);
        const progressColorClass = colorClass.replace('text-', '');
        const translatedName = getTranslatedFactorName(factor.name);
        const translatedDescription = getTranslatedDescription(factor.description);
        
        return (
          <div 
            key={`factor-${index}`} 
            className="p-3 rounded-lg bg-cosmic-800/30 hover:bg-cosmic-800/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium">{translatedName}</h4>
              <span className={`text-sm ${colorClass} font-semibold`}>
                {scoreOn10Scale.toFixed(1)}
              </span>
            </div>
            
            <Progress 
              value={factor.score} 
              className="h-2 bg-cosmic-700/40"
              style={{ 
                '--progress-background': `var(--${progressColorClass})`,
              } as React.CSSProperties}
            />
            
            <p className="text-xs text-muted-foreground mt-2">
              {translatedDescription}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(SIQSFactorsList);
