
import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from 'lucide-react';

interface ForecastDaySliderProps {
  currentValue: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
  loading?: boolean;
  loadingComplete?: boolean;
}

const ForecastDaySlider: React.FC<ForecastDaySliderProps> = ({
  currentValue,
  onValueChange,
  minValue = 1,
  maxValue = 15,
  stepValue = 1,
  loading = false,
  loadingComplete = false
}) => {
  const { t } = useLanguage();

  const handleSliderChange = (values: number[]) => {
    onValueChange(values[0]);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          {t("Forecast Day", "预测天数")}
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </h3>
        <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
          {t("Day", "天数")}: {currentValue}
        </span>
      </div>
      
      <Slider
        defaultValue={[currentValue]}
        min={minValue}
        max={maxValue}
        step={stepValue}
        onValueChange={handleSliderChange}
        disabled={loading}
        className="my-4"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t("Today", "今天")}</span>
        <span className="text-center">{t("1 Week", "1周")}</span>
        <span>{t("15 Days", "15天")}</span>
      </div>
      
      <div className="mt-3 text-xs text-muted-foreground text-center">
        {t("Slide to see sky quality forecasts for upcoming days", "滑动查看未来天空质量预测")}
      </div>
    </div>
  );
};

export default ForecastDaySlider;
