
import React, { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatSIQSScore, getSIQSLevel } from "@/lib/siqs/utils";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface SIQSScoreSummaryProps {
  score: number;
  language: string;
  t: (en: string, zh: string) => string;
}

const SIQSScoreSummary: React.FC<SIQSScoreSummaryProps> = ({ score, language, t }) => {
  const scoreColorClass = getProgressColorClass(score);
  
  const qualityText = useMemo(() => {
    return t(getSIQSLevel(score), 
      getSIQSLevel(score) === 'Excellent' ? "优秀" : 
      getSIQSLevel(score) === 'Good' ? "良好" : 
      getSIQSLevel(score) === 'Average' ? "一般" : 
      getSIQSLevel(score) === 'Poor' ? "较差" : "很差"
    );
  }, [score, t]);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("Overall Score", "总分")}</h3>
        <span className={`text-xl font-bold px-2 py-1 rounded ${scoreColorClass.replace('bg-', 'text-')}`}>
          {formatSIQSScore(score)}
        </span>
      </div>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.5 }}
      >
        <Progress 
          value={score * 10} 
          className="h-3"
          colorClass={scoreColorClass}
        />
      </motion.div>
      
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("Poor", "较差")}</span>
        <span className={`font-medium ${scoreColorClass.replace('bg-', 'text-')}`}>
          {qualityText}
        </span>
        <span className="text-muted-foreground">{t("Excellent", "优秀")}</span>
      </div>
      
      <p className="text-sm text-muted-foreground mt-2">
        {getSIQSDescription(score, t)}
      </p>
    </div>
  );
};

const getSIQSDescription = (score: number, t: any) => {
  if (score >= 9) {
    return t("Exceptional conditions for astrophotography.", "天文摄影的绝佳条件。");
  } else if (score >= 7) {
    return t("Excellent conditions, highly recommended.", "极好的条件，强烈推荐。");
  } else if (score >= 5) {
    return t("Good conditions, suitable for imaging.", "良好的条件，适合成像。");
  } else if (score >= 3) {
    return t("Moderate conditions, some limitations may apply.", "中等条件，可能有一些限制。");
  } else {
    return t("Poor conditions, not recommended for imaging.", "条件较差，不推荐成像。");
  }
};

export default SIQSScoreSummary;
