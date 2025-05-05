
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { CloudSun, Calendar, ThermometerSun, Info, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getRateColor, getMinimumClearNights, getBestMonths } from '@/utils/weather/clearSkyUtils';
import ConditionItem from '@/components/weather/ConditionItem';

interface ClearSkyRateDisplayProps {
  latitude: number;
  longitude: number;
  clearSkyRate: number;
  monthlyRates?: Record<string, number>;
  clearestMonths?: string[];
}

const ClearSkyRateDisplay: React.FC<ClearSkyRateDisplayProps> = ({
  latitude,
  longitude,
  clearSkyRate,
  monthlyRates = {},
  clearestMonths = []
}) => {
  const { language, t } = useLanguage();
  
  // Calculate estimated clear nights per year
  const clearNightsPerYear = useMemo(() => {
    return getMinimumClearNights(clearSkyRate, latitude, longitude);
  }, [clearSkyRate, latitude, longitude]);
  
  // Get best months for observation
  const bestMonthsText = useMemo(() => {
    return getBestMonths(monthlyRates, clearestMonths, language, latitude);
  }, [monthlyRates, clearestMonths, language, latitude]);
  
  // New function to get rating based on clear night count
  const getNightCountRating = (nightCount: number): {
    ratingText: string;
    colorClass: string;
    stars: number;
  } => {
    if (nightCount >= 200) {
      return { ratingText: t("Prime", "顶级"), colorClass: "text-emerald-500", stars: 5 };
    } 
    if (nightCount >= 100) {
      return { ratingText: t("Excellent", "极佳"), colorClass: "text-green-500", stars: 4 };
    } 
    if (nightCount >= 50) {
      return { ratingText: t("Good", "良好"), colorClass: "text-yellow-500", stars: 3 };
    }
    if (nightCount >= 20) {
      return { ratingText: t("Average", "一般"), colorClass: "text-amber-500", stars: 2 };
    }
    return { ratingText: t("Not Ideal", "不理想"), colorClass: "text-red-500", stars: 1 };
  };

  const clearNightsTooltip = language === 'en' 
    ? "Estimate of nights per year with clear skies suitable for stargazing. This excludes nights with full moon and accounts for weather patterns, light pollution, and atmospheric conditions."
    : "每年适合观星的晴朗夜晚估计。这不包括满月夜晚，并考虑了天气模式、光污染和大气条件。";

  // Get rating info based on number of clear nights
  const rating = useMemo(() => {
    return getNightCountRating(clearNightsPerYear);
  }, [clearNightsPerYear, t]);

  // Determine percentage quality class for visual indicator
  const getProgressClass = (nightCount: number) => {
    if (nightCount >= 200) return "bg-gradient-to-r from-emerald-500 to-green-500";
    if (nightCount >= 100) return "bg-gradient-to-r from-green-500 to-emerald-400";
    if (nightCount >= 50) return "bg-gradient-to-r from-yellow-400 to-green-400";
    if (nightCount >= 20) return "bg-gradient-to-r from-amber-500 to-yellow-400";
    return "bg-gradient-to-r from-red-500 to-orange-500";
  };

  // Calculate progress percentage (max calibrated to 250 nights)
  const progressPercentage = Math.min(100, (clearNightsPerYear / 250) * 100);
  
  return (
    <Card className="shadow-md h-full overflow-hidden border border-cosmic-600/30 hover:border-cosmic-500/40 transition-all duration-300">
      <CardHeader className="pb-2 bg-cosmic-800/30">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center">
            <CloudSun className="mr-2 h-4 w-4 text-blue-400" />
            <span>{t("Clear Sky Nights", "晴空夜晚")}</span>
          </div>
          <Badge 
            variant="outline" 
            className={`${rating.colorClass} ml-2 text-xs font-semibold px-2`}
          >
            {clearNightsPerYear} {t("per year", "每年")}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-3 pb-2 space-y-3">
        {/* Visual progress bar */}
        <div className="w-full bg-cosmic-700/30 rounded-full h-2 mb-3 dark:bg-cosmic-700/50">
          <div 
            className={`h-2 rounded-full ${getProgressClass(clearNightsPerYear)}`} 
            style={{ width: `${Math.max(5, progressPercentage)}%` }}
          ></div>
        </div>
        
        {/* Rating with stars */}
        <ConditionItem
          icon={<Star className={`h-4 w-4 ${rating.colorClass}`} />}
          label={t("Rating", "评级")}
          value={
            <div className="flex items-center">
              <span className={`text-xs font-medium ${rating.colorClass}`}>{rating.ratingText}</span>
              <div className="flex ml-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    className={i < rating.stars ? rating.colorClass : "text-gray-400"} 
                    fill={i < rating.stars ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>
          }
          className="mb-1"
        />
        
        {/* Clear nights per year */}
        <ConditionItem
          icon={<Calendar className="h-4 w-4 text-blue-400" />}
          label={t("Clear Nights", "晴朗夜晚")}
          value={
            <div className="flex items-center">
              <span className={`font-medium text-sm ${rating.colorClass}`}>{clearNightsPerYear}</span>
              <span className="ml-1 text-xs text-muted-foreground">{t("per year", "每年")}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1.5 inline-flex">
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{clearNightsTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          }
          className="mb-1"
        />
        
        {/* Best months */}
        <ConditionItem
          icon={<ThermometerSun className="h-4 w-4 text-amber-400" />}
          label={t("Best Season", "最佳季节")}
          value={<span className="text-xs text-muted-foreground">{bestMonthsText.split(': ')[1] || bestMonthsText}</span>}
          className="mb-1"
        />
      </CardContent>
      
      <CardFooter className="pt-0 pb-2 px-4">
        <div className="w-full text-xs text-muted-foreground/70 italic">
          {language === 'en' 
            ? "* Based on historical data, excludes full moon nights"
            : "* 基于历史数据分析，不包括满月夜晚"}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ClearSkyRateDisplay;
