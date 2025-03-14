import React, { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
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
import { getSIQSRating, formatCondition } from "@/components/forecast/ForecastUtils";

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
  
  const formatTime = useCallback((isoTime: string) => {
    try {
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) return "--:--";
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "--:--";
    }
  }, []);
  
  const formatDate = useCallback((isoTime: string) => {
    try {
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) return "--/--";
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "--/--";
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
      toast.info(t("Refreshing forecast data...", "正在刷新预报数据..."));
    }
  }, [onRefresh, t]);

  const generateFallbackForecasts = useCallback(() => {
    const now = new Date();
    const forecasts = [];
    
    for (let i = 0; i < 8; i++) {
      const forecastTime = new Date(now);
      forecastTime.setHours(now.getHours() + (i * 3));
      
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
      for (let i = 0; i < Math.min(forecastData.hourly.time.length, 24); i += 3) {
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
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
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
                
                return (
                  <TableRow 
                    key={index} 
                    className={`transition-colors ${index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'} hover:bg-cosmic-700/20`}
                  >
                    <TableCell className="font-medium border-b border-cosmic-700/20">
                      <div>{formatTime(forecast.time)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(forecast.time)}</div>
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
                        <span>{isNaN(forecast.cloudCover) ? "--" : forecast.cloudCover}%</span>
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
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${siqs.color} bg-opacity-20 text-white inline-flex items-center justify-center min-w-[40px]`}>
                        {siqs.score.toFixed(1)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="p-2 text-xs text-center text-muted-foreground">
            {t("Scores below 4.0 are not recommended for astrophotography.", "评分低于4.0不推荐进行天文摄影。")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ForecastTable.displayName = 'ForecastTable';

export default ForecastTable;
