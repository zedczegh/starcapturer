
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Thermometer, Wind } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeatherConditionsProps {
  weatherData: {
    temperature: number;
    humidity: number;
    cloudCover: number;
    windSpeed: number;
    precipitation: number;
    time: string;
    condition: string;
  };
  moonPhase: string;
  bortleScale: number;
  seeingConditions: string;
}

const WeatherConditions: React.FC<WeatherConditionsProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
}) => {
  const { t } = useLanguage();
  
  const formatBortleScale = (value: number) => {
    if (value <= 1) return `1 (${t("Excellent Dark", "极暗")})`;
    if (value <= 3) return `${value} (${t("Very Dark", "很暗")})`;
    if (value <= 5) return `${value} (${t("Suburban", "郊区")})`;
    if (value <= 7) return `${value} (${t("Bright Suburban", "明亮郊区")})`;
    return `${value} (${t("City", "城市")})`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{t("Current Conditions", "当前状况")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="mr-2 rounded-full bg-primary/10 p-1">
                <Thermometer className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("Temperature", "温度")}</p>
                <p className="text-lg font-bold">
                  {weatherData.temperature.toFixed(1)}°C
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 rounded-full bg-primary/10 p-1">
                <Droplets className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("Humidity", "湿度")}</p>
                <p className="text-lg font-bold">{weatherData.humidity}%</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 rounded-full bg-primary/10 p-1">
                <Wind className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("Wind Speed", "风速")}</p>
                <p className="text-lg font-bold">{weatherData.windSpeed} km/h</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="mr-2 rounded-full bg-primary/10 p-1">
                <Cloud className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("Cloud Cover", "云层覆盖")}</p>
                <p className="text-lg font-bold">{weatherData.cloudCover}%</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-2 rounded-full bg-primary/10 p-1">
                <MoonPhaseIcon />
              </div>
              <div>
                <p className="text-sm font-medium">{t("Moon Phase", "月相")}</p>
                <p className="text-lg font-bold">{moonPhase}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">{t("Bortle Scale", "波尔特尔暗度等级")}</p>
                <p className="text-lg font-bold">{formatBortleScale(bortleScale)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">{t("Seeing Conditions", "视宁度")}</p>
                <p className="text-lg font-bold">{seeingConditions}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MoonPhaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export default WeatherConditions;
