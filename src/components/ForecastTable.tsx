
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cloud, Droplets, Thermometer, Wind, RefreshCw, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface ForecastTableProps {
  forecastData: any;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ForecastTable: React.FC<ForecastTableProps> = ({ 
  forecastData, 
  isLoading = false,
  onRefresh
}) => {
  const { t } = useLanguage();

  // Format time from ISO string to readable format
  const formatTime = (isoTime: string) => {
    try {
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) return "--:--";
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "--:--";
    }
  };
  
  // Format date from ISO string
  const formatDate = (isoTime: string) => {
    try {
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) return "--/--";
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "--/--";
    }
  };

  const formatCondition = (cloudCover: number) => {
    if (typeof cloudCover !== 'number') return t("Unknown", "未知");
    
    if (cloudCover < 10) return t("Clear", "晴朗");
    if (cloudCover < 30) return t("Mostly Clear", "大部分晴朗");
    if (cloudCover < 70) return t("Partly Cloudy", "部分多云");
    if (cloudCover < 90) return t("Mostly Cloudy", "大部分多云");
    return t("Overcast", "阴天");
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t("Weather Forecast", "天气预报")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Enhanced validation for forecast data structure
  const hasForecastData = forecastData && 
                          forecastData.hourly && 
                          Array.isArray(forecastData.hourly.time) && 
                          forecastData.hourly.time.length > 0 &&
                          Array.isArray(forecastData.hourly.temperature_2m) &&
                          Array.isArray(forecastData.hourly.cloud_cover) &&
                          Array.isArray(forecastData.hourly.wind_speed_10m) &&
                          Array.isArray(forecastData.hourly.relative_humidity_2m);

  if (!hasForecastData) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">{t("Weather Forecast", "天气预报")}</CardTitle>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 w-8 p-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 space-y-4">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
            <p className="text-muted-foreground">
              {t("No forecast data available", "没有可用的预报数据")}
            </p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                <span>{t("Refresh Forecast", "刷新预报")}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create a subset of forecasts (next 24 hours, every 3 hours) with fallbacks for missing data
  const forecasts = [];
  try {
    for (let i = 0; i < Math.min(forecastData.hourly.time.length, 24); i += 3) {
      if (i < forecastData.hourly.time.length) {
        forecasts.push({
          time: forecastData.hourly.time[i] || new Date().toISOString(),
          temperature: forecastData.hourly.temperature_2m?.[i] ?? 0,
          humidity: forecastData.hourly.relative_humidity_2m?.[i] ?? 0,
          cloudCover: forecastData.hourly.cloud_cover?.[i] ?? 0,
          windSpeed: forecastData.hourly.wind_speed_10m?.[i] ?? 0,
          precipitation: forecastData.hourly.precipitation?.[i] ?? 0,
        });
      }
    }
  } catch (error) {
    console.error("Error processing forecast data:", error);
  }

  // Safety check - if we couldn't process any forecasts, show error
  if (forecasts.length === 0) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">{t("Weather Forecast", "天气预报")}</CardTitle>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 w-8 p-0">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 space-y-4">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto" />
            <p className="text-muted-foreground">
              {t("Could not process forecast data", "无法处理预报数据")}
            </p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                <span>{t("Refresh Forecast", "刷新预报")}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-cosmic-700/30">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{t("Weather Forecast", "天气预报")}</CardTitle>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh} 
              className="h-8 w-8 p-0 hover:bg-primary/10"
              title={t("Refresh Forecast", "刷新预报")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Time", "时间")}</TableHead>
                <TableHead className="text-center"><Thermometer className="inline h-4 w-4 mr-1" />{t("Temp", "温度")}</TableHead>
                <TableHead className="text-center"><Cloud className="inline h-4 w-4 mr-1" />{t("Clouds", "云层")}</TableHead>
                <TableHead className="text-center"><Wind className="inline h-4 w-4 mr-1" />{t("Wind", "风速")}</TableHead>
                <TableHead className="text-center"><Droplets className="inline h-4 w-4 mr-1" />{t("Humid", "湿度")}</TableHead>
                <TableHead>{t("Conditions", "天气状况")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecasts.map((forecast, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div>{formatTime(forecast.time)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(forecast.time)}</div>
                  </TableCell>
                  <TableCell className="text-center">{isNaN(forecast.temperature) ? "--" : forecast.temperature.toFixed(1)}°C</TableCell>
                  <TableCell className="text-center">{isNaN(forecast.cloudCover) ? "--" : forecast.cloudCover}%</TableCell>
                  <TableCell className="text-center">{isNaN(forecast.windSpeed) ? "--" : forecast.windSpeed} km/h</TableCell>
                  <TableCell className="text-center">{isNaN(forecast.humidity) ? "--" : forecast.humidity}%</TableCell>
                  <TableCell>{formatCondition(forecast.cloudCover)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastTable;
