
import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { formatSIQSScore, getSIQSLevel } from "@/lib/siqs/utils";

interface SIQSDataSectionProps {
  locationData: any;
  t: any;
  language: string;
}

const SIQSDataSection: React.FC<SIQSDataSectionProps> = ({
  locationData,
  t,
  language
}) => {
  // Check if we have SIQS result
  const hasSiqsData = locationData.siqsResult && typeof locationData.siqsResult.score === 'number';
  
  if (!hasSiqsData) {
    return (
      <Card className="p-4 bg-cosmic-900/40 border-cosmic-800/50 max-w-[300px]">
        <div className="text-center text-sm text-muted-foreground">
          {t ? t("No SIQS data available", "无SIQS数据") : "No SIQS data available"}
        </div>
      </Card>
    );
  }
  
  const siqsScore = locationData.siqsResult.score;
  const scoreColorClass = getProgressColorClass(siqsScore);
  const qualityText = t ? t(getSIQSLevel(siqsScore), 
    getSIQSLevel(siqsScore) === 'Excellent' ? "优秀" : 
    getSIQSLevel(siqsScore) === 'Good' ? "良好" : 
    getSIQSLevel(siqsScore) === 'Average' ? "一般" : 
    getSIQSLevel(siqsScore) === 'Poor' ? "较差" : "很差"
  ) : getSIQSLevel(siqsScore);
  
  return (
    <Card className="p-4 bg-cosmic-900/40 border-cosmic-800/50 max-w-[300px]">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">
            {t ? t("Stellar Imaging Quality", "天文摄影质量") : "Stellar Imaging Quality"}
          </h3>
          <span className={`text-xl font-bold ${scoreColorClass.replace('bg-', 'text-')}`}>
            {formatSIQSScore(siqsScore)}
          </span>
        </div>
        
        <Progress 
          value={siqsScore * 10} 
          className="h-2"
          colorClass={scoreColorClass}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span className={scoreColorClass.replace('bg-', 'text-')}>
            {qualityText}
          </span>
          <span>10</span>
        </div>
      </div>
    </Card>
  );
};

export default SIQSDataSection;
