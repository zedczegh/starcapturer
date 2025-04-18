
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { extractFutureForecasts } from "./forecast/ForecastUtils";
import ForecastRow from "./forecast/ForecastRow";

interface ForecastTableProps {
  forecastData: any;
  isLoading?: boolean;
  onRefresh?: () => void;
  locationLatitude?: number;
  locationLongitude?: number;
}

const ForecastTable: React.FC<ForecastTableProps> = ({ 
  forecastData, 
  isLoading = false,
  onRefresh,
  locationLatitude,
  locationLongitude
}) => {
  const { t } = useLanguage();
  
  // Extract forecast for next 24 hours
  const forecasts = useMemo(() => {
    if (!forecastData || !forecastData.hourly) return [];
    
    // Get forecasts for the next 24 hours only
    const futureForecasts = extractFutureForecasts(forecastData.hourly);
    
    // Group forecasts by hour
    return futureForecasts.map(item => {
      const date = new Date(item.time);
      return {
        date: item.time,
        temperature: item.temperature,
        cloudCover: item.cloudCover,
        windSpeed: item.windSpeed,
        humidity: item.humidity,
        hour: date.getHours(),
        precipitation: item.precipitation || 0
      };
    });
  }, [forecastData]);
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      toast.info(t("Refreshing forecast data...", "正在刷新预报数据..."));
    }
  };
  
  if (isLoading) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{t("24-Hour Forecast", "24小时预报")}</CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse">
          <Skeleton className="h-[400px] w-full bg-cosmic-700/20" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-md border-cosmic-700/30">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("24-Hour Forecast", "24小时预报")}
        </CardTitle>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          className="h-8 px-2"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t("Refresh", "刷新")}
        </Button>
      </CardHeader>
      <CardContent>
        {forecasts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">{t("No forecast data available", "没有预报数据可用")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Time", "时间")}</TableHead>
                  <TableHead className="text-center">{t("Temp", "温度")} (°C)</TableHead>
                  <TableHead className="text-center">{t("Cloud", "云量")}</TableHead>
                  <TableHead className="text-center">{t("Wind", "风速")}</TableHead>
                  <TableHead className="text-center">{t("Humidity", "湿度")}</TableHead>
                  <TableHead className="text-center">{t("SIQS", "SIQS")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecasts.map((forecast, index) => (
                  <ForecastRow 
                    key={forecast.date} 
                    forecast={forecast} 
                    index={index}
                    locationLatitude={locationLatitude}
                    locationLongitude={locationLongitude}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(ForecastTable);
