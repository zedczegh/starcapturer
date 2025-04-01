
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { motion } from "framer-motion";
import SIQSFactorsList from "@/components/siqs/SIQSFactorsList";

interface SIQSSummaryProps {
  siqsResult: any;
  weatherData: any;
  locationData: any;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqsResult, weatherData, locationData }) => {
  const { t } = useLanguage();
  
  if (!siqsResult) {
    return (
      <Card className="glassmorphism-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t("No SIQS Data Available", "无SIQS数据")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {t("Please wait while we calculate SIQS score for this location.", "请等待我们计算此位置的SIQS评分。")}
        </CardContent>
      </Card>
    );
  }
  
  // Format the SIQS score for display
  const siqsScore = typeof siqsResult.score === 'number' ? 
    Math.round(siqsResult.score * 10) / 10 : 0;
    
  // Get color class based on score
  const scoreColorClass = getProgressColorClass(siqsScore);
  
  // Determine quality level text
  const getQualityText = (score: number) => {
    if (score >= 8) return t("Excellent", "优秀");
    if (score >= 6) return t("Good", "良好");
    if (score >= 4) return t("Average", "一般");
    if (score >= 2) return t("Poor", "较差");
    return t("Bad", "很差");
  };
  
  const qualityText = getQualityText(siqsScore);
  
  return (
    <Card className="glassmorphism-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          {t("SIQS Summary", "SIQS 摘要")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SIQS Score with Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{t("Overall Score", "总分")}</h3>
            <span className={`text-xl font-bold px-2 py-1 rounded ${scoreColorClass.replace('bg-', 'text-')}`}>
              {siqsScore.toFixed(1)}
            </span>
          </div>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <Progress 
              value={siqsScore * 10} 
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
            {getSIQSDescription(siqsScore, t)}
          </p>
        </div>
        
        {/* Contributing Factors */}
        {siqsResult.factors && siqsResult.factors.length > 0 && (
          <div className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">{t("Factors Affecting SIQS", "影响SIQS的因素")}</h4>
            <SIQSFactorsList factors={siqsResult.factors} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function for SIQS description
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

export default SIQSSummary;
