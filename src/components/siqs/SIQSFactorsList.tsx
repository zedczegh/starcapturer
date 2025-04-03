
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface SIQSFactor {
  name: string;
  score: number;
  description: string;
  nighttimeData?: {
    average: number;
    timeRange: string;
  };
}

interface SIQSFactorsListProps {
  factors: SIQSFactor[];
}

const formatScoreValue = (score: number): string => {
  return typeof score === 'number' ? score.toFixed(1) : '0.0';
};

const getScoreColor = (score: number): string => {
  if (score >= 8) return "text-green-500";
  if (score >= 6) return "text-blue-500";
  if (score >= 4) return "text-yellow-500";
  if (score >= 2) return "text-orange-500";
  return "text-red-500";
};

const SIQSFactorsList: React.FC<SIQSFactorsListProps> = ({ factors }) => {
  const { t } = useLanguage();

  if (!factors || factors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        {t("No factor data available", "无因素数据可用")}
      </div>
    );
  }

  // First find if there's a Cloud Cover factor
  const cloudCoverFactor = factors.find(f => 
    f.name === "Cloud Cover" || f.name === "云层覆盖"
  );
  
  // Remove cloud cover from the factors array (if exists)
  const otherFactors = factors.filter(f => 
    f.name !== "Cloud Cover" && f.name !== "云层覆盖"
  );
  
  // Sort other factors by score (highest first)
  const sortedOtherFactors = [...otherFactors].sort((a, b) => b.score - a.score);
  
  // Final array with Cloud Cover first, then other factors sorted by score
  const finalFactors = cloudCoverFactor 
    ? [cloudCoverFactor, ...sortedOtherFactors]
    : sortedOtherFactors;

  return (
    <div className="space-y-3">
      {finalFactors.map((factor, index) => (
        <motion.div
          key={factor.name}
          className="border border-cosmic-700/20 rounded-lg p-3 bg-cosmic-900/30 hover:bg-cosmic-800/20 transition-all duration-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">{factor.name}</span>
            <span className={`font-bold ${getScoreColor(factor.score)}`}>
              {formatScoreValue(factor.score)}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            {factor.description}
          </p>
          
          {/* Show nighttime data for cloud cover if available */}
          {factor.nighttimeData && (
            <div className="text-xs mt-2 text-blue-400/80 italic">
              {t("Nighttime Avg", "夜间平均")}: {factor.nighttimeData.average}% ({factor.nighttimeData.timeRange})
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default SIQSFactorsList;
