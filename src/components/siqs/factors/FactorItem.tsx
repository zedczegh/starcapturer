
import React from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";

interface FactorItemProps {
  factor: {
    name: string;
    score: number;
    description: string;
  };
  index: number;
}

const FactorItem: React.FC<FactorItemProps> = ({ factor, index }) => {
  // Always ensure the display score is on 0-10 scale for consistent display
  const normalizedScore = factor.score > 10 ? factor.score / 10 : factor.score;
  
  // Ensure cloud cover score is accurate when cloud cover is 0%
  const finalScore = factor.name === "Cloud Cover" && normalizedScore > 9.9 ? 10 : normalizedScore;
  
  // Scale from 0-10 to 0-100 for the progress bar
  const progressValue = finalScore * 10;
  
  // Get the appropriate color class based on the normalized score
  const colorClass = getProgressColorClass(finalScore);
  
  // Format the description to ensure cloud cover percentage shows only 1 decimal place
  let formattedDescription = factor.description;
  
  if (factor.name === "Cloud Cover" || factor.name === "云层覆盖") {
    // Match cloud cover percentage pattern (number followed by %)
    const percentageRegex = /(\d+\.\d+)%/g;
    formattedDescription = factor.description.replace(percentageRegex, (match, percentage) => {
      const roundedPercentage = parseFloat(percentage).toFixed(1);
      return `${roundedPercentage}%`;
    });
  }
  
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
      <p className="text-xs text-muted-foreground">{formattedDescription}</p>
    </motion.div>
  );
};

export default FactorItem;
