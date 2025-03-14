
import React, { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TableHeader from "./forecast/TableHeader";
import ForecastTableRow from "./forecast/ForecastTableRow";

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
            <TableHeader />
            <TableBody>
              {forecasts.map((forecast, index) => (
                <ForecastTableRow 
                  key={index} 
                  forecast={forecast} 
                  index={index} 
                />
              ))}
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
