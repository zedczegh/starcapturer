
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
  // Normalize score to ensure it's on a 0-10 scale
  const displayScore = factor.score > 10 ? factor.score / 10 : factor.score;
  const progressValue = factor.score > 10 ? factor.score : factor.score * 10;
  const colorClass = getProgressColorClass(displayScore);
  
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
          {displayScore.toFixed(1)}
        </span>
      </div>
      <Progress 
        value={progressValue} 
        className="h-2"
        colorClass={colorClass}
      />
      <p className="text-xs text-muted-foreground">{factor.description}</p>
    </motion.div>
  );
};

export default FactorItem;
