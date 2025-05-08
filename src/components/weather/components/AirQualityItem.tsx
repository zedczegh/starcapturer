
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wind, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AirQualityItemProps {
  aqi: number;
}

const AirQualityItem: React.FC<AirQualityItemProps> = ({ aqi }) => {
  const { t } = useLanguage();
  
  const getAQIDescription = (value: number): string => {
    if (value <= 50) return t("Good", "良好");
    if (value <= 100) return t("Moderate", "中等");
    if (value <= 150) return t("Unhealthy for sensitive groups", "对敏感人群不健康");
    if (value <= 200) return t("Unhealthy", "不健康");
    if (value <= 300) return t("Very unhealthy", "非常不健康");
    return t("Hazardous", "危险");
  };
  
  const getAQIColorClass = (value: number): string => {
    if (value <= 50) return "text-green-400";
    if (value <= 100) return "text-yellow-400";
    if (value <= 150) return "text-orange-400";
    if (value <= 200) return "text-red-400";
    if (value <= 300) return "text-purple-400";
    return "text-red-600";
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-1">
        <Wind className="w-4 h-4 text-purple-400" />
        <div className="flex items-center">
          <span className="text-xs font-medium">{t("Air Quality", "空气质量")}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {t("Air Quality Index (AQI)", "空气质量指数 (AQI)")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-xs text-muted-foreground">{t('AQI', 'AQI')}</span>
        <span className={`text-right text-sm font-medium ${getAQIColorClass(aqi)}`}>
          {aqi}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
        <span className="text-xs text-muted-foreground">{t('Quality', '质量')}</span>
        <span className={`text-right text-xs ${getAQIColorClass(aqi)}`}>
          {getAQIDescription(aqi)}
        </span>
      </div>
    </div>
  );
};

export default AirQualityItem;
