
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Eye, Lightbulb, Thermometer, Wind, Gauge } from "lucide-react";
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
    aqi?: number;  // Added AQI
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
  const { language, t } = useLanguage();
  
  const formatBortleScale = (value: number) => {
    if (value <= 1) return `1 (${t("Excellent Dark", "极暗")})`;
    if (value <= 3) return `${value.toFixed(1)} (${t("Very Dark", "很暗")})`;
    if (value <= 5) return `${value.toFixed(1)} (${t("Suburban", "郊区")})`;
    if (value <= 7) return `${value.toFixed(1)} (${t("Bright Suburban", "明亮郊区")})`;
    return `${value.toFixed(1)} (${t("City", "城市")})`;
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "text-green-400";
    if (aqi <= 100) return "text-yellow-400";
    if (aqi <= 150) return "text-orange-400";
    if (aqi <= 200) return "text-red-400";
    if (aqi <= 300) return "text-purple-400";
    return "text-rose-700";
  };

  const getAQIDescription = (aqi: number) => {
    if (aqi <= 50) return t("Good", "优");
    if (aqi <= 100) return t("Moderate", "中等");
    if (aqi <= 150) return t("Unhealthy for Sensitive Groups", "对敏感人群不健康");
    if (aqi <= 200) return t("Unhealthy", "不健康");
    if (aqi <= 300) return t("Very Unhealthy", "非常不健康");
    return t("Hazardous", "危险");
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
                <p className="text-lg font-bold">{weatherData.windSpeed} {t("km/h", "公里/小时")}</p>
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
                <p className="text-lg font-bold">{t(moonPhase, getMoonPhaseInChinese(moonPhase))}</p>
              </div>
            </div>
            
            {weatherData.aqi !== undefined && (
              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <div className="mr-2 rounded-full bg-cosmic-700/50 p-1.5 group-hover:bg-primary/20 transition-colors">
                  <Gauge className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cosmic-200">{t("Air Quality", "空气质量")}</p>
                  <p className="text-lg font-bold">
                    <span className={getAQIColor(weatherData.aqi)}>
                      {weatherData.aqi} 
                    </span> 
                    <span className="text-sm ml-1">({getAQIDescription(weatherData.aqi)})</span>
                  </p>
                </div>
              </div>
            )}
            
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
                  <p className="text-lg font-bold">{t(seeingConditions, getSeeingConditionInChinese(seeingConditions))}</p>
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

// Helper functions for Chinese translations
function getMoonPhaseInChinese(phase: string): string {
  const translations: { [key: string]: string } = {
    "New Moon": "新月",
    "Waxing Crescent": "眉月",
    "First Quarter": "上弦月",
    "Waxing Gibbous": "盈凸月",
    "Full Moon": "满月",
    "Waning Gibbous": "亏凸月",
    "Last Quarter": "下弦月",
    "Waning Crescent": "残月",
    "Unknown": "未知"
  };
  return translations[phase] || phase;
}

function getSeeingConditionInChinese(condition: string): string {
  const translations: { [key: string]: string } = {
    "Excellent": "极佳",
    "Good": "良好",
    "Average": "一般",
    "Poor": "较差",
    "Very Poor": "非常差"
  };
  return translations[condition] || condition;
}

export default WeatherConditions;
