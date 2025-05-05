
import React, { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ThermometerSun, 
  Droplets, 
  Wind, 
  Eye 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PrimaryConditionsProps {
  temperature: number;
  humidity: number;
  windSpeed: number;
  seeingConditions: string;
}

const PrimaryConditions = memo<PrimaryConditionsProps>(({
  temperature,
  humidity,
  windSpeed,
  seeingConditions
}) => {
  const { t } = useLanguage();
  
  // Helper to get appropriate color based on values
  const getTemperatureColor = (temp: number) => {
    if (temp <= 0) return "text-blue-300";
    if (temp <= 10) return "text-cyan-300";
    if (temp <= 20) return "text-green-400";
    if (temp <= 30) return "text-yellow-400";
    return "text-orange-400";
  };
  
  const getHumidityColor = (humid: number) => {
    if (humid <= 30) return "text-green-400";
    if (humid <= 60) return "text-blue-400";
    if (humid <= 80) return "text-blue-300";
    return "text-blue-200";
  };
  
  const getWindColor = (wind: number) => {
    if (wind <= 10) return "text-green-400";
    if (wind <= 20) return "text-yellow-400";
    if (wind <= 30) return "text-orange-400";
    return "text-red-400";
  };
  
  const getSeeingColor = (seeing: string) => {
    const lowerSee = seeing.toLowerCase();
    if (lowerSee.includes("excellent") || lowerSee.includes("优秀")) return "text-green-400";
    if (lowerSee.includes("good") || lowerSee.includes("良好")) return "text-lime-400";
    if (lowerSee.includes("average") || lowerSee.includes("一般")) return "text-yellow-400";
    if (lowerSee.includes("poor") || lowerSee.includes("差")) return "text-orange-400";
    return "text-red-400";
  };
  
  return (
    <div className="grid grid-cols-1 gap-3">
      <TooltipProvider>
        {/* Temperature */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
              <ThermometerSun className="h-4 w-4 text-cosmic-200" />
            </div>
            <span className="font-medium text-xs">{t("Temperature", "温度")}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`font-bold text-sm ${getTemperatureColor(temperature)}`}>
                {temperature.toFixed(1)}°C
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {t("Current air temperature", "当前气温")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Humidity */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
              <Droplets className="h-4 w-4 text-cosmic-200" />
            </div>
            <span className="font-medium text-xs">{t("Humidity", "湿度")}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`font-bold text-sm ${getHumidityColor(humidity)}`}>
                {humidity}%
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {t("Relative humidity in the air", "空气相对湿度")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Wind Speed */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
              <Wind className="h-4 w-4 text-cosmic-200" />
            </div>
            <span className="font-medium text-xs">{t("Wind Speed", "风速")}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`font-bold text-sm ${getWindColor(windSpeed)}`}>
                {windSpeed} {t("km/h", "公里/小时")}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {t("Current wind speed", "当前风速")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Seeing Conditions */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cosmic-800/40 border border-cosmic-700/50 hover:bg-cosmic-800/60 transition-colors">
          <div className="flex items-center">
            <div className="p-1.5 rounded-full bg-cosmic-700/40 mr-2">
              <Eye className="h-4 w-4 text-cosmic-200" />
            </div>
            <span className="font-medium text-xs">{t("Seeing Conditions", "视宁度")}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`font-bold text-sm ${getSeeingColor(seeingConditions)}`}>
                {seeingConditions}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-cosmic-800 border-cosmic-700">
              <p className="text-xs">
                {t("Atmospheric stability for imaging", "成像大气稳定性")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
});

PrimaryConditions.displayName = 'PrimaryConditions';

export default PrimaryConditions;
