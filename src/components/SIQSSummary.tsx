
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Info, Star, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Progress } from "@/components/ui/progress";
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
  
  // Get the precise color class based on SIQS score as per the color scale guide
  const getScoreColorClass = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-blue-500";
    if (score >= 5) return "bg-olive-500";
    if (score >= 4) return "bg-yellow-500";
    if (score >= 2) return "bg-orange-500";
    return "bg-red-500";
  };
  
  // Get text color class for the score display
  const getScoreTextColorClass = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-blue-500";
    if (score >= 5) return "text-olive-500";
    if (score >= 4) return "text-yellow-500";
    if (score >= 2) return "text-orange-500";
    return "text-red-500";
  };
    
  const scoreColorClass = getScoreColorClass(siqsScore);
  const scoreTextColorClass = getScoreTextColorClass(siqsScore);
  
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
    } else if (siqsResult && typeof siqsResult === 'object') {
      // Handle partial or malformed SIQS data
      console.log("Warning: Invalid SIQS data detected, attempting to recover");
      if ('score' in siqsResult && typeof siqsResult.score === 'number') {
        // We have at least a score, use it
        setValidatedSiqs({
          score: normalizeToSiqsScale(siqsResult.score),
          isViable: siqsResult.score >= 5,
          factors: []
        });
      } else {
        // No usable data
        setValidatedSiqs(null);
        console.error("Could not validate or recover SIQS data:", siqsResult);
      }
    } else {
      setValidatedSiqs(null);
      console.error("Invalid SIQS data:", siqsResult);
    }
  }, [siqsResult]);

  // Check if we have actual SIQS data to display
  const hasSiqsData = siqsScore > 0;

  return (
    <Card className="bg-cosmic-800/70 border border-cosmic-700/50 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-yellow-400" />
          <span>{t("Sky Imaging Quality Score", "天空成像质量评分")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasSiqsData ? (
          <div className="flex flex-col items-center justify-center p-6 text-center opacity-80">
            <Info className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("SIQS data is currently loading or not available for this location.", 
                "此位置的SIQS数据正在加载或不可用。")}
            </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <Gauge className="h-5 w-5 mr-2 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {t("Current Score", "当前评分")}
                </span>
              </div>
              <motion.div 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`text-2xl font-bold px-2 rounded ${scoreTextColorClass}`}
              >
                {siqsScore.toFixed(1)}
              </motion.div>
            </div>
            
            <Progress 
              value={siqsScore * 10} 
              max={100} 
              className="h-2.5 mb-2" 
              colorClass={scoreColorClass}
            />
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{t("Poor", "较差")}</span>
              <span className={`font-semibold ${scoreTextColorClass}`}>{qualityText}</span>
              <span className="text-muted-foreground">{t("Excellent", "优秀")}</span>
            </div>
            
            {/* SIQS Color Scale Guide - Small visual reference */}
            <div className="mt-3 pt-3 border-t border-cosmic-700/30">
              <div className="flex space-x-1 h-1.5">
                <div className="bg-red-500 flex-1 rounded-l-full" title="0-1.9: Bad"></div>
                <div className="bg-orange-500 flex-1" title="2-3.9: Poor"></div>
                <div className="bg-yellow-500 flex-1" title="4-4.9: Average"></div>
                <div className="bg-olive-500 flex-1" title="5-5.9: Above Average"></div>
                <div className="bg-blue-500 flex-1" title="6-7.9: Good"></div>
                <div className="bg-green-500 flex-1 rounded-r-full" title="8-10: Excellent"></div>
              </div>
            </div>
            
            {siqsCalculationTime && (
              <div className="flex justify-end items-center mt-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>{t("Calculated at", "计算于")} {siqsCalculationTime}</span>
              </div>
            )}
            
            {validatedSiqs?.factors && validatedSiqs.factors.length > 0 && (
              <div className="mt-4 pt-3 border-t border-cosmic-700/50">
                <details className="text-sm">
                  <summary className="cursor-pointer hover:text-primary transition-colors">
                    {t("View contributing factors", "查看影响因素")}
                  </summary>
                  <ul className="mt-2 space-y-1 pl-2">
                    {validatedSiqs.factors.map((factor: any, i: number) => (
                      <li key={`factor-${i}`} className="text-xs text-muted-foreground">
                        {factor.name}: {(factor.score * 10).toFixed(1)}/10
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SIQSSummary);
