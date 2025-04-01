
import React, { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  DynamicPrecipitationIcon, 
  DynamicTemperatureIcon, 
  DynamicCloudCoverIcon, 
  DynamicWindIcon, 
  DynamicHumidityIcon 
} from "@/components/weather/DynamicIcons";
import { getSIQSRating, formatCondition, formatDate, formatTime } from "@/components/forecast/ForecastUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ForecastTableProps {
  forecastData: any;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ForecastTable: React.FC<ForecastTableProps> = React.memo(({ 
  forecastData, 
  isLoading = false,
  onRefresh
}) => {
  const { t } = useLanguage();

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
      toast.info(t("Refreshing forecast data...", "正在刷新预报数据..."));
    }
  }, [onRefresh, t]);

  const generateFallbackForecasts = useCallback(() => {
    const now = new Date();
    const forecasts = [];
    
    // Generate 24 hours of fallback data instead of just 8
    for (let i = 0; i < 24; i++) {
      const forecastTime = new Date(now);
      forecastTime.setHours(now.getHours() + i);
      
      forecasts.push({
        time: forecastTime.toISOString(),
        temperature: 22 + Math.round(Math.random() * 8),
        humidity: 60 + Math.round(Math.random() * 30),
        cloudCover: Math.round(Math.random() * 100),
        windSpeed: 5 + Math.round(Math.random() * 15),
        precipitation: Math.random() * 0.5,
      });
    }
    
    return forecasts;
  }, []);

  // Filter forecasts to only show future data (24 hours)
  const forecasts = useMemo(() => {
    const isForecastDataValid = forecastData && 
                            forecastData.hourly && 
                            Array.isArray(forecastData.hourly.time) && 
                            forecastData.hourly.time.length > 0;
    
    if (!isForecastDataValid) {
      return generateFallbackForecasts();
    }
    
    try {
      const result = [];
      const now = new Date();
      
      // Find the starting index for future data
      let startIndex = 0;
      for (let i = 0; i < forecastData.hourly.time.length; i++) {
        const forecastTime = new Date(forecastData.hourly.time[i]);
        if (forecastTime >= now) {
          startIndex = i;
          break;
        }
      }
      
      // Get the next 24 hours of data from the current time
      for (let i = startIndex; i < Math.min(startIndex + 24, forecastData.hourly.time.length); i++) {
        if (i < forecastData.hourly.time.length) {
          result.push({
            time: forecastData.hourly.time[i] || new Date().toISOString(),
            temperature: forecastData.hourly.temperature_2m?.[i] ?? 22,
            humidity: forecastData.hourly.relative_humidity_2m?.[i] ?? 60,
            cloudCover: forecastData.hourly.cloud_cover?.[i] ?? 30,
            windSpeed: forecastData.hourly.wind_speed_10m?.[i] ?? 5,
            precipitation: forecastData.hourly.precipitation?.[i] ?? 0,
            weatherCode: forecastData.hourly.weather_code?.[i] ?? 0
          });
        }
      }
      
      if (result.length > 0) {
        return result;
      }
    } catch (error) {
      console.error("Error processing forecast data:", error);
    }
    
    return generateFallbackForecasts();
  }, [forecastData, generateFallbackForecasts]);

  const getWeatherClass = useCallback((precipitation: number, cloudCover: number) => {
    if (precipitation > 0.5) return "bg-red-500/10 animate-pulse";
    if (cloudCover < 20) return "bg-green-500/10 animate-pulse";
    return "";
  }, []);
  
  // Check for extreme weather conditions
  const extremeWeatherAlerts = useMemo(() => {
    const alerts = [];
    
    // Check for dangerous weather codes
    const dangerousCodes = [95, 96, 99]; // Thunderstorms and hail
    const severeCodes = [71, 73, 75, 77, 85, 86]; // Heavy snow, blizzards
    const desertStormCodes = [48, 56, 57, 66, 67]; // Sandstorms and dust storms
    
    for (const forecast of forecasts) {
      const { weatherCode, windSpeed, precipitation } = forecast;
      
      // Check severe thunderstorms
      if (dangerousCodes.includes(weatherCode)) {
        alerts.push({
          type: "severe",
          message: t("Thunderstorm with possible hail detected", "检测到雷暴可能伴有冰雹"),
          time: forecast.time,
          icon: "thunderstorm"
        });
      }
      
      // Check heavy snow conditions
      if (severeCodes.includes(weatherCode)) {
        alerts.push({
          type: "warning",
          message: t("Heavy snow or blizzard conditions expected", "预计有大雪或暴风雪"),
          time: forecast.time,
          icon: "snow"
        });
      }
      
      // Check dust/sandstorms
      if (desertStormCodes.includes(weatherCode)) {
        alerts.push({
          type: "warning",
          message: t("Fog or freezing conditions expected", "预计有雾或结冰情况"),
          time: forecast.time,
          icon: "fog"
        });
      }
      
      // Check extreme wind
      if (windSpeed > 60) {
        alerts.push({
          type: "severe",
          message: t("Dangerous wind conditions detected", "检测到危险的风力条件"),
          time: forecast.time,
          icon: "wind"
        });
      }
      
      // Check heavy rain
      if (precipitation > 10) {
        alerts.push({
          type: "warning",
          message: t("Heavy rainfall expected", "预计有大雨"),
          time: forecast.time,
          icon: "rain"
        });
      }
    }
    
    // Return unique alerts (avoid duplicates)
    return alerts.filter((alert, index, self) => 
      index === self.findIndex(a => a.message === alert.message)
    );
  }, [forecasts, t]);

  if (isLoading) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t("Weather Forecast", "天气预报")}</CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse">
          <Skeleton className="h-[300px] w-full bg-cosmic-700/20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-cosmic-700/30 hover:border-cosmic-600/60 transition-all duration-300">
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-gradient-blue">{t("Weather Forecast", "天气预报")}</CardTitle>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
              title={t("Refresh Forecast", "刷新预报")}
            >
              <RefreshCw className="h-4 w-4 hover:animate-spin transition-all duration-700" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {extremeWeatherAlerts.length > 0 && (
        <div className="px-4 pt-3 animate-fade-in">
          {extremeWeatherAlerts.map((alert, index) => (
            <Alert 
              key={index} 
              variant={alert.type === "severe" ? "destructive" : "warning"}
              className="mb-2 animate-pulse border border-amber-500/50 bg-amber-500/10"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription className="flex items-center">
                <span>{alert.message}</span>
                <span className="ml-2 text-xs opacity-80">
                  {formatTime(alert.time)} {formatDate(alert.time)}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-cosmic-800/40 hover:bg-cosmic-800/60">
                <TableHead className="py-3">{t("Time", "时间")}</TableHead>
                <TableHead className="text-center">
                  <DynamicTemperatureIcon temperature={20} className="inline h-4 w-4 mr-1" />
                  {t("Temp", "温度")}
                </TableHead>
                <TableHead className="text-center">
                  <DynamicCloudCoverIcon cloudCover={50} className="inline h-4 w-4 mr-1" />
                  {t("Clouds", "云层")}
                </TableHead>
                <TableHead className="text-center">
                  <DynamicWindIcon windSpeed={15} className="inline h-4 w-4 mr-1" />
                  {t("Wind", "风速")}
                </TableHead>
                <TableHead className="text-center">
                  <DynamicHumidityIcon humidity={50} className="inline h-4 w-4 mr-1" />
                  {t("Humid", "湿度")}
                </TableHead>
                <TableHead>{t("Conditions", "天气状况")}</TableHead>
                <TableHead className="text-center">{t("Astro Score", "天文评分")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecasts.map((forecast, index) => {
                const siqs = getSIQSRating(forecast.cloudCover, forecast.windSpeed, forecast.humidity, t);
                const weatherClass = getWeatherClass(forecast.precipitation, forecast.cloudCover);
                const isNighttime = (() => {
                  const date = new Date(forecast.time);
                  const hour = date.getHours();
                  return hour >= 18 || hour < 8;
                })();
                
                return (
                  <TableRow 
                    key={index} 
                    className={`transition-colors ${index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'} 
                              hover:bg-cosmic-700/20 ${isNighttime ? 'bg-blue-900/5' : ''}`}
                  >
                    <TableCell className="font-medium border-b border-cosmic-700/20">
                      <div className="flex items-center">
                        {isNighttime && (
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2 opacity-60" 
                                title={t("Night hours (6PM-8AM)", "夜间时段 (18:00-08:00)")}></span>
                        )}
                        <div>
                          <div className="font-medium">{formatTime(forecast.time)}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(forecast.time)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-b border-cosmic-700/20">
                      <div className="flex items-center justify-center">
                        <DynamicTemperatureIcon temperature={forecast.temperature} className="mr-1 h-4 w-4" />
                        <span className={forecast.temperature > 25 ? 'text-amber-400' : forecast.temperature < 15 ? 'text-blue-400' : ''}>
                          {isNaN(forecast.temperature) ? "--" : forecast.temperature.toFixed(1)}°C
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-center border-b border-cosmic-700/20 ${weatherClass}`}>
                      <div className="flex items-center justify-center">
                        <DynamicCloudCoverIcon 
                          cloudCover={forecast.cloudCover} 
                          precipitation={forecast.precipitation} 
                          className="mr-1 h-4 w-4" 
                        />
                        <span className={forecast.cloudCover >= 40 ? 'text-red-400' : ''}>{isNaN(forecast.cloudCover) ? "--" : forecast.cloudCover}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-b border-cosmic-700/20">
                      <div className="flex items-center justify-center">
                        <DynamicWindIcon windSpeed={forecast.windSpeed} className="mr-1 h-4 w-4" />
                        <span>{isNaN(forecast.windSpeed) ? "--" : forecast.windSpeed} {t("km/h", "公里/小时")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-b border-cosmic-700/20">
                      <div className="flex items-center justify-center">
                        <DynamicHumidityIcon humidity={forecast.humidity} className="mr-1 h-4 w-4" />
                        <span>{isNaN(forecast.humidity) ? "--" : forecast.humidity}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="border-b border-cosmic-700/20">
                      <div className="flex items-center gap-2">
                        <DynamicPrecipitationIcon precipitation={forecast.precipitation} weatherCode={forecast.weatherCode} />
                        <span>{formatCondition(forecast.cloudCover, t)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-b border-cosmic-700/20">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${siqs.color} bg-opacity-20 text-white inline-flex items-center justify-center min-w-[40px] ${
                        isNighttime ? 'animate-pulse' : ''
                      }`}>
                        {forecast.cloudCover >= 40 ? '0.0' : siqs.score.toFixed(1)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="p-3 text-xs text-center text-muted-foreground bg-cosmic-800/20 border-t border-cosmic-700/20">
            <div className="flex items-center justify-center mb-1 space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 opacity-60"></span>
              <span>{t("Night hours (6PM-8AM) - optimal for astrophotography", "夜间时段 (18:00-08:00) - 天文摄影的最佳时间")}</span>
            </div>
            <div>{t("Scores are 0.0 when cloud cover is 40% or higher.", "云层覆盖率达到40%或更高时，评分为0.0。")}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ForecastTable.displayName = 'ForecastTable';

export default ForecastTable;
