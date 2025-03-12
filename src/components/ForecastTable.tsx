
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cloud, Droplets, Thermometer, Wind, RefreshCw } from "lucide-react";
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
    const date = new Date(isoTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date from ISO string
  const formatDate = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatCondition = (cloudCover: number) => {
    if (cloudCover < 10) return t("Clear", "晴朗");
    if (cloudCover < 30) return t("Mostly Clear", "大部分晴朗");
    if (cloudCover < 70) return t("Partly Cloudy", "部分多云");
    if (cloudCover < 90) return t("Mostly Cloudy", "大部分多云");
    return t("Overcast", "阴天");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t("Weather Forecast", "天气预报")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Better validation for forecast data structure
  const hasForecastData = forecastData && 
                          forecastData.hourly && 
                          Array.isArray(forecastData.hourly.time) && 
                          forecastData.hourly.time.length > 0 &&
                          forecastData.hourly.temperature_2m &&
                          forecastData.hourly.cloud_cover &&
                          forecastData.hourly.wind_speed_10m &&
                          forecastData.hourly.relative_humidity_2m;

  if (!hasForecastData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t("Weather Forecast", "天气预报")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-4">
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

  // Create a subset of forecasts (next 12 hours, every 3 hours)
  const forecasts = [];
  for (let i = 0; i < Math.min(forecastData.hourly.time.length, 24); i += 3) {
    if (i < forecastData.hourly.time.length) {
      forecasts.push({
        time: forecastData.hourly.time[i],
        temperature: forecastData.hourly.temperature_2m[i],
        humidity: forecastData.hourly.relative_humidity_2m[i],
        cloudCover: forecastData.hourly.cloud_cover[i],
        windSpeed: forecastData.hourly.wind_speed_10m[i],
        precipitation: forecastData.hourly.precipitation ? forecastData.hourly.precipitation[i] : 0,
      });
    }
  }

  return (
    <Card>
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
                  <TableCell className="text-center">{forecast.temperature.toFixed(1)}°C</TableCell>
                  <TableCell className="text-center">{forecast.cloudCover}%</TableCell>
                  <TableCell className="text-center">{forecast.windSpeed} km/h</TableCell>
                  <TableCell className="text-center">{forecast.humidity}%</TableCell>
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
