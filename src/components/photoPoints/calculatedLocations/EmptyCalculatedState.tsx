
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface EmptyCalculatedStateProps {
  searchRadius: number;
  onRefresh?: () => void;
  isForecast?: boolean;
}

const EmptyCalculatedState: React.FC<EmptyCalculatedStateProps> = ({
  searchRadius,
  onRefresh,
  isForecast = false
}) => {
  const { t } = useLanguage();
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-border bg-card/50 text-center min-h-[300px]">
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      
      <h3 className="text-lg font-medium mb-2">
        {isForecast ? 
          t("No forecast spots found", "未找到预报观星点") :
          t("No spots found", "未找到观星点")
        }
      </h3>
      
      <p className="text-muted-foreground mb-4 max-w-md">
        {isForecast ? 
          t(
            `We couldn't find any good stargazing locations with favorable weather forecasts in this area for the selected day. Try changing the forecast day or increasing the search radius.`,
            `在选定的日期内，我们无法在该区域找到具有良好天气预报的观星地点。请尝试更改预报日期或增加搜索半径。`
          ) :
          t(
            `We couldn't find any good stargazing locations within ${searchRadius}km of your current location. Try increasing the search radius.`,
            `我们在您当前位置${searchRadius}公里范围内找不到良好的观星地点。尝试增加搜索半径。`
          )
        }
      </p>
      
      <div className="flex gap-4">
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t("Refresh", "刷新")}
        </Button>
      </div>
    </div>
  );
};

export default EmptyCalculatedState;
