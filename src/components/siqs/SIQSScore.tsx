
import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { getProgressColor, getProgressColorClass, getProgressTextColorClass } from "./utils/progressColor";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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
    // Round value to 1 decimal place
    const displayValue = Math.round(siqsScore * 10) / 10;
    
    // Determine value interpretation
    let interpretation;
    if (displayValue >= 8) interpretation = t("Excellent", "优秀");
    else if (displayValue >= 6) interpretation = t("Good", "良好");
    else if (displayValue >= 4) interpretation = t("Average", "一般");
    else if (displayValue >= 2) interpretation = t("Poor", "较差");
    else interpretation = t("Bad", "很差");
    
    // Get appropriate color classes
    const progressColor = getProgressColor(displayValue);
    const colorClass = getProgressColorClass(displayValue);
    const textColorClass = getProgressTextColorClass(displayValue);
    
    return {
      displayValue,
      interpretation,
      progressColor,
      colorClass,
      textColorClass
    };
  }, [siqsScore, t]);
  
  // Custom style for progress bar
  const progressStyle = useMemo(() => ({
    backgroundColor: memoizedValues.progressColor,
  } as React.CSSProperties), [memoizedValues.progressColor]);
  
  // Create a URL-friendly location ID
  const locationId = useMemo(() => {
    return `temp-${Date.now().toString()}`;
  }, []);
  
  return (
    <motion.div 
      className="mb-4 pb-4 border-b border-cosmic-700/30"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">
          {t("Estimated SIQS", "预估SIQS")}
        </h3>
        <span className={`text-xl font-bold px-2 py-1 rounded ${memoizedValues.textColorClass}`}>
          {memoizedValues.displayValue.toFixed(1)}
        </span>
      </div>
      
      <Progress
        value={siqsScore * 10}
        className="h-3 my-2 bg-cosmic-800/40"
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
      
      <div className="mt-6 flex justify-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="relative"
        >
          <Link 
            to={`/location/${locationId}`}
            state={{
              id: locationId,
              name: locationName,
              latitude: latitude,
              longitude: longitude,
              siqsResult: {
                score: memoizedValues.displayValue
              },
              timestamp: new Date().toISOString(),
              fromCalculator: true // Add a flag to indicate source
            }}
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary/90 to-primary/70 hover:bg-primary hover:from-primary hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 text-primary-foreground group"
            >
              {t("See More Details", "查看更多详情")}
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SIQSScore;
