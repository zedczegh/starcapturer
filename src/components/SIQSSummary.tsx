import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Info, Star, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "@/components/siqs/utils/progressColor";
import { motion } from "framer-motion";
import { formatSIQSScore, getSIQSLevel } from "@/lib/siqs/utils";
import { validateSIQSData } from "@/utils/validation/dataValidation";
import { useToast } from "@/components/ui/use-toast";
import { normalizeToSiqsScale } from '@/utils/siqsHelpers';

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
    // Normalize to ensure the score is on the 1-10 scale
    return normalizeToSiqsScale(Math.round(validatedSiqs.score * 10) / 10);
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
  
  // Calculate timestamp from when SIQS was calculated
  const siqsCalculationTime = useMemo(() => {
    if (locationData && locationData.timestamp) {
      try {
        const timestamp = new Date(locationData.timestamp);
        if (!isNaN(timestamp.getTime())) {
          return timestamp.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
            hour: '2-digit', 
            minute: '2-digit',
            hour12: language !== 'zh'
          });
        }
      } catch (e) {
        console.error("Error formatting timestamp", e);
      }
    }
    return null;
  }, [locationData, language]);
  
  useEffect(() => {
    const isValid = validateSIQSData(siqsResult);
    
    if (isValid) {
      // Normalize score if needed
      if (siqsResult && typeof siqsResult.score === 'number' && siqsResult.score > 10) {
        const normalizedSiqs = {
          ...siqsResult,
          score: normalizeToSiqsScale(siqsResult.score)
        };
        setValidatedSiqs(normalizedSiqs);
      } else {
        setValidatedSiqs(siqsResult);
      }
    } else if (siqsResult && typeof siqsResult.score === 'number') {
      console.warn("SIQS data structure is invalid, creating basic object");
      const normalizedScore = normalizeToSiqsScale(siqsResult.score);
      setValidatedSiqs({
        score: normalizedScore,
        isViable: normalizedScore >= 2,
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
    <Card className="glassmorphism-strong overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          {t("Sky Imaging Quality Score", "天文观测质量评分")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
        <div className="space-y-3">
          {/* Main SIQS Score */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{t("Overall Score", "总分")}</h3>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-yellow-400" fill="#facc15" />
              <span className={`text-2xl font-bold px-2 py-1 rounded ${scoreColorClass.replace('bg-', 'text-')}`}>
                {formatSIQSScore(siqsScore)}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
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
          
          {/* Scale and interpretation */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("Poor", "较差")}</span>
            <span className={`font-medium ${scoreColorClass.replace('bg-', 'text-')}`}>
              {qualityText}
            </span>
            <span className="text-muted-foreground">{t("Excellent", "优秀")}</span>
          </div>
          
          {/* Description */}
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              {getSIQSDescription(siqsScore, t)}
            </p>
          </div>
        </div>
        
        {/* Clear Sky Rate (if available) */}
        {weatherData?.clearSkyRate && (
          <div className="pt-4 border-t border-border/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-400" />
                {t("Clear Sky Rate", "晴空率")}
              </h4>
              <span className="font-semibold text-blue-400">{weatherData.clearSkyRate}%</span>
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
        )}

        {/* Disclaimer and timestamp */}
        <div className="mt-6 space-y-2">
          {siqsCalculationTime && (
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {t("Calculated at", "计算于")}: {siqsCalculationTime}
            </div>
          )}
          
          <div className="p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
            <p className="text-xs text-center text-cosmic-300">
              {t("This SIQS score is calculated based on all conditions displayed above including nighttime forecasts.", 
                 "此SIQS评分是根据上方显示的所有条件（包括夜间预报）计算得出的。")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function for SIQS descriptions
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
