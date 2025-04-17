
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { motion } from "framer-motion";
import { formatSIQSScore, getSIQSLevel } from "@/lib/siqs/utils";
import { validateSIQSData } from "@/utils/validation/dataValidation";
import { useToast } from "@/components/ui/use-toast";

interface SIQSSummaryProps {
  siqsResult: any;
  weatherData: any;
  locationData: any;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqsResult, weatherData, locationData }) => {
  const { t, language } = useLanguage();
  const [validatedSiqs, setValidatedSiqs] = useState(siqsResult);
  const { toast } = useToast();
  
  // Always define these values regardless of validatedSiqs state
  const siqsScore = useMemo(() => {
    if (!validatedSiqs || typeof validatedSiqs.score !== 'number') {
      return 0;
    }
    return Math.round(validatedSiqs.score * 10) / 10;
  }, [validatedSiqs]);
    
  const scoreColorClass = getProgressColorClass(siqsScore);
  
  const qualityText = useMemo(() => {
    return t(getSIQSLevel(siqsScore), 
      getSIQSLevel(siqsScore) === 'Excellent' ? "优秀" : 
      getSIQSLevel(siqsScore) === 'Good' ? "良好" : 
      getSIQSLevel(siqsScore) === 'Average' ? "一般" : 
      getSIQSLevel(siqsScore) === 'Poor' ? "较差" : "很差"
    );
  }, [siqsScore, t]);
  
  useEffect(() => {
    const isValid = validateSIQSData(siqsResult);
    
    if (isValid) {
      setValidatedSiqs(siqsResult);
    } else if (siqsResult && typeof siqsResult.score === 'number') {
      console.warn("SIQS data structure is invalid, creating basic object");
      setValidatedSiqs({
        score: siqsResult.score,
        isViable: siqsResult.score >= 2,
        factors: siqsResult.factors || []
      });
    } else {
      console.error("Invalid SIQS data provided:", siqsResult);
      setValidatedSiqs(null);
      
      toast({
        title: t("SIQS Data Issue", "SIQS数据问题"),
        description: t(
          "There was an issue with the SIQS data. Some information may not be accurate.",
          "SIQS数据出现问题，部分信息可能不准确。"
        ),
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [siqsResult, t, toast]);
  
  if (!validatedSiqs) {
    return (
      <Card className="glassmorphism-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t("No SIQS Data Available", "无天文观测质量评分数据")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {t("Please wait while we calculate SIQS score for this location.", "请等待我们计算此位置的天文观测质量评分。")}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="glassmorphism-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          {t("SIQS Summary", "天文观测质量评分摘要")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
        
        {weatherData?.clearSkyRate && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-sm font-medium mb-3">{t("Clear Sky Rate", "晴空率")}</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t("Annual Rate", "年平均率")}</span>
                <span className="font-medium">{weatherData.clearSkyRate}%</span>
              </div>
              <Progress 
                value={weatherData.clearSkyRate} 
                className="h-2"
                colorClass="bg-blue-500/80"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'en' 
                  ? `Historical clear sky average for this location`
                  : `此位置的历史晴空平均值`}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30 mt-4">
          <p className="text-sm text-center">
            {t("This SIQS score is calculated based on the current conditions displayed above.", 
               "此SIQS评分是根据上方显示的当前条件计算得出的。")}
          </p>
        </div>
      </CardContent>
    </Card>
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

export default SIQSSummary;
