
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, Droplets, Cloud, Wind } from "lucide-react";
import { getWeatherIcon } from "@/utils/weatherIcons";

interface WeatherDataSectionProps {
  locationData: any;
  language: string;
  t: any;
}

const WeatherDataSection: React.FC<WeatherDataSectionProps> = ({ locationData, language, t }) => {
  if (!locationData.weatherData) {
    return null;
  }

  const { weatherData } = locationData;
  const WeatherIcon = getWeatherIcon(weatherData.weatherCondition || "cloudy");

  return (
    <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
      <h2 className="text-xl font-bold mb-4">{t ? t("Current Weather", "当前天气") : "Current Weather"}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {/* Temperature */}
        <Card className="bg-cosmic-800/60 border-cosmic-700">
          <CardContent className="p-4 flex flex-col items-center">
            <Thermometer className="h-8 w-8 mb-2 text-blue-400" />
            <div className="text-lg font-semibold">
              {Math.round(weatherData.temperature)}°C
            </div>
            <div className="text-xs text-muted-foreground">
              {t ? t("Temperature", "温度") : "Temperature"}
            </div>
          </CardContent>
        </Card>

        {/* Humidity */}
        <Card className="bg-cosmic-800/60 border-cosmic-700">
          <CardContent className="p-4 flex flex-col items-center">
            <Droplets className="h-8 w-8 mb-2 text-blue-400" />
            <div className="text-lg font-semibold">
              {weatherData.humidity}%
            </div>
            <div className="text-xs text-muted-foreground">
              {t ? t("Humidity", "湿度") : "Humidity"}
            </div>
          </CardContent>
        </Card>

        {/* Cloud Cover */}
        <Card className="bg-cosmic-800/60 border-cosmic-700">
          <CardContent className="p-4 flex flex-col items-center">
            <Cloud className="h-8 w-8 mb-2 text-blue-400" />
            <div className="text-lg font-semibold">
              {weatherData.cloudCover}%
            </div>
            <div className="text-xs text-muted-foreground">
              {t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover"}
            </div>
          </CardContent>
        </Card>

        {/* Wind Speed */}
        <Card className="bg-cosmic-800/60 border-cosmic-700">
          <CardContent className="p-4 flex flex-col items-center">
            <Wind className="h-8 w-8 mb-2 text-blue-400" />
            <div className="text-lg font-semibold">
              {weatherData.windSpeed} km/h
            </div>
            <div className="text-xs text-muted-foreground">
              {t ? t("Wind Speed", "风速") : "Wind Speed"}
            </div>
          </CardContent>
        </Card>

        {/* Condition */}
        <Card className="bg-cosmic-800/60 border-cosmic-700">
          <CardContent className="p-4 flex flex-col items-center">
            <WeatherIcon className="h-8 w-8 mb-2 text-blue-400" />
            <div className="text-lg font-semibold truncate max-w-full">
              {weatherData.weatherCondition || (weatherData.cloudCover > 50 ? 
                (t ? t("Cloudy", "多云") : "Cloudy") : 
                (t ? t("Clear", "晴朗") : "Clear"))}
            </div>
            <div className="text-xs text-muted-foreground">
              {t ? t("Condition", "天气状况") : "Condition"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeatherDataSection;
