
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CloudFog, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AirQualityItemProps {
  aqi: number;
}

const AirQualityItem: React.FC<AirQualityItemProps> = ({ aqi }) => {
  const { t } = useLanguage();
  
  const getAqiInfo = (value: number) => {
    if (value <= 20) return { color: "text-green-400", label: t("Excellent", "极佳") };
    if (value <= 40) return { color: "text-green-300", label: t("Good", "良好") };
    if (value <= 60) return { color: "text-yellow-300", label: t("Moderate", "中等") };
    if (value <= 80) return { color: "text-yellow-500", label: t("Fair", "一般") };
    if (value <= 100) return { color: "text-orange-400", label: t("Poor", "较差") };
    return { color: "text-red-400", label: t("Unhealthy", "不健康") };
  };
  
  const aqiInfo = getAqiInfo(aqi);
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-cosmic-700/40 mr-3">
          <CloudFog className="h-5 w-5 text-cosmic-200" />
        </div>
        <span className="font-medium">{t("Air Quality", "空气质量")}</span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`font-bold text-lg ${aqiInfo.color}`}>
            {aqi} ({aqiInfo.label})
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs bg-cosmic-800 border-cosmic-600">
          <p className="text-xs text-cosmic-100">
            {t(
              "European Air Quality Index (1-100+). Lower is better.", 
              "欧洲空气质量指数 (1-100+)。越低越好。"
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default AirQualityItem;
