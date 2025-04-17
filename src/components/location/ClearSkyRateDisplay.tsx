
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getRateColor, getSkyRating, getMinimumClearNights, getBestMonths } from '@/utils/weather/clearSkyUtils';

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
  
  const tooltipText = language === 'en' 
    ? "Estimate of nights per year with clear skies suitable for stargazing. This excludes nights with full moon and accounts for weather patterns, light pollution, and atmospheric conditions."
    : "每年适合观星的晴朗夜晚估计。这不包括满月夜晚，并考虑了天气模式、光污染和大气条件。";

  return (
    <Card className="shadow-md h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{t("Clear Sky Rate", "晴空率")}</span>
          <Badge variant="outline" className={`${rateColorClass} ml-2`}>
            {clearSkyRate}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            {t("Rating", "评级")}: <span className={rateColorClass}>{ratingText}</span>
          </div>
          
          <div className="text-sm flex items-center">
            <span>{t("Clear Nights", "晴朗夜晚")}:</span> 
            <span className="ml-1 font-medium">{clearNightsPerYear}</span>
            <span className="ml-1 text-muted-foreground">{t("per year", "每年")}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-1 inline-flex">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="text-sm text-muted-foreground mt-1">
            {bestMonthsText}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClearSkyRateDisplay;
