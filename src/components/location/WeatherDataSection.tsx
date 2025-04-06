
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getWeatherIcon } from "@/utils/weatherIcons";

interface WeatherDataSectionProps {
  locationData: any;
  language: string;
  t: any;
}

const WeatherDataSection: React.FC<WeatherDataSectionProps> = ({
  locationData,
  language,
  t
}) => {
  const weatherData = locationData.weatherData;
  
  if (!weatherData) {
    return null;
  }
  
  const WeatherIcon = getWeatherIcon(
    weatherData.weatherCondition || 'clear',
    new Date().getHours()
  );
  
  return (
    <div className="bg-cosmic-900/70 p-4 sm:p-6 rounded-lg shadow-lg backdrop-blur-md">
      <h2 className="text-xl font-bold mb-4">
        {t ? t("Current Weather", "当前天气") : "Current Weather"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weather Condition */}
        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t ? t("Condition", "天气状况") : "Condition"}
              </p>
              <p className="text-lg font-semibold">
                {weatherData.weatherConditionText || 
                  (t ? t(weatherData.weatherCondition || "Unknown", "未知") : weatherData.weatherCondition || "Unknown")}
              </p>
            </div>
            {WeatherIcon && <WeatherIcon className="h-8 w-8 text-primary" />}
          </CardContent>
        </Card>
        
        {/* Temperature */}
        {weatherData.temperature !== undefined && (
          <Card className="bg-cosmic-800/40 border-cosmic-700/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t ? t("Temperature", "温度") : "Temperature"}
              </p>
              <p className="text-lg font-semibold">
                {weatherData.temperature}°{language === 'en' ? 'C' : '摄氏度'}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Cloud Cover */}
        <Card className="bg-cosmic-800/40 border-cosmic-700/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">
              {t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover"}
            </p>
            <p className="text-lg font-semibold">{weatherData.cloudCover}%</p>
          </CardContent>
        </Card>
        
        {/* Humidity */}
        {weatherData.humidity !== undefined && (
          <Card className="bg-cosmic-800/40 border-cosmic-700/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t ? t("Humidity", "湿度") : "Humidity"}
              </p>
              <p className="text-lg font-semibold">{weatherData.humidity}%</p>
            </CardContent>
          </Card>
        )}
        
        {/* Wind Speed */}
        {weatherData.windSpeed !== undefined && (
          <Card className="bg-cosmic-800/40 border-cosmic-700/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t ? t("Wind Speed", "风速") : "Wind Speed"}
              </p>
              <p className="text-lg font-semibold">{weatherData.windSpeed} km/h</p>
            </CardContent>
          </Card>
        )}
        
        {/* Air Quality (AQI) */}
        {weatherData.aqi !== undefined && (
          <Card className="bg-cosmic-800/40 border-cosmic-700/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t ? t("Air Quality (AQI)", "空气质量 (AQI)") : "Air Quality (AQI)"}
              </p>
              <p className="text-lg font-semibold">{weatherData.aqi}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Clear Sky Rate */}
        {weatherData.clearSkyRate !== undefined && (
          <Card className="bg-cosmic-800/40 border-cosmic-700/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t ? t("Annual Clear Sky Rate", "年平均晴空率") : "Annual Clear Sky Rate"}
              </p>
              <p className="text-lg font-semibold">{weatherData.clearSkyRate}%</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WeatherDataSection;
