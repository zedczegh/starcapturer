
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Eye, Lightbulb, Thermometer, Wind } from "lucide-react";
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
    <Card className="glassmorphism border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gradient-blue">{t("Current Conditions", "当前状况")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="flex items-start group hover:scale-105 transition-transform duration-300">
              <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
                <Thermometer className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-cosmic-200">{t("Temperature", "温度")}</p>
                <p className="text-lg font-bold">
                  {weatherData.temperature.toFixed(1)}°C
                </p>
              </div>
            </div>
            
            <div className="flex items-start group hover:scale-105 transition-transform duration-300">
              <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
                <Droplets className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-cosmic-200">{t("Humidity", "湿度")}</p>
                <p className="text-lg font-bold">{weatherData.humidity}%</p>
              </div>
            </div>
            
            <div className="flex items-start group hover:scale-105 transition-transform duration-300">
              <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
                <Wind className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-cosmic-200">{t("Wind Speed", "风速")}</p>
                <p className="text-lg font-bold">{weatherData.windSpeed} km/h</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start group hover:scale-105 transition-transform duration-300">
              <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
                <Cloud className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-cosmic-200">{t("Cloud Cover", "云层覆盖")}</p>
                <p className="text-lg font-bold">{weatherData.cloudCover}%</p>
              </div>
            </div>
            
            <div className="flex items-start group hover:scale-105 transition-transform duration-300">
              <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
                <MoonPhaseIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-cosmic-200">{t("Moon Phase", "月相")}</p>
                <p className="text-lg font-bold">{moonPhase}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cosmic-200">{t("Bortle Scale", "光污染等级")}</p>
                  <p className="text-lg font-bold">{formatBortleScale(bortleScale)}</p>
                </div>
              </div>
              
              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cosmic-200">{t("Seeing Conditions", "视宁度")}</p>
                  <p className="text-lg font-bold">{seeingConditions}</p>
                </div>
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
