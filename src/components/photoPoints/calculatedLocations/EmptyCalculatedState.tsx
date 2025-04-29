
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CloudOff, RefreshCw, CalendarSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyCalculatedStateProps {
  searchRadius: number;
  onRefresh?: () => void;
  isForecastMode?: boolean;
  selectedForecastDay?: number;
}

const EmptyCalculatedState: React.FC<EmptyCalculatedStateProps> = ({
  searchRadius,
  onRefresh,
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  const { t } = useLanguage();

  // Format the forecast date for display
  const formatForecastDate = (day: number): string => {
    if (day === 0) return t("today", "今天");
    
    const date = new Date();
    date.setDate(date.getDate() + day);
    
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {isForecastMode ? (
        <>
          <CalendarSearch className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">
            {t("No forecast locations found", "未找到预报位置")}
          </h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {t(
              `We couldn't find any good astronomy viewing locations for ${formatForecastDate(selectedForecastDay)} within ${searchRadius}km. Try selecting a different day or increasing your search radius.`,
              `我们无法在${searchRadius}公里范围内找到${formatForecastDate(selectedForecastDay)}的任何良好天文观测位置。尝试选择其他日期或增加您的搜索范围。`
            )}
          </p>
        </>
      ) : (
        <>
          <CloudOff className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">
            {t("No suitable locations found", "未找到合适的位置")}
          </h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {t(
              `We couldn't find any good astronomy viewing spots within ${searchRadius}km. Weather conditions or light pollution in this area may not be ideal right now.`,
              `我们无法在${searchRadius}公里范围内找到任何良好的天文观测点。该地区的天气条件或光污染目前可能不理想。`
            )}
          </p>
        </>
      )}

      {onRefresh && (
        <Button
          variant="outline"
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t("Try Again", "重试")}
        </Button>
      )}
    </div>
  );
};

export default EmptyCalculatedState;
