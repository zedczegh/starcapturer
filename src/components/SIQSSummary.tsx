
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
      // If no SIQS score but we have Bortle scale, estimate one based on that
      if (locationData && typeof locationData.bortleScale === 'number') {
        // Simple inverse relationship with Bortle scale (higher Bortle = lower SIQS)
        return normalizeToSiqsScale(10 - locationData.bortleScale * 0.8);
      }
      return 0;
    }
    // Normalize to ensure the score is on the 1-10 scale
    return normalizeToSiqsScale(Math.round(validatedSiqs.score * 10) / 10);
  }, [validatedSiqs, locationData]);
  
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
      } else if (locationData && typeof locationData.bortleScale === 'number') {
        // No score but we have Bortle scale, generate an estimated score
        const estimatedScore = 10 - locationData.bortleScale * 0.8;
        setValidatedSiqs({
          score: normalizeToSiqsScale(estimatedScore),
          isViable: estimatedScore >= 5,
          factors: []
        });
      } else {
        // No usable data
        setValidatedSiqs(null);
        console.error("Could not validate or recover SIQS data:", siqsResult);
      }
    } else {
      // Try to use location data Bortle scale for a base estimate if available
      if (locationData && typeof locationData.bortleScale === 'number') {
        const estimatedScore = 10 - locationData.bortleScale * 0.8;
        setValidatedSiqs({
          score: normalizeToSiqsScale(estimatedScore),
          isViable: estimatedScore >= 5,
          factors: []
        });
      } else {
        setValidatedSiqs(null);
        console.error("Invalid SIQS data:", siqsResult);
      }
    }
  }, [siqsResult, locationData]);

  // Force a minimum non-zero score for better display
  const displayScore = Math.max(0.1, siqsScore);
  const showProgressBar = true; // Always show the progress bar

  return (
    <Card className="bg-cosmic-800/70 border border-cosmic-700/50 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-yellow-400" />
          <span>{t("Sky Imaging Quality Score", "天空成像质量评分")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayScore <= 0.1 ? (
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
                {displayScore.toFixed(1)}
              </motion.div>
            </div>
            
            {showProgressBar && (
              <>
                <Progress 
                  value={displayScore * 10} 
                  max={100} 
                  className="h-2.5 mb-2" 
                  colorClass={scoreColorClass}
                />
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t("Poor", "较差")}</span>
                  <span className={`font-semibold ${scoreTextColorClass}`}>{qualityText}</span>
                  <span className="text-muted-foreground">{t("Excellent", "优秀")}</span>
                </div>
              </>
            )}
            
            {siqsCalculationTime && (
              <div className="flex justify-end items-center mt-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>{t("Calculated at", "计算于")} {siqsCalculationTime}</span>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SIQSSummary);
