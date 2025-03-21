
import React, { useMemo } from "react";
import { Progress } from "../ui/progress";
import { getProgressColor, getProgressColorClass, getProgressTextColorClass } from "./utils/progressColor";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface SIQSScoreProps {
  siqsScore: number;
  locationName: string;
  latitude: number;
  longitude: number;
}

const SIQSScore: React.FC<SIQSScoreProps> = ({ 
  siqsScore, 
  locationName,
  latitude,
  longitude
}) => {
  const { t } = useLanguage();
  
  // Create memoized values to prevent unnecessary re-renders
  const memoizedValues = useMemo(() => {
    // Round score to 1 decimal place
    const displayScore = Math.round(siqsScore * 10) / 10;
    
    // Determine score interpretation
    let interpretation;
    if (displayScore >= 8) interpretation = t("Excellent", "优秀");
    else if (displayScore >= 6) interpretation = t("Good", "良好");
    else if (displayScore >= 4) interpretation = t("Average", "一般");
    else if (displayScore >= 2) interpretation = t("Poor", "较差");
    else interpretation = t("Bad", "很差");
    
    // Get appropriate color classes
    const progressColor = getProgressColor(displayScore);
    const colorClass = getProgressColorClass(displayScore);
    const textColorClass = getProgressTextColorClass(displayScore);
    
    return {
      displayScore,
      interpretation,
      progressColor,
      colorClass,
      textColorClass
    };
  }, [siqsScore, t]);
  
  // Custom style for progress bar
  const progressStyle = useMemo(() => ({
    '--progress-background': memoizedValues.progressColor,
  } as React.CSSProperties), [memoizedValues.progressColor]);
  
  return (
    <motion.div 
      className="mb-6 pb-6 border-b border-cosmic-700/30"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">
          {t("Estimated SIQS", "预估SIQS")}
        </h3>
        <span className={`text-xl font-bold px-2 py-1 rounded ${memoizedValues.textColorClass}`}>
          {memoizedValues.displayScore.toFixed(1)}
        </span>
      </div>
      
      <Progress
        value={siqsScore * 10}
        className="h-3 my-2 bg-cosmic-800/50"
        style={progressStyle}
      />
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-muted-foreground">
          {t("Poor", "较差")}
        </span>
        <span className={`text-sm font-medium ${memoizedValues.textColorClass}`}>
          {memoizedValues.interpretation}
        </span>
        <span className="text-sm text-muted-foreground">
          {t("Excellent", "优秀")}
        </span>
      </div>
    </motion.div>
  );
};

export default SIQSScore;
