
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sun,
  Cloud,
  Moon,
  Eye,
  Info,
  CloudFog,
  CircleAlert,
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getBortleDescription } from "@/utils/weather/bortleScaleUtils";

interface SecondaryConditionsProps {
  cloudCover: number;
  moonPhase: string;
  bortleScale: number | null;
  aqi?: number;
  nighttimeCloudData?: {
    average: number;
    description?: string;
    evening?: number;
    morning?: number;
  } | null;
}

const SecondaryConditions: React.FC<SecondaryConditionsProps> = ({
  cloudCover,
  moonPhase,
  bortleScale,
  aqi,
  nighttimeCloudData
}) => {
  const { t } = useLanguage();
  
  // Helper to get cloud cover color class based on value
  const getCloudCoverColorClass = (value: number) => {
    if (value <= 10) return "text-green-400";
    if (value <= 20) return "text-green-300";
    if (value <= 30) return "text-yellow-300";
    if (value <= 50) return "text-yellow-500";
    if (value <= 70) return "text-orange-400";
    return "text-red-400";
  };
  
  // Helper to get AQI color class and label
  const getAqiInfo = (value: number) => {
    if (value <= 20) return { color: "text-green-400", label: t("Excellent", "极佳") };
    if (value <= 40) return { color: "text-green-300", label: t("Good", "良好") };
    if (value <= 60) return { color: "text-yellow-300", label: t("Moderate", "中等") };
    if (value <= 80) return { color: "text-yellow-500", label: t("Fair", "一般") };
    if (value <= 100) return { color: "text-orange-400", label: t("Poor", "较差") };
    return { color: "text-red-400", label: t("Unhealthy", "不健康") };
  };
  
  return (
    <div className="space-y-4 text-cosmic-100">
      <div className="flex items-center">
        <Cloud className="h-5 w-5 mr-2 text-cosmic-300" />
        <span className="font-medium">{t("Cloud Cover", "云层覆盖")}: </span>
        <span className={`ml-auto font-semibold ${getCloudCoverColorClass(cloudCover)}`}>
          {cloudCover}%
        </span>
      </div>

      {nighttimeCloudData && (
        <div className="flex items-center">
          <CloudFog className="h-5 w-5 mr-2 text-cosmic-300" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium flex items-center">
                  {nighttimeCloudData.description || t("Tonight's Cloud Cover", "今晚云量")}:
                  <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 inline-block" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-cosmic-800 border-cosmic-600">
                <p className="text-xs text-cosmic-100">
                  {t(
                    "This shows the average cloud cover for tonight (18:00-7:00) based on forecast data.", 
                    "这显示了基于预报数据的今晚 (18:00-7:00) 平均云量。"
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className={`ml-auto font-semibold ${getCloudCoverColorClass(nighttimeCloudData.average)}`}>
            {nighttimeCloudData.average.toFixed(1)}%
          </span>
        </div>
      )}
      
      <div className="flex items-center">
        <Moon className="h-5 w-5 mr-2 text-cosmic-300" />
        <span className="font-medium">{t("Moon Phase", "月相")}: </span>
        <span className="ml-auto font-semibold text-cosmic-50">
          {moonPhase}
        </span>
      </div>
      
      <div className="flex items-center">
        <Sun className="h-5 w-5 mr-2 text-cosmic-300" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium flex items-center">
                {t("Bortle Scale", "波尔特等级")}:
                <Info className="h-3.5 w-3.5 ml-1 text-cosmic-400 inline-block" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-cosmic-800 border-cosmic-600">
              <p className="text-xs text-cosmic-100">
                {getBortleDescription(bortleScale || 5, t)}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="ml-auto font-semibold text-cosmic-50">
          {bortleScale || "-"}
        </span>
      </div>
      
      {aqi !== undefined && (
        <div className="flex items-center">
          <CircleAlert className="h-5 w-5 mr-2 text-cosmic-300" />
          <span className="font-medium">{t("Air Quality", "空气质量")}: </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`ml-auto font-semibold ${getAqiInfo(aqi).color}`}>
                  {aqi} ({getAqiInfo(aqi).label})
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-cosmic-800 border-cosmic-600">
                <p className="text-xs text-cosmic-100">
                  {t(
                    "European Air Quality Index (1-100+). Lower is better.", 
                    "欧洲空气质量指数 (1-100+)。越低越好。"
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

export default SecondaryConditions;
