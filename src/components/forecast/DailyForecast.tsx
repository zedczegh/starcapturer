
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { RefreshCw, Sun, Cloud, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, getShortDayOfWeek, isToday } from "@/utils/dateUtils";
import { DynamicCloudCoverIcon, DynamicWindIcon } from "@/components/weather/DynamicIcons";

interface DailyForecastProps {
  forecastData: any;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const DailyForecast: React.FC<DailyForecastProps> = ({
  forecastData,
  isLoading = false,
  onRefresh
}) => {
  const { t, language } = useLanguage();

  if (isLoading) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t("Daily Forecast", "日预报")}</CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse">
          <Skeleton className="h-[200px] w-full bg-cosmic-700/20" />
        </CardContent>
      </Card>
    );
  }

  // Check if we have valid forecast data
  const hasValidData = forecastData && 
    forecastData.daily && 
    Array.isArray(forecastData.daily.time) && 
    forecastData.daily.time.length > 0;

  if (!hasValidData) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-gradient-blue">{t("Daily Forecast", "日预报")}</CardTitle>
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
          <p className="text-muted-foreground">{t("No daily forecast data available", "无日预报数据")}</p>
        </CardContent>
      </Card>
    );
  }

  const dailyData = [];
  const days = Math.min(forecastData.daily.time.length, 7); // Show up to 7 days
  
  for (let i = 0; i < days; i++) {
    dailyData.push({
      date: forecastData.daily.time[i],
      tempMax: forecastData.daily.temperature_2m_max?.[i],
      tempMin: forecastData.daily.temperature_2m_min?.[i],
      cloudCover: forecastData.daily.cloud_cover_mean?.[i],
      precipitation: forecastData.daily.precipitation_sum?.[i],
      precipitationProb: forecastData.daily.precipitation_probability_max?.[i],
      windSpeed: forecastData.daily.wind_speed_10m_max?.[i]
    });
  }

  return (
    <Card className="shadow-md border-cosmic-700/30 hover:border-cosmic-600/60 transition-all duration-300">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-gradient-blue">{t("Daily Forecast", "日预报")}</CardTitle>
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
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-cosmic-700/20">
          {dailyData.map((day, index) => (
            <div 
              key={index} 
              className={`p-3 grid grid-cols-5 items-center ${
                isToday(day.date) ? 'bg-cosmic-700/10' : ''
              }`}
            >
              <div className="col-span-1">
                <div className="font-medium">
                  {isToday(day.date) 
                    ? t("Today", "今天") 
                    : getShortDayOfWeek(day.date, language)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(day.date, 'MMM d', language)}
                </div>
              </div>
              
              <div className="col-span-1 flex items-center justify-center">
                <Sun className="h-4 w-4 mr-1 text-amber-400" />
                <span className="text-sm">
                  {day.tempMax !== undefined && day.tempMin !== undefined
                    ? `${day.tempMin.toFixed(0)}°-${day.tempMax.toFixed(0)}°`
                    : ''}
                </span>
              </div>
              
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="flex items-center">
                  <DynamicCloudCoverIcon cloudCover={day.cloudCover} className="h-4 w-4 mr-1" />
                  <span className="text-sm">{day.cloudCover !== undefined ? `${day.cloudCover}%` : ''}</span>
                </div>
              </div>
              
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="flex items-center">
                  <Droplets className="h-4 w-4 mr-1 text-blue-400" />
                  <span className="text-sm">
                    {day.precipitation !== undefined ? `${day.precipitation.toFixed(1)}mm` : ''}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {day.precipitationProb !== undefined ? `${day.precipitationProb}%` : ''}
                </div>
              </div>
              
              <div className="col-span-1 flex items-center justify-center">
                <DynamicWindIcon windSpeed={day.windSpeed} className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {day.windSpeed !== undefined ? `${day.windSpeed.toFixed(1)} km/h` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyForecast;
