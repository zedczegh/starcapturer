
import React from "react";
import SIQSFactorsList from "@/components/siqs/SIQSFactorsList";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";

interface SIQSFactorsDisplayProps {
  factors: Array<{
    name: string;
    score: number;
    description: string;
  }>;
  weatherData: any;
}

const SIQSFactorsDisplay: React.FC<SIQSFactorsDisplayProps> = ({ factors, weatherData }) => {
  const { t, language } = useLanguage();
  
  // Check if we have a clear sky rate factor
  const hasClearSkyFactor = factors.some(factor => 
    factor.name === 'Clear Sky Rate' || factor.name === '晴空率');
  
  return (
    <>
      {factors.length > 0 && (
        <div className="mt-4 space-y-4">
          <h4 className="text-sm font-medium">{t("Factors Affecting SIQS", "影响天文观测质量的因素")}</h4>
          <SIQSFactorsList factors={factors} />
        </div>
      )}
      
      {weatherData?.clearSkyRate && !hasClearSkyFactor && (
        <div className="mt-6 pt-4 border-t border-border/30">
          <h4 className="text-sm font-medium mb-3">{t("Clear Sky Rate", "晴空率")}</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">{t("Annual Rate", "年平均率")}</span>
              <span className="font-medium">{weatherData.clearSkyRate}%</span>
            </div>
            <Progress 
              value={weatherData.clearSkyRate} 
              className="h-2"
              colorClass="bg-blue-500/80"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'en' 
                ? `Historical clear sky average for this location`
                : `此位置的历史晴空平均值`}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default SIQSFactorsDisplay;
