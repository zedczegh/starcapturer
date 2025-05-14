
import React, { memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ThermometerSun, 
  Droplets, 
  Wind, 
  Eye 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";

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
    <Card className="p-4 bg-cosmic-900/50 border-cosmic-800">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="bg-cosmic-800/50 p-2 rounded-full">
              <ThermometerSun className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium">
                {t('Observing Conditions', '观测条件')}
              </h3>
            </div>
          </div>
        </div>

        <TooltipProvider>
          {/* Temperature */}
          <div className="space-y-1 border-b border-cosmic-700/30 pb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ThermometerSun className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-medium">{t("Temperature", "温度")}</span>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-sm font-medium ${getTemperatureColor(temperature)}`}>
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
          </div>
          
          {/* Humidity */}
          <div className="space-y-1 border-b border-cosmic-700/30 pb-2 pt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium">{t("Humidity", "湿度")}</span>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-sm font-medium ${getHumidityColor(humidity)}`}>
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
          </div>
          
          {/* Wind Speed */}
          <div className="space-y-1 border-b border-cosmic-700/30 pb-2 pt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-medium">{t("Wind Speed", "风速")}</span>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-sm font-medium ${getWindColor(windSpeed)}`}>
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
          </div>
          
          {/* Seeing Conditions */}
          <div className="space-y-1 pt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium">{t("Seeing Conditions", "视宁度")}</span>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`text-sm font-medium ${getSeeingColor(seeingConditions)}`}>
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
          </div>
        </TooltipProvider>
      </div>
    </Card>
  );
});

PrimaryConditions.displayName = 'PrimaryConditions';

export default PrimaryConditions;
