
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

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

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-4 mb-4">
        {isForecast ? (
          <Calendar className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        ) : (
          <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        {isForecast 
          ? t("No forecast spots found", "未找到预测点位") 
          : t("No calculated spots found", "未找到计算点位")
        }
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-6">
        {isForecast 
          ? t(
              "We couldn't find good photo spots for this forecast date. Try another day or expand your search radius.",
              "我们无法为此预测日期找到好的拍摄点。请尝试另一天或扩大您的搜索半径。"
            )
          : t(
              "We couldn't find any calculated spots within {radius}km of your location. Try expanding the search radius.",
              "我们无法在您位置周围{radius}公里内找到任何计算点位。请尝试扩大搜索半径。",
              { radius: searchRadius }
            )
        }
      </p>
      
      {onRefresh && (
        <Button 
          onClick={onRefresh} 
          className="flex items-center gap-2"
          variant="outline"
        >
          <RefreshCcw className="h-4 w-4" />
          {t("Refresh", "刷新")}
        </Button>
      )}
    </div>
  );
};

export default EmptyCalculatedState;
