
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { CloudSun, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyCalculatedStateProps {
  searchRadius?: number;
  onRefresh?: () => void;
  isForecastMode?: boolean;
  forecastDay?: number;
}

const EmptyCalculatedState: React.FC<EmptyCalculatedStateProps> = ({
  searchRadius = 0,
  onRefresh,
  isForecastMode = false,
  forecastDay = 1
}) => {
  const { t } = useLanguage();

  // Create a custom message based on mode
  const title = isForecastMode
    ? t("No forecast spots found", "未找到预测点")
    : t("No calculated spots found", "未找到计算点");

  const message = isForecastMode 
    ? t(`No quality spots predicted for Day ${forecastDay} within ${searchRadius}km radius`, `在${searchRadius}公里半径内没有找到第${forecastDay}天的高质量预测点`)
    : t(`No quality spots found within ${searchRadius}km radius`, `在${searchRadius}公里半径内没有找到高质量点`);

  const suggestion = isForecastMode
    ? t("Try a different forecast day or increase search radius", "尝试其他预测天数或增加搜索半径")
    : t("Try increasing search radius or moving to a less light-polluted area", "尝试增加搜索半径或移动到光污染较少的地区");

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <CloudSun className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-2">{message}</p>
      <p className="text-sm text-muted-foreground mb-4">{suggestion}</p>
      
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t("Refresh", "刷新")}
        </Button>
      )}
    </div>
  );
};

export default EmptyCalculatedState;
