
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, AlertCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { getScoreDescription, getScoreColor } from "@/utils/siqsUtils";

interface SIQSSummaryProps {
  locationData: any;
  isLoading?: boolean;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ locationData, isLoading }) => {
  const { t, language } = useLanguage();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check if we have SIQS data
  if (!locationData?.siqsResult || !locationData.siqsResult.score) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          {t("No SIQS data available", "没有可用的SIQS数据")}
        </p>
      </div>
    );
  }

  const { score, factors } = locationData.siqsResult;
  const scoreAsNumber = typeof score === 'string' ? parseFloat(score) : score;
  const normalizedScore = Math.max(0, Math.min(10, scoreAsNumber));
  const scoreText = score.toFixed(1);
  const scoreDescription = getScoreDescription(score, language);
  const scoreColor = getScoreColor(score);

  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <div className="flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ${scoreColor} bg-opacity-20 border-4 shadow-lg`}
        >
          {scoreText}
        </motion.div>
        <p className="mt-2 font-medium text-center">{scoreDescription}</p>
      </div>

      {/* Factors */}
      {factors && factors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-1">
            {t("Contributing Factors", "影响因素")}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  {t(
                    "Factors that contribute to the SIQS score",
                    "影响SIQS分数的因素"
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>

          <div className="space-y-3">
            {factors.map((factor: any, index: number) => {
              // Calculate normalized score (0-100%)
              const factorNormalizedScore = Math.max(0, Math.min(10, factor.score)) / 10;
              const factorScorePercent = Math.round(factorNormalizedScore * 100);
              
              // Get color based on the factor score
              const factorColor = getScoreColor(factor.score * 10);

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{factor.name}</span>
                    <span className="font-medium">{Math.round(factor.score * 10)}/10</span>
                  </div>
                  <div className="h-2 w-full bg-cosmic-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${factorColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${factorScorePercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SIQSSummary;
