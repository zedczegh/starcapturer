
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Info, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { motion } from "framer-motion";
import SIQSFactorsList from "@/components/siqs/SIQSFactorsList";
import { formatSIQSScore, getSIQSLevel } from "@/lib/siqs/utils";
import { Button } from "./ui/button";

interface SIQSSummaryProps {
  siqsResult: any;
  weatherData: any;
  locationData: any;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqsResult, weatherData, locationData }) => {
  const { t } = useLanguage();
  const [localSiqsResult, setLocalSiqsResult] = useState(siqsResult);
  const [refreshing, setRefreshing] = useState(false);
  
  // Update local state when siqsResult changes
  useEffect(() => {
    setLocalSiqsResult(siqsResult);
  }, [siqsResult]);
  
  // If no SIQS data available, show a different UI with refresh option
  if (!localSiqsResult) {
    return (
      <Card className="glassmorphism-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t("No SIQS Data Available", "无SIQS数据")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("We need to calculate the SIQS score for this location.", "我们需要计算此位置的SIQS评分。")}
          </p>
          
          <Button 
            variant="secondary" 
            size="sm" 
            disabled={refreshing}
            onClick={() => {
              // Dispatch custom event to trigger a refresh
              const refreshEvent = new CustomEvent('forceRefresh');
              document.dispatchEvent(refreshEvent);
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 3000);
            }}
            className="w-full"
          >
            {refreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t("Calculating...", "计算中...")}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("Calculate SIQS", "计算SIQS")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Format the SIQS score for display
  const siqsScore = useMemo(() => {
    return typeof localSiqsResult.score === 'number' ? 
      Math.round(localSiqsResult.score * 10) / 10 : 0;
  }, [localSiqsResult.score]);
    
  // Get color class based on score
  const scoreColorClass = getProgressColorClass(siqsScore);
  
  // Get quality level text
  const qualityText = useMemo(() => {
    return t(getSIQSLevel(siqsScore), 
      getSIQSLevel(siqsScore) === 'Excellent' ? "优秀" : 
      getSIQSLevel(siqsScore) === 'Good' ? "良好" : 
      getSIQSLevel(siqsScore) === 'Average' ? "一般" : 
      getSIQSLevel(siqsScore) === 'Poor' ? "较差" : "很差"
    );
  }, [siqsScore, t]);
  
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
              {formatSIQSScore(siqsScore)}
            </span>
          </div>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
            key={`siqs-progress-${siqsScore}`}
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
        {localSiqsResult.factors && localSiqsResult.factors.length > 0 && (
          <div className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">{t("Factors Affecting SIQS", "影响SIQS的因素")}</h4>
            <SIQSFactorsList factors={localSiqsResult.factors} />
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
