
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import WeatherProperty from "./WeatherProperty";
import { Wifi, ThermometerSnowflake, Wind, Droplets, Sun } from "lucide-react";
import { getAQIDescription, getSeeingConditionInChinese } from "@/utils/weatherUtils";

interface SecondaryConditionsProps {
  moonIllumination?: number | null;
  seeing?: number | null;
  cloudCover?: number | null;
  windSpeed?: number | null;
  humidity?: number | null;
  visibility?: number | null;
  aqi?: number | null;
  temperature?: number | null;
  seaLevelPressure?: number | null;
  compact?: boolean;
}

const SecondaryConditions: React.FC<SecondaryConditionsProps> = ({
  moonIllumination,
  seeing,
  cloudCover,
  windSpeed,
  humidity,
  visibility,
  aqi,
  temperature,
  seaLevelPressure,
  compact = false
}) => {
  const { language, t } = useLanguage();
  
  // Convert seeing value to descriptive text
  const getSeeingDescription = (value: number): string => {
    if (value <= 2) return "Poor";
    if (value <= 3) return "Fair";
    if (value <= 4) return "Good";
    return "Excellent";
  };
  
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      {aqi !== undefined && aqi !== null && (
        <WeatherProperty 
          icon={<Wifi className="h-3.5 w-3.5" />} 
          label={t("Air Quality", "空气质量")}
          value={`${getAQIDescription(aqi, language === 'zh' ? 'zh' : 'en')}`} 
          tooltip={t("Air Quality Index", "空气质量指数")}
        />
      )}
      
      {seeing !== undefined && seeing !== null && (
        <WeatherProperty 
          icon={<Sun className="h-3.5 w-3.5" />} 
          label={t("Seeing", "视宁度")}
          value={language === 'zh' ? 
            getSeeingConditionInChinese(getSeeingDescription(seeing)) : 
            getSeeingDescription(seeing)} 
          tooltip={t("Astronomical seeing conditions", "天文视宁度条件")}
        />
      )}
      
      {cloudCover !== undefined && cloudCover !== null && (
        <WeatherProperty 
          icon={<Sun className="h-3.5 w-3.5" />} 
          label={t("Cloud Cover", "云量")}
          value={`${cloudCover}%`} 
          tooltip={t("Percentage of sky covered by clouds", "云覆盖天空的百分比")}
        />
      )}
      
      {windSpeed !== undefined && windSpeed !== null && (
        <WeatherProperty 
          icon={<Wind className="h-3.5 w-3.5" />} 
          label={t("Wind", "风速")}
          value={`${windSpeed} ${t("km/h", "公里/时")}`} 
          tooltip={t("Wind speed", "风速")}
        />
      )}
      
      {humidity !== undefined && humidity !== null && (
        <WeatherProperty 
          icon={<Droplets className="h-3.5 w-3.5" />} 
          label={t("Humidity", "湿度")}
          value={`${humidity}%`} 
          tooltip={t("Relative humidity", "相对湿度")}
        />
      )}
      
      {temperature !== undefined && temperature !== null && (
        <WeatherProperty 
          icon={<ThermometerSnowflake className="h-3.5 w-3.5" />} 
          label={t("Temperature", "温度")}
          value={`${temperature}°C`} 
          tooltip={t("Current temperature", "当前温度")}
        />
      )}
    </div>
  );
};

export default SecondaryConditions;
