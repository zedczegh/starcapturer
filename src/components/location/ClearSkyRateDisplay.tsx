
import React, { useState, useEffect } from 'react';
import { Star, Moon, Info, Calendar, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { fetchClearSkyRate, clearClearSkyRateCache } from '@/lib/api/clearSkyRate';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface ClearSkyRateDisplayProps {
  latitude: number;
  longitude: number;
}

const ClearSkyRateDisplay: React.FC<ClearSkyRateDisplayProps> = ({ latitude, longitude }) => {
  const { language, t } = useLanguage();
  const [showMonthly, setShowMonthly] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Force refresh data when component mounts
  useEffect(() => {
    // Clear cache for this location on first load
    clearClearSkyRateCache(latitude, longitude);
  }, [latitude, longitude]);
  
  const { data: clearSkyData, isLoading, isFetching } = useQuery({
    queryKey: ['clearSkyRate', latitude, longitude, refreshKey],
    queryFn: () => fetchClearSkyRate(latitude, longitude),
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
  });

  // Reset refresh state when fetching completes
  useEffect(() => {
    if (!isFetching && isRefreshing) {
      setIsRefreshing(false);
    }
  }, [isFetching]);

  const annualRate = clearSkyData?.annualRate || 0;
  const clearNightsPerYear = Math.round((annualRate / 100) * 365);
  const monthlyRates = clearSkyData?.monthlyRates || {};
  const dataSource = clearSkyData?.source || '';

  // Determine the best viewing months
  const getBestMonths = (): string => {
    if (!monthlyRates || Object.keys(monthlyRates).length === 0) return '';
    
    const sortedMonths = Object.entries(monthlyRates)
      .sort(([, rateA], [, rateB]) => rateB - rateA)
      .slice(0, 3)
      .map(([month]) => month);
    
    return language === 'en' 
      ? `Best months: ${sortedMonths.join(', ')}`
      : `最佳月份: ${sortedMonths.join(', ')}`;
  };

  // Get the sky rating text based on percentage
  const getSkyRating = (percentage: number): string => {
    if (percentage >= 75) return t('Excellent', '极好');
    if (percentage >= 60) return t('Very Good', '很好');
    if (percentage >= 45) return t('Good', '良好');
    if (percentage >= 30) return t('Fair', '一般');
    return t('Poor', '较差');
  };

  // Map months to localized names
  const getMonthName = (monthKey: string): string => {
    const monthMap: Record<string, [string, string]> = {
      'Jan': ['January', '一月'],
      'Feb': ['February', '二月'],
      'Mar': ['March', '三月'],
      'Apr': ['April', '四月'],
      'May': ['May', '五月'],
      'Jun': ['June', '六月'],
      'Jul': ['July', '七月'],
      'Aug': ['August', '八月'],
      'Sep': ['September', '九月'],
      'Oct': ['October', '十月'],
      'Nov': ['November', '十一月'],
      'Dec': ['December', '十二月']
    };
    
    return language === 'en' ? monthMap[monthKey][0] : monthMap[monthKey][1];
  };

  // Get color based on clear sky rate
  const getRateColor = (rate: number): string => {
    if (rate >= 75) return 'text-green-400';
    if (rate >= 60) return 'text-blue-400';
    if (rate >= 45) return 'text-yellow-400';
    if (rate >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setIsRefreshing(true);
    clearClearSkyRateCache(latitude, longitude);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800 hover:bg-cosmic-800/50 transition-all duration-300">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cosmic-800/50 p-2 rounded-full">
              <Moon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">
                {t('Clear Nights Per Year', '年度晴朗夜晚')}
              </h3>
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

        {isLoading || isRefreshing ? (
          <div className="animate-pulse space-y-2">
            <div className="bg-cosmic-800/50 h-6 w-full rounded" />
            <div className="bg-cosmic-800/50 h-4 w-3/4 rounded" />
          </div>
        ) : showMonthly ? (
          <div>
            <div className="grid grid-cols-3 gap-1 text-xs mt-2">
              {Object.entries(monthlyRates).map(([month, rate]) => (
                <div key={month} className="flex items-center justify-between">
                  <span>{getMonthName(month)}:</span>
                  <span className={getRateColor(rate)}>{rate}%</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {getBestMonths()}
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-semibold">{clearNightsPerYear}</span>
                <span className="text-sm text-muted-foreground">{t('nights', '晚')}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className={`font-medium text-sm ${getRateColor(annualRate)}`}>
                  {annualRate}%
                </span>
                <Star className={`w-4 h-4 ${getRateColor(annualRate)}`} />
              </div>
            </div>
            
            <div className="mt-1 text-xs text-muted-foreground">
              {t('Sky Quality:', '天空质量:')} {getSkyRating(annualRate)}
            </div>
            
            <div className="mt-1 text-xs text-muted-foreground">
              {getBestMonths()}
            </div>
          </div>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 cursor-help">
                <Info className="w-3 h-3" />
                <span>{dataSource || t('Based on historical data', '基于历史数据')}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">
                {t(
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
