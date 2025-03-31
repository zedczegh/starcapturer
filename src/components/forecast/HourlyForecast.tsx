
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/utils/dateUtils";
import { DynamicCloudCoverIcon, DynamicWindIcon, DynamicHumidityIcon } from "@/components/weather/DynamicIcons";

interface HourlyForecastProps {
  forecastData: any;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const HourlyForecast: React.FC<HourlyForecastProps> = ({ 
  forecastData, 
  isLoading = false,
  onRefresh
}) => {
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t("Hourly Forecast", "小时预报")}</CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse">
          <Skeleton className="h-[200px] w-full bg-cosmic-700/20" />
        </CardContent>
      </Card>
    );
  }

  // Check if we have valid forecast data
  const hasValidData = forecastData && 
    forecastData.hourly && 
    Array.isArray(forecastData.hourly.time) && 
    forecastData.hourly.time.length > 0;

  if (!hasValidData) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-gradient-blue">{t("Hourly Forecast", "小时预报")}</CardTitle>
            {onRefresh && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRefresh} 
                className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
                title={t("Refresh Forecast", "刷新预报")}
              >
                <RefreshCw className="h-4 w-4 hover:animate-spin transition-all duration-700" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">{t("No hourly forecast data available", "无小时预报数据")}</p>
        </CardContent>
      </Card>
    );
  }

  // Process forecast data for display - next 24 hours
  const currentDate = new Date();
  const hourlyData = [];
  
  for (let i = 0; i < forecastData.hourly.time.length && hourlyData.length < 24; i++) {
    const forecastTime = new Date(forecastData.hourly.time[i]);
    
    // Only include future forecasts
    if (forecastTime > currentDate) {
      hourlyData.push({
        time: forecastData.hourly.time[i],
        temperature: forecastData.hourly.temperature_2m?.[i],
        weatherCode: forecastData.hourly.weather_code?.[i],
        cloudCover: forecastData.hourly.cloud_cover?.[i],
        humidity: forecastData.hourly.relative_humidity_2m?.[i],
        windSpeed: forecastData.hourly.wind_speed_10m?.[i],
        precipitation: forecastData.hourly.precipitation?.[i]
      });
    }
  }

  return (
    <Card className="shadow-md border-cosmic-700/30 hover:border-cosmic-600/60 transition-all duration-300">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-gradient-blue">{t("Hourly Forecast", "小时预报")}</CardTitle>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh} 
              className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
              title={t("Refresh Forecast", "刷新预报")}
            >
              <RefreshCw className="h-4 w-4 hover:animate-spin transition-all duration-700" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div className="flex p-4 space-x-4 min-w-max">
          {hourlyData.map((hour, index) => (
            <div key={index} className="flex flex-col items-center min-w-[70px]">
              <div className="text-sm font-medium mb-1">
                {formatTime(hour.time, 'HH:mm', language)}
              </div>
              <div className="text-lg font-bold">
                {hour.temperature !== undefined ? `${hour.temperature.toFixed(1)}°` : ''}
              </div>
              <div className="my-2">
                <DynamicCloudCoverIcon cloudCover={hour.cloudCover} className="h-6 w-6" />
              </div>
              <div className="text-xs text-muted-foreground">
                {hour.cloudCover !== undefined ? `${hour.cloudCover}%` : ''}
              </div>
              <div className="flex items-center space-x-1 mt-2">
                <DynamicWindIcon windSpeed={hour.windSpeed} className="h-4 w-4" />
                <span className="text-xs">{hour.windSpeed !== undefined ? `${hour.windSpeed}` : ''}</span>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <DynamicHumidityIcon humidity={hour.humidity} className="h-4 w-4" />
                <span className="text-xs">{hour.humidity !== undefined ? `${hour.humidity}%` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HourlyForecast;
