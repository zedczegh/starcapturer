
import React from "react";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface ForecastDaySliderProps {
  currentValue: number;
  onValueChange: (value: number) => void;
  loading?: boolean;
  loadingComplete?: boolean;
}

const ForecastDaySlider: React.FC<ForecastDaySliderProps> = ({
  currentValue,
  onValueChange,
  loading = false,
  loadingComplete = false,
}) => {
  const { t } = useLanguage();
  const today = new Date();
  
  const formattedDate = format(addDays(today, currentValue), "MMM d");
  const isToday = currentValue === 0;

  return (
    <div className="px-4 md:px-8 py-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {t("Forecast Day", "预测日")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "px-2 py-1 rounded-md text-xs font-medium",
            isToday ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {isToday 
              ? t("Today", "今天") 
              : t(`Day ${currentValue}: ${formattedDate}`, `第${currentValue}天: ${formattedDate}`)}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Slider
          defaultValue={[currentValue]}
          max={14}
          min={0}
          step={1}
          onValueChange={(values) => onValueChange(values[0])}
          disabled={loading}
          className={cn(
            "cursor-pointer",
            loading ? "opacity-50" : "opacity-100"
          )}
        />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{t("Today", "今天")}</span>
          <span>{t("7 days", "7天")}</span>
          <span>{t("15 days", "15天")}</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center mt-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping mr-1"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping mr-1" style={{ animationDelay: "150ms" }}></div>
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" style={{ animationDelay: "300ms" }}></div>
        </div>
      )}
    </div>
  );
};

export default ForecastDaySlider;
