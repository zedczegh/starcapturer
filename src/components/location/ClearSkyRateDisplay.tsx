
import React, { useState, useEffect } from 'react';
import { Star, StarHalf, StarOff, Info, Calendar, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useWeatherDataIntegration } from '@/hooks/useWeatherDataIntegration';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { getSkyRating, getRateColor, getMinimumClearNights, getBestMonths, getMonthName } from '@/utils/weather/clearSkyUtils';

interface ClearSkyRateDisplayProps {
  latitude: number;
  longitude: number;
}

const ClearSkyRateDisplay: React.FC<ClearSkyRateDisplayProps> = ({ latitude, longitude }) => {
  const { language, t } = useLanguage();
  const [showMonthly, setShowMonthly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    clearSkyData, 
    historicalData,
    loading, 
    fetching, 
    refresh,
    isCertifiedLocation
  } = useWeatherDataIntegration(latitude, longitude, {
    includeHistoricalData: true
  });

  useEffect(() => {
    if (!fetching && isRefreshing) {
      setIsRefreshing(false);
    }
  }, [fetching]);

  // Ensure we always have a valid annual rate value
  const annualRate = clearSkyData?.annualRate || 50; // Use 50% as default instead of 0
  // Ensure we always have a reasonable number of clear nights
  const clearNightsPerYear = getMinimumClearNights(annualRate);
  const monthlyRates = clearSkyData?.monthlyRates || {};
  const dataSource = clearSkyData?.source || '';
  
  const seasonalTrends = historicalData?.seasonalTrends;
  const clearestMonths = historicalData?.clearestMonths || [];
  const visibility = historicalData?.visibility;

  const getStarIcon = (rate: number) => {
    if (rate >= 75) return <Star className="text-yellow-400" />;
    if (rate >= 45) return <StarHalf className="text-yellow-400" />;
    return <StarOff className="text-gray-400" />;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refresh();
  };

  const getCertifiedStatusDescription = () => {
    if (!isCertifiedLocation) return '';
    
    if (clearSkyData?.isDarkSkyReserve) {
      return t('Official Dark Sky Reserve', '官方暗夜天空保护区');
    }
    
    if (clearSkyData?.certification) {
      return clearSkyData.certification;
    }
    
    return '';
  };

  return (
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800 hover:bg-cosmic-800/50 transition-all duration-300">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cosmic-800/50 p-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">
                {t('Clear Nights Per Year', '年度晴朗夜晚')}
              </h3>
              
              {isCertifiedLocation && (
                <div className="text-xs text-primary">
                  {getCertifiedStatusDescription()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('Refresh data', '刷新数据')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setShowMonthly(!showMonthly)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showMonthly ? (
                      <Star className="w-4 h-4" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {showMonthly 
                    ? t('Show annual statistics', '显示年度统计') 
                    : t('Show monthly breakdown', '显示月度分布')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {loading || isRefreshing ? (
          <div className="animate-pulse space-y-2">
            <div className="bg-cosmic-800/50 h-6 w-full rounded" />
            <div className="bg-cosmic-800/50 h-4 w-3/4 rounded" />
          </div>
        ) : showMonthly ? (
          <div>
            <div className="grid grid-cols-3 gap-1 text-xs mt-2">
              {Object.entries(monthlyRates).map(([month, rate]) => (
                <div key={month} className="flex items-center justify-between">
                  <span>{getMonthName(month, language)}</span>
                  <span className={getRateColor(Number(rate))}>{rate}%</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {getBestMonths(monthlyRates, clearestMonths, language)}
            </div>
            
            {isCertifiedLocation && seasonalTrends && (
              <div className="mt-2 border-t border-cosmic-700/50 pt-2">
                <div className="text-xs font-medium mb-1">{t('Seasonal Patterns', '季节模式')}:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(seasonalTrends).map(([season, data]) => {
                    const seasonData = data as { clearSkyRate: number; averageTemperature: number };
                    return (
                      <div key={season} className="flex items-center justify-between">
                        <span>{t(season.charAt(0).toUpperCase() + season.slice(1), 
                              season === 'spring' ? '春季' : 
                              season === 'summer' ? '夏季' : 
                              season === 'fall' ? '秋季' : '冬季')}</span>
                        <span className={getRateColor(seasonData.clearSkyRate)}>
                          {seasonData.clearSkyRate}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1">
            <div className="flex items-center">
              <span className="text-2xl font-semibold">{clearNightsPerYear}</span>
              <span className="ml-1 text-sm text-muted-foreground">{t('nights', '晚')}</span>
            </div>
            
            <div className="mt-1 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {t('Sky Quality:', '天空质量:')} {getSkyRating(annualRate, t)}
              </div>
              
              <div className="flex items-center space-x-1">
                <span className={`font-medium text-sm ${getRateColor(annualRate)}`}>
                  {annualRate}%
                </span>
                {getStarIcon(annualRate)}
              </div>
            </div>
            
            <div className="mt-1 text-xs text-muted-foreground">
              {visibility && (
                <span>{typeof visibility === 'string' ? 
                  t(
                    visibility, 
                    visibility === 'excellent' ? '极佳' : 
                    visibility === 'good' ? '良好' : 
                    visibility === 'average' ? '一般' : '较差'
                  ) : 
                  t('average', '一般')
                }</span>
              )}
            </div>
            
            <div className="mt-1 text-xs text-muted-foreground">
              {getBestMonths(monthlyRates, clearestMonths, language)}
            </div>
            
            {isCertifiedLocation && historicalData?.annualPrecipitationDays && (
              <div className="mt-1 text-xs text-muted-foreground">
                {t('Average Precipitation:', '平均降水:')} {historicalData.annualPrecipitationDays} {t('days/year', '天/年')}
              </div>
            )}
          </div>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 cursor-help">
                <Info className="w-3 h-3" />
                <span>
                  {isCertifiedLocation 
                    ? t('Based on certified location data', '基于认证地点数据') 
                    : (dataSource || t('Based on historical data', '基于历史数据'))}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">
                {isCertifiedLocation
                  ? t(
                      'Data from official certification records, enhanced with local measurements and climate analysis',
                      '数据来自官方认证记录，并结合本地测量和气候分析进行增强'
                    )
                  : t(
                      'Estimates based on geographical location, historical weather patterns, and regional climate data',
                      '基于地理位置、历史天气模式和区域气候数据的估算'
                    )}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  );
};

export default ClearSkyRateDisplay;
