
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Slider } from '@/components/ui/slider';
import { format, addDays } from 'date-fns';
import { Clock } from 'lucide-react';

interface ForecastDaySliderProps {
  currentValue: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  loading?: boolean;
}

const ForecastDaySlider: React.FC<ForecastDaySliderProps> = ({
  currentValue,
  onValueChange,
  minValue = 0,
  maxValue = 14,
  loading = false
}) => {
  const { t } = useLanguage();
  const today = new Date();
  const forecastDate = addDays(today, currentValue);
  const formattedDate = format(forecastDate, 'MMM d');

  const handleChange = (value: number[]) => {
    onValueChange(value[0]);
  };

  return (
    <div className="space-y-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t("Forecast day", "预测日期")}
          </span>
        </div>
        <div className="flex items-center">
          <span className={`text-sm font-semibold ${loading ? 'opacity-50' : ''}`}>
            {currentValue === 0 
              ? t("Today", "今天") 
              : currentValue === 1 
                ? t("Tomorrow", "明天") 
                : formattedDate}
          </span>
          {loading && (
            <div className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      </div>
      
      <Slider
        disabled={loading}
        value={[currentValue]}
        min={minValue}
        max={maxValue}
        step={1}
        onValueChange={handleChange}
        className={loading ? "opacity-50" : ""}
      />
      
      <div className="flex justify-between text-xs text-muted-foreground pt-1">
        <span>{t("Today", "今天")}</span>
        <span>+7 {t("days", "天")}</span>
        <span>+14 {t("days", "天")}</span>
      </div>
    </div>
  );
};

export default ForecastDaySlider;
