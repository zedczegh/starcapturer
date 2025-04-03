
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeatherFactorsProps {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  weatherCondition: string;
  moonPhase: string;
  bortleScale: number | null;
  seeingConditions: string;
  aqi?: number;
  nighttimeCloudData: {
    average: number | null;
    evening: number | null;
    morning: number | null;
  } | null;
}

const WeatherFactors: React.FC<WeatherFactorsProps> = ({
  temperature,
  humidity,
  cloudCover,
  windSpeed,
  weatherCondition,
  moonPhase,
  bortleScale,
  seeingConditions,
  aqi,
  nighttimeCloudData
}) => {
  const { language, t } = useLanguage();

  return (
    <div className="space-y-2">
      <div className="text-sm">
        <span className="font-medium">{t("Temperature", "温度")}:</span>{" "}
        <span>{temperature}°C</span>
      </div>

      <div className="text-sm">
        <span className="font-medium">{t("Humidity", "湿度")}:</span>{" "}
        <span>{humidity}%</span>
      </div>

      <div className="text-sm">
        <span className="font-medium">{t("Wind Speed", "风速")}:</span>{" "}
        <span>{windSpeed} km/h</span>
      </div>

      <div className="text-sm">
        <span className="font-medium">{t("Cloud Cover", "云层覆盖")}:</span>{" "}
        <span>{cloudCover}%</span>
      </div>
      
      {nighttimeCloudData && nighttimeCloudData.average !== null && (
        <div className="text-sm">
          <span className="font-medium">{t("Nighttime Clouds", "夜间云层")}:</span>{" "}
          <span className="text-yellow-300">{nighttimeCloudData.average.toFixed(1)}%</span>{" "}
          <span className="text-xs text-muted-foreground">
            ({t("Evening", "晚上")}: {nighttimeCloudData.evening?.toFixed(1)}%, 
            {t("Morning", "早上")}: {nighttimeCloudData.morning?.toFixed(1)}%)
          </span>
        </div>
      )}

      <div className="text-sm">
        <span className="font-medium">{t("Seeing", "视宁度")}:</span>{" "}
        <span>{seeingConditions}</span>
      </div>

      <div className="text-sm">
        <span className="font-medium">{t("Moon Phase", "月相")}:</span>{" "}
        <span>{moonPhase}</span>
      </div>

      {bortleScale && (
        <div className="text-sm">
          <span className="font-medium">{t("Bortle Scale", "波特尔指数")}:</span>{" "}
          <span>{bortleScale}</span>
        </div>
      )}

      {aqi !== undefined && (
        <div className="text-sm">
          <span className="font-medium">{t("Air Quality", "空气质量")}:</span>{" "}
          <span>{aqi}</span>
        </div>
      )}
    </div>
  );
};

export default WeatherFactors;
