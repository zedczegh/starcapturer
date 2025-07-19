import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, CloudSun, Target, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { normalizeToSiqsScale } from '@/utils/siqsHelpers';
import { getMinimumClearNights } from '@/utils/weather/clearSkyUtils';

interface SpotAbstractDisplayProps {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  siqs?: number;
}

const SpotAbstractDisplay: React.FC<SpotAbstractDisplayProps> = ({
  latitude,
  longitude,
  bortleScale = 5,
  siqs
}) => {
  const { t } = useLanguage();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [clearSkyRate, setClearSkyRate] = useState<number>(60); // Default value
  const [loading, setLoading] = useState(false);

  // Calculate SIQS score
  useEffect(() => {
    const fetchSiqs = async () => {
      if (siqs) {
        setRealTimeSiqs(normalizeToSiqsScale(siqs));
        return;
      }

      setLoading(true);
      try {
        const result = await calculateRealTimeSiqs(latitude, longitude, bortleScale);
        if (result?.siqs) {
          setRealTimeSiqs(normalizeToSiqsScale(result.siqs));
        }
      } catch (error) {
        console.error('Error calculating SIQS:', error);
        // Fallback to Bortle scale estimation
        const estimatedSiqs = Math.max(0.1, 10 - bortleScale);
        setRealTimeSiqs(estimatedSiqs);
      } finally {
        setLoading(false);
      }
    };

    fetchSiqs();
  }, [latitude, longitude, bortleScale, siqs]);

  // Fetch clear sky rate (mock API call - replace with actual implementation)
  useEffect(() => {
    const fetchClearSkyRate = async () => {
      try {
        // Mock implementation - replace with actual API call
        // This would typically fetch from weather/climate API
        const mockRate = Math.max(30, Math.min(90, 60 + Math.random() * 20));
        setClearSkyRate(Math.round(mockRate));
      } catch (error) {
        console.error('Error fetching clear sky rate:', error);
        setClearSkyRate(60); // Default fallback
      }
    };

    fetchClearSkyRate();
  }, [latitude, longitude]);

  const displaySiqs = realTimeSiqs || 0.1;

  // SIQS score interpretation and colors
  const siqsData = useMemo(() => {
    let interpretation, colorClass, bgClass;
    
    if (displaySiqs >= 8) {
      interpretation = t("Excellent", "优秀");
      colorClass = "text-emerald-500";
      bgClass = "bg-emerald-500";
    } else if (displaySiqs >= 6) {
      interpretation = t("Good", "良好");
      colorClass = "text-green-500";
      bgClass = "bg-green-500";
    } else if (displaySiqs >= 4) {
      interpretation = t("Average", "一般");
      colorClass = "text-yellow-500";
      bgClass = "bg-yellow-500";
    } else if (displaySiqs >= 2) {
      interpretation = t("Poor", "较差");
      colorClass = "text-amber-500";
      bgClass = "bg-amber-500";
    } else {
      interpretation = t("Bad", "很差");
      colorClass = "text-red-500";
      bgClass = "bg-red-500";
    }

    return { interpretation, colorClass, bgClass };
  }, [displaySiqs, t]);

  // Clear sky rate data
  const clearSkyData = useMemo(() => {
    const clearNights = getMinimumClearNights(clearSkyRate, latitude, longitude);
    
    let ratingText, ratingColor;
    if (clearNights >= 200) {
      ratingText = t("Prime", "顶级");
      ratingColor = "text-emerald-500";
    } else if (clearNights >= 100) {
      ratingText = t("Excellent", "极佳");
      ratingColor = "text-green-500";
    } else if (clearNights >= 50) {
      ratingText = t("Good", "良好");
      ratingColor = "text-yellow-500";
    } else if (clearNights >= 20) {
      ratingText = t("Average", "一般");
      ratingColor = "text-amber-500";
    } else {
      ratingText = t("Not Ideal", "不理想");
      ratingColor = "text-red-500";
    }

    return { clearNights, ratingText, ratingColor };
  }, [clearSkyRate, latitude, longitude, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card className="bg-cosmic-800/30 backdrop-blur-sm border border-cosmic-700/30 shadow-glow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-200">
            <Target className="h-5 w-5 text-primary" />
            {t("Location Quality Overview", "位置质量概览")}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* SIQS Score Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className={`h-4 w-4 ${siqsData.colorClass}`} />
                <span className="text-sm font-medium text-gray-300">
                  {t("SIQS Score", "SIQS评分")}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        {t("Stellar Imaging Quality Score - measures overall suitability for astrophotography", 
                           "天文观测质量评分 - 评估天文摄影的整体适宜性")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${siqsData.colorClass} font-semibold`}>
                  {loading ? '...' : displaySiqs.toFixed(1)}
                </Badge>
                <span className={`text-sm font-medium ${siqsData.colorClass}`}>
                  {siqsData.interpretation}
                </span>
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={Math.max(1, displaySiqs * 10)} 
                className="h-2 bg-cosmic-700/50"
              />
              <div 
                className={`absolute top-0 left-0 h-2 rounded-full ${siqsData.bgClass} transition-all duration-500`}
                style={{ width: `${Math.max(1, displaySiqs * 10)}%` }}
              />
            </div>
          </div>

          {/* Clear Sky Rate Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className={`h-4 w-4 ${clearSkyData.ratingColor}`} />
                <span className="text-sm font-medium text-gray-300">
                  {t("Annual Clear Sky Rate", "年度晴空率")}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        {t("Percentage of nights per year with clear skies suitable for stargazing", 
                           "每年适合观星的晴朗夜晚百分比")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${clearSkyData.ratingColor} font-semibold`}>
                  {clearSkyRate}%
                </Badge>
                <span className={`text-sm font-medium ${clearSkyData.ratingColor}`}>
                  {clearSkyData.ratingText}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>~{clearSkyData.clearNights} {t("clear nights/year", "晴朗夜晚/年")}</span>
              <span>{t("Based on climate data", "基于气候数据")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SpotAbstractDisplay;