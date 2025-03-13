
import React, { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DynamicCloudCoverIcon, DynamicWindIcon, DynamicHumidityIcon } from "@/components/weather/DynamicIcons";
import ForecastRow from "./forecast/ForecastRow";
import { generateFallbackForecasts } from "./forecast/ForecastUtils";

interface LongRangeForecastProps {
  forecastData: any;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const LongRangeForecast: React.FC<LongRangeForecastProps> = React.memo(({ 
  forecastData, 
  isLoading = false,
  onRefresh
}) => {
  const { t } = useLanguage();

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
      toast.info(t("Refreshing extended forecast data...", "正在刷新延长预报数据..."));
    }
  }, [onRefresh, t]);

  // Create memoized forecast data
  const forecasts = useMemo(() => {
    try {
      if (forecastData && forecastData.daily && Array.isArray(forecastData.daily.time)) {
        const days = Math.min(forecastData.daily.time.length, 15);
        const result = [];
        
        for (let i = 0; i < days; i++) {
          result.push({
            date: forecastData.daily.time[i] || new Date(new Date().setDate(new Date().getDate() + i)).toISOString(),
            temperature_max: forecastData.daily.temperature_2m_max?.[i] ?? 25,
            temperature_min: forecastData.daily.temperature_2m_min?.[i] ?? 15,
            humidity: forecastData.daily.relative_humidity_2m_mean?.[i] ?? 60,
            cloudCover: forecastData.daily.cloud_cover_mean?.[i] ?? 30,
            windSpeed: forecastData.daily.wind_speed_10m_max?.[i] ?? 5,
            precipitation: forecastData.daily.precipitation_sum?.[i] ?? 0,
          });
        }
        
        if (result.length > 0) {
          return result;
        }
      }
    } catch (error) {
      console.error("Error processing long-range forecast data:", error);
    }
    
    return generateFallbackForecasts();
  }, [forecastData]);

  if (isLoading) {
    return (
      <Card className="shadow-md border-cosmic-700/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">{t("15-Day Forecast", "15天预报")}</CardTitle>
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
          <CardTitle className="text-xl text-gradient-blue">{t("15-Day Forecast", "15天预报")}</CardTitle>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh} 
              className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
              title={t("Refresh Extended Forecast", "刷新延长预报")}
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
                <TableHead className="py-3">{t("Date", "日期")}</TableHead>
                <TableHead className="text-center">
                  <Sun className="inline h-4 w-4 mr-1" />
                  {t("Temp °C", "温度 °C")}
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
                <TableHead className="text-center">{t("Astro Score", "天文评分")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecasts.map((forecast, index) => (
                <ForecastRow key={index} forecast={forecast} index={index} />
              ))}
            </TableBody>
          </Table>
          
          <div className="text-xs text-muted-foreground p-3 text-center bg-cosmic-800/20 border-t border-cosmic-700/20">
            {t("Astronomical scores are estimates based on weather conditions only.", "天文评分仅基于天气条件的估计。")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

LongRangeForecast.displayName = 'LongRangeForecast';

export default LongRangeForecast;
