
import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface FactorItemProps {
  factor: {
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
  };
  index: number;
}

const FactorItem: React.FC<FactorItemProps> = ({ factor, index }) => {
  const { t, language } = useLanguage();
  
  // Convert score (0-10) to percentage (0-100) for progress bar
  const scorePercent = Math.round(factor.score * 10);
  
  // Determine color based on score
  const getColorClass = (score: number) => {
    if (score >= 7.5) return "bg-green-500";
    if (score >= 5) return "bg-lime-500";
    if (score >= 2.5) return "bg-amber-500";
    return "bg-red-500";
  };
  
  // Determine color for nighttime details
  const getDetailColor = (value: number) => {
    if (value < 20) return "text-green-400"; 
    if (value < 40) return "text-lime-400"; 
    if (value < 60) return "text-amber-400";
    return "text-red-400";
  };
  
  const progressColor = getColorClass(factor.score);
  
  // Special formatting for Clear Sky Rate factor
  const isClearSkyRate = factor.name === "Clear Sky Rate" || factor.name === "晴空率";
  
  // Special formatting for cloud cover factor with nighttime data
  const showNighttimeDetails = factor.nighttimeData && 
    (factor.name === "Cloud Cover" || factor.name === "云层覆盖");
  
  // Delayed animation for staggered entrance
  const animationDelay = index * 0.1;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay }}
      className="bg-cosmic-800/20 rounded-lg p-4 border border-cosmic-700/30 hover:border-cosmic-600/50 transition-all"
    >
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{factor.name}</span>
            {isClearSkyRate && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                {t("Historical", "历史数据")}
              </Badge>
            )}
          </div>
          <Badge 
            className={cn(
              "px-2.5 py-0.5", 
              factor.score >= 7.5 ? "bg-green-500/20 text-green-400 border-green-500/30" : 
              factor.score >= 5 ? "bg-lime-500/20 text-lime-400 border-lime-500/30" :
              factor.score >= 2.5 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
              "bg-red-500/20 text-red-400 border-red-500/30"
            )}
          >
            {factor.score.toFixed(1)}
          </Badge>
        </div>
        
        <Progress 
          value={scorePercent} 
          className="h-2 bg-cosmic-700/30"
          indicatorClassName={progressColor}
        />
        
        <div className="text-sm text-muted-foreground mt-1.5">
          {factor.description}
        </div>
        
        {showNighttimeDetails && factor.nighttimeData && (
          <div className="mt-1 text-xs border-t border-cosmic-700/20 pt-2">
            <div className="flex justify-between items-center mb-1">
              <span>{t("Nighttime Cloud Cover", "夜间云量")}: <span className={getDetailColor(factor.nighttimeData.average)}>
                {Math.round(factor.nighttimeData.average)}%
              </span> ({factor.nighttimeData.timeRange})</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("Evening", "傍晚")}: <span className={getDetailColor(factor.nighttimeData.detail?.evening || 0)}>
                {Math.round(factor.nighttimeData.detail?.evening || 0)}%
              </span></span>
              <span>{t("Morning", "早晨")}: <span className={getDetailColor(factor.nighttimeData.detail?.morning || 0)}>
                {Math.round(factor.nighttimeData.detail?.morning || 0)}%
              </span></span>
            </div>
          </div>
        )}
        
        {isClearSkyRate && (
          <div className="mt-1 text-xs border-t border-cosmic-700/20 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("Annual average of clear nights", "全年晴朗夜晚平均值")}</span>
              <span className="text-blue-400 font-medium">
                {factor.description.replace(/[^0-9.]/g, '')}%
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(FactorItem);
