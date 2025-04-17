
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Cloud,
  Calendar,
  Sun,
  BarChart3,
  SunMedium
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getMonthName, getRateColor, getSkyRating, getMinimumClearNights, getBestMonths } from '@/utils/weather/clearSkyUtils';

interface ClearSkyRateDisplayProps {
  clearSkyRate: number;
  monthlyRates?: Record<string, number>;
  clearestMonths?: string[];
  latitude?: number;
  longitude?: number;
}

const ClearSkyRateDisplay: React.FC<ClearSkyRateDisplayProps> = ({
  clearSkyRate,
  monthlyRates = {},
  clearestMonths = [],
  latitude,
  longitude
}) => {
  const { language, t } = useLanguage();
  
  // Calculate minimum clear nights per year
  const clearNights = getMinimumClearNights(clearSkyRate, latitude);
  
  // Get best months text
  const bestMonthsText = getBestMonths(
    monthlyRates, 
    clearestMonths, 
    language,
    latitude
  );
  
  // Get color based on the rate
  const rateColor = getRateColor(clearSkyRate);

  // Formatted tooltip value
  const tooltipValue = t(
    `Approximately ${clearNights} clear nights per year`,
    `每年约 ${clearNights} 个晴朗夜晚`
  );

  return (
    <Card className="bg-cosmic-900/50 border-cosmic-700/30 shadow-xl overflow-hidden">
      <CardHeader className="bg-cosmic-800/30 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <SunMedium className="w-4 h-4 text-yellow-400" />
          {t("Clear Sky Rate", "晴空率")}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Main Rate Display */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`text-3xl font-bold ${rateColor} cursor-help`}>
                    {clearSkyRate}%
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{tooltipValue}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-sm font-medium">
            {getSkyRating(clearSkyRate, t)}
          </div>
          <div className="w-full mt-2">
            <Progress value={clearSkyRate} className="h-2" />
          </div>
        </div>
        
        {/* Best Months Section */}
        <div className="space-y-2 pt-2 border-t border-cosmic-700/30">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-400" />
            <h4 className="text-xs font-medium">
              {t("Seasonal Pattern", "季节模式")}
            </h4>
          </div>
          
          <div className="bg-cosmic-800/30 rounded p-2">
            <p className="text-xs">
              {bestMonthsText}
            </p>
            
            {/* Monthly chart visualization - simplified */}
            {Object.keys(monthlyRates).length > 0 && (
              <div className="flex items-end h-8 gap-px mt-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const rate = monthlyRates[month.toString()] || 0;
                  const height = `${Math.max(15, rate)}%`;
                  const monthName = getMonthName(month, language);
                  
                  return (
                    <TooltipProvider key={month}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="flex-1 bg-blue-500/60 hover:bg-blue-500/80 cursor-help transition-all"
                            style={{ height }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {monthName}: {rate}%
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Historical context */}
          <div className="text-xs text-cosmic-400 mt-1">
            {t(
              "Data from historical weather patterns and regional climate records.",
              "数据来源于历史天气模式和区域气候记录。"
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClearSkyRateDisplay;
