
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { CloudSun, Calendar, ThermometerSun, Info, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getRateColor, getSkyRating, getMinimumClearNights, getBestMonths } from '@/utils/weather/clearSkyUtils';
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
  
  // Get color class based on clear sky rate
  const rateColorClass = useMemo(() => {
    return getRateColor(clearSkyRate);
  }, [clearSkyRate]);
  
  // Get rating text based on clear sky rate
  const ratingText = useMemo(() => {
    return getSkyRating(clearSkyRate, t);
  }, [clearSkyRate, t]);
  
  // Calculate estimated clear nights per year
  const clearNightsPerYear = useMemo(() => {
    return getMinimumClearNights(clearSkyRate, latitude, longitude);
  }, [clearSkyRate, latitude, longitude]);
  
  // Get best months for observation
  const bestMonthsText = useMemo(() => {
    return getBestMonths(monthlyRates, clearestMonths, language, latitude);
  }, [monthlyRates, clearestMonths, language, latitude]);
  
  const clearNightsTooltip = language === 'en' 
    ? "Estimate of nights per year with clear skies suitable for stargazing. This excludes nights with full moon and accounts for weather patterns, light pollution, and atmospheric conditions."
    : "每年适合观星的晴朗夜晚估计。这不包括满月夜晚，并考虑了天气模式、光污染和大气条件。";

  // Determine percentage quality class for visual indicator
  const getPercentageClass = () => {
    if (clearSkyRate >= 75) return "bg-gradient-to-r from-emerald-500 to-green-500";
    if (clearSkyRate >= 60) return "bg-gradient-to-r from-green-500 to-emerald-400";
    if (clearSkyRate >= 45) return "bg-gradient-to-r from-yellow-400 to-green-400";
    if (clearSkyRate >= 30) return "bg-gradient-to-r from-amber-500 to-yellow-400";
    if (clearSkyRate >= 15) return "bg-gradient-to-r from-orange-500 to-amber-500";
    return "bg-gradient-to-r from-red-500 to-orange-500";
  };

  return (
    <Card className="shadow-md h-full overflow-hidden border border-cosmic-600/30 hover:border-cosmic-500/40 transition-all duration-300">
      <CardHeader className="pb-2 bg-cosmic-800/30">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <CloudSun className="mr-2 h-5 w-5 text-blue-400" />
            <span>{t("Clear Sky Rate", "晴空率")}</span>
          </div>
          <Badge 
            variant="outline" 
            className={`${rateColorClass} ml-2 text-sm font-semibold px-2.5`}
          >
            {clearSkyRate}%
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2 space-y-3">
        {/* Visual percentage bar */}
        <div className="w-full bg-cosmic-700/30 rounded-full h-2.5 mb-4 dark:bg-cosmic-700/50">
          <div 
            className={`h-2.5 rounded-full ${getPercentageClass()}`} 
            style={{ width: `${Math.max(5, clearSkyRate)}%` }}
          ></div>
        </div>
        
        {/* Rating with stars */}
        <ConditionItem
          icon={<Star className={`h-5 w-5 ${rateColorClass}`} />}
          label={t("Rating", "评级")}
          value={<span className={`font-medium ${rateColorClass}`}>{ratingText}</span>}
        />
        
        {/* Clear nights per year */}
        <ConditionItem
          icon={<Calendar className="h-5 w-5 text-blue-400" />}
          label={t("Clear Nights", "晴朗夜晚")}
          value={
            <div className="flex items-center">
              <span className="font-medium text-lg">{clearNightsPerYear}</span>
              <span className="ml-1 text-muted-foreground">{t("per year", "每年")}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="ml-1.5 inline-flex">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{clearNightsTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          }
        />
        
        {/* Best months */}
        <ConditionItem
          icon={<ThermometerSun className="h-5 w-5 text-amber-400" />}
          label={t("Best Season", "最佳季节")}
          value={<span className="text-muted-foreground">{bestMonthsText.split(': ')[1] || bestMonthsText}</span>}
        />
      </CardContent>
      
      <CardFooter className="pt-0 pb-3 px-6">
        <div className="w-full text-xs text-muted-foreground/80 italic">
          {language === 'en' 
            ? "* Analysis based on historical climate data, excluding full moon nights"
            : "* 基于历史气候数据分析，不包括满月夜晚"}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ClearSkyRateDisplay;
