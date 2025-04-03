
import React from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslatedDescription } from "@/components/siqs/utils/translations/descriptionTranslator";
import { InfoCircle } from "lucide-react";

interface FactorItemProps {
  factor: {
    name: string;
    score: number;
    description: string;
    nighttimeData?: {
      average: number;
      timeRange: string;
    };
  };
  index: number;
}

const FactorItem: React.FC<FactorItemProps> = ({ factor, index }) => {
  const { language, t } = useLanguage();
  
  // Always ensure the display score is on 0-10 scale for consistent display
  const normalizedScore = factor.score > 10 ? factor.score / 10 : factor.score;
  
  // Special handling for cloud cover factor
  const isCloudCoverFactor = 
    factor.name === "Cloud Cover" || 
    factor.name === "云层覆盖";
  
  // Get cloud cover percentage for special handling
  const cloudCoverPercentage = isCloudCoverFactor ? 
    parseFloat(factor.description.match(/(\d+\.?\d*)%/)?.[1] || "0") : 0;
  
  // For cloud cover, ensure score reflects the actual cloud cover
  // If cloud cover is high (>70%), ensure score is appropriately low
  let finalScore = normalizedScore;
  if (isCloudCoverFactor && cloudCoverPercentage > 70) {
    finalScore = Math.min(finalScore, 3); // Cap at 3 for high cloud cover
  } else if (isCloudCoverFactor && cloudCoverPercentage > 50) {
    finalScore = Math.min(finalScore, 5); // Cap at 5 for moderate cloud cover
  }
  
  // Scale from 0-10 to 0-100 for the progress bar
  const progressValue = finalScore * 10;
  
  // Get the appropriate color class based on the normalized score
  const colorClass = getProgressColorClass(finalScore);
  
  // Format description to ensure cloud cover percentage has only one decimal place
  let formattedDescription = factor.description;
  if (isCloudCoverFactor && factor.description.includes("%")) {
    // Match a pattern like "32.282051282051285%" and replace with one decimal place
    formattedDescription = factor.description.replace(
      /(\d+\.\d+)%/g, 
      (match, number) => `${parseFloat(number).toFixed(1)}%`
    );
  }
  
  // Translate the description if needed
  const translatedDescription = getTranslatedDescription(formattedDescription, language);
  
  // Special nighttime cloud cover note for cloud cover factor
  const showNighttimeNote = isCloudCoverFactor && factor.nighttimeData;
  
  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{factor.name}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass.replace('bg-', 'text-')} bg-cosmic-800/50`}>
          {finalScore.toFixed(1)}
        </span>
      </div>
      <Progress 
        value={progressValue} 
        className="h-2"
        colorClass={colorClass}
      />
      <p className="text-xs text-muted-foreground">{translatedDescription}</p>
      
      {showNighttimeNote && factor.nighttimeData && (
        <div className="mt-1 flex items-start gap-1">
          <InfoCircle className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-400">
            {language === 'en' 
              ? `Night average (${factor.nighttimeData.timeRange}): ${factor.nighttimeData.average.toFixed(1)}%`
              : `夜间平均值（${factor.nighttimeData.timeRange}）：${factor.nighttimeData.average.toFixed(1)}%`
            }
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default FactorItem;
