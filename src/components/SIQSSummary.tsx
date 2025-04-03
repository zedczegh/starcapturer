
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { motion } from "framer-motion";
import SIQSFactorsList from "@/components/siqs/SIQSFactorsList";
import { formatSIQSScore, getSIQSLevel } from "@/lib/siqs/utils";
import { getTranslatedDescription } from "@/components/siqs/utils/translations/descriptionTranslator";

interface SIQSSummaryProps {
  siqsResult: any;
  weatherData: any;
  locationData: any;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqsResult, weatherData, locationData }) => {
  const { t, language } = useLanguage();
  
  // If no SIQS data available, show placeholder
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
  const siqsScore = useMemo(() => {
    return typeof siqsResult.score === 'number' ? 
      Math.round(siqsResult.score * 10) / 10 : 0;
  }, [siqsResult.score]);
    
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
  
  // Translate factor descriptions if needed
  const translatedFactors = useMemo(() => {
    if (!siqsResult.factors || !Array.isArray(siqsResult.factors)) return [];
    
    // First check if we need to add a Clear Sky Rate factor if it's missing
    const factors = [...siqsResult.factors];
    const hasClearSkyFactor = factors.some(factor => 
      factor.name === 'Clear Sky Rate' || factor.name === '晴空率');
    
    // Add Clear Sky Rate factor if it's available in weatherData but not in factors
    if (!hasClearSkyFactor && weatherData?.clearSkyRate) {
      const clearSkyRate = weatherData.clearSkyRate;
      const clearSkyScore = Math.min(10, clearSkyRate / 10);
      
      factors.push({
        name: 'Clear Sky Rate',
        score: clearSkyScore,
        description: `Annual clear sky rate (${clearSkyRate}%), favorable for astrophotography`,
      });
    }
    
    return factors.map(factor => ({
      ...factor,
      description: language === 'zh' ? 
        getTranslatedDescription(factor.description, 'zh') : 
        factor.description,
      // Also translate factor names
      name: language === 'zh' ? 
        (factor.name === 'Cloud Cover' ? '云层覆盖' :
         factor.name === 'Light Pollution' ? '光污染' :
         factor.name === 'Moon Phase' ? '月相' :
         factor.name === 'Humidity' ? '湿度' :
         factor.name === 'Wind Speed' ? '风速' :
         factor.name === 'Seeing Conditions' ? '视宁度' :
         factor.name === 'Air Quality' ? '空气质量' :
         factor.name === 'Clear Sky Rate' ? '晴空率' :
         factor.name) : 
        factor.name
    }));
  }, [siqsResult.factors, weatherData, language]);
  
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
        {translatedFactors.length > 0 && (
          <div className="mt-4 space-y-4">
            <h4 className="text-sm font-medium">{t("Factors Affecting SIQS", "影响SIQS的因素")}</h4>
            <SIQSFactorsList factors={translatedFactors} />
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
