
import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { getProgressColor, getProgressColorClass, getProgressTextColorClass } from "./utils/progressColor";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatSiqsScore, isValidSiqsScore } from "@/utils/siqs/displayUtils";

interface SIQSScoreProps {
  siqsScore: number | null;
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
    // Debug output to trace SIQS values
    console.log(`SIQSScore: Rendering with SIQS value: ${siqsScore}`);
    
    // Check if we have a valid score
    if (!isValidSiqsScore(siqsScore)) {
      console.log("SIQSScore: Invalid or null SIQS value");
      return {
        displayValue: null,
        interpretation: t("Not Available", "不可用"),
        progressColor: "#6b7280", // Gray color for unknown
        colorClass: "bg-gray-500/70",
        textColorClass: "text-gray-400"
      };
    }

    // Ensure we have a valid score and it's on a 0-10 scale
    const displayValue = Math.min(10, Math.max(0, siqsScore!));
    console.log(`SIQSScore: Using display value: ${displayValue}`);

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

  // Create a stable locationId for navigation
  const locationId = useMemo(() => {
    // Use a more deterministic ID format
    return `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
  }, [latitude, longitude]);

  // If no SIQS score is available, show a placeholder
  if (memoizedValues.displayValue === null) {
    console.log("SIQSScore: Showing placeholder for null SIQS");
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
          <span className="text-xl font-bold px-2 py-1 rounded text-gray-400">
            {t("N/A", "暂无")}
          </span>
        </div>
        
        <Progress value={0} className="h-3 my-2 bg-cosmic-800/40" />
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-muted-foreground">
            {t("Poor", "较差")}
          </span>
          <span className="text-sm font-medium text-gray-400">
            {t("Calculating...", "计算中...")}
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
            className="relative w-full max-w-md"
          >
            <Link 
              to={`/location/${locationId}`} 
              state={{
                id: locationId,
                name: locationName,
                latitude: latitude,
                longitude: longitude,
                timestamp: new Date().toISOString(),
                fromCalculator: true
              }}
            >
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-blue-500/70 to-green-500/70 hover:from-blue-500/80 hover:to-green-500/80 shadow-lg hover:shadow-xl transition-all duration-300 group text-gray-50 py-2 text-sm font-medium"
              >
                {t("Calculate SIQS Details", "计算SIQS详情")}
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Custom style for progress bar
  const progressStyle = useMemo(() => ({
    backgroundColor: memoizedValues.progressColor
  }) as React.CSSProperties, [memoizedValues.progressColor]);

  console.log(`SIQSScore: Rendering with score ${formatSiqsScore(memoizedValues.displayValue)}`);

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
          {formatSiqsScore(memoizedValues.displayValue)}
        </span>
      </div>
      
      <Progress value={memoizedValues.displayValue * 10} className="h-3 my-2 bg-cosmic-800/40" style={progressStyle} />
      
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
          className="relative w-full max-w-md"
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
              className="w-full bg-gradient-to-r from-blue-500/70 to-green-500/70 hover:from-blue-500/80 hover:to-green-500/80 shadow-lg hover:shadow-xl transition-all duration-300 group text-gray-50 py-2 text-sm font-medium"
            >
              {t("See More Details", "查看更多详情")}
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SIQSScore;
