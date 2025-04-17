
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

  // Determine best observation months based on latitude
  const getBestMonthsForLatitude = () => {
    const isNorthern = latitude === undefined || latitude >= 0;
    
    if (latitude && Math.abs(latitude) > 60) {
      // Polar regions
      return isNorthern ? 
        t("September to March (polar winter)", "9月至3月（极地冬季）") : 
        t("March to September (polar winter)", "3月至9月（极地冬季）");
    } else if (latitude && Math.abs(latitude) > 30) {
      // Mid latitudes
      return isNorthern ?
        t("October to March", "10月至3月") :
        t("April to September", "4月至9月");
    } else {
      // Near equator - less seasonal variation
      return t("Year-round with slight favor to dry season", "全年（尤其是干季）");
    }
  };

  // Get historical context for the location based on latitude
  const getHistoricalContext = () => {
    if (!latitude) return "";
    
    const absLatitude = Math.abs(latitude);
    const isNorthern = latitude >= 0;
    
    if (absLatitude > 66) {
      return t(
        "This polar region experiences extreme day/night cycles with midnight sun in summer and polar nights in winter, historically challenging for astronomers.",
        "这个极地地区经历极端的昼夜周期，夏季有午夜太阳，冬季有极夜，历来对天文学家是一种挑战。"
      );
    } else if (absLatitude > 45) {
      return t(
        "This temperate location has significant seasonal variations in night length, traditionally offering excellent winter stargazing conditions.",
        "这个温带位置的夜晚长度有明显的季节性变化，传统上冬季提供极佳的观星条件。"
      );
    } else if (absLatitude > 23.5) {
      return isNorthern ? 
        t(
          "This mid-latitude region has been favored by astronomers for centuries, with moderate seasonal changes and good year-round observation opportunities.",
          "这个中纬度地区几个世纪以来一直受到天文学家的青睐，季节变化适中，全年都有良好的观测机会。"
        ) :
        t(
          "Southern mid-latitudes offer views of the spectacular southern celestial features, historically important for navigation and cultural storytelling.",
          "南半球中纬度地区提供壮观的南天celestial特征的景象，在历史上对导航和文化讲述很重要。"
        );
    } else {
      return t(
        "Near-equatorial regions like this have consistent night lengths year-round and have traditionally been valued for their access to both northern and southern celestial hemispheres.",
        "像这样的近赤道地区全年夜晚长度一致，传统上因能同时观测到北天和南天celestial半球而备受重视。"
      );
    }
  };

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
          <div className="mt-1 text-xs text-blue-300">
            {t("Approximately", "约")} {clearNights} {t("clear nights per year", "个晴朗夜晚每年")}
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
          
          {/* Historical Context & Best Observation Times Section */}
          <div className="bg-cosmic-800/30 rounded-md p-2 mt-2">
            <p className="text-blue-200 text-xs font-medium mb-1">
              {t('Best months for observation:', '最佳观测月份:')} {getBestMonthsForLatitude()}
            </p>
            <p className="text-cosmic-300 text-xs">
              {getHistoricalContext()}
            </p>
            <p className="text-cosmic-400 text-xs mt-1 italic">
              {t('Estimates based on geographical location, historical weather patterns, and regional climate data.', 
                '基于地理位置、历史天气模式和区域气候数据的估计。')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClearSkyRateDisplay;
