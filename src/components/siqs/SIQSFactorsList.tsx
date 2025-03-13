
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getScoreColorClass } from "./SIQSSummaryScore";

interface SIQSFactorsListProps {
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
}

const SIQSFactorsList: React.FC<SIQSFactorsListProps> = ({ factors = [] }) => {
  const { t } = useLanguage();
  
  if (!factors || factors.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        {t("No factors available", "没有可用的因素")}
      </div>
    );
  }
  
  return (
    <div className="space-y-3 mt-2">
      {factors.map((factor, index) => {
        const colorClass = getScoreColorClass(factor.score);
        
        return (
          <div 
            key={`factor-${index}`} 
            className="flex justify-between items-center p-3 rounded-lg bg-cosmic-800/30 hover:bg-cosmic-800/40 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{factor.name}</h4>
                <span className={`text-sm ${colorClass} font-semibold`}>
                  {factor.score.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {factor.description}
              </p>
            </div>
            
            <div className="w-16 h-16 flex items-center justify-center">
              <div className="relative w-12 h-12">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    className="stroke-cosmic-700"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="100, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={colorClass.replace('text-', 'stroke-')}
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${factor.score * 10}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                  {Math.round(factor.score * 10)}%
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(SIQSFactorsList);
