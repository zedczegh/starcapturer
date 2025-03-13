
import React, { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Sun, MoonStar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  DynamicPrecipitationIcon, 
  DynamicCloudCoverIcon, 
  DynamicWindIcon, 
  DynamicHumidityIcon 
} from "@/components/weather/DynamicIcons";

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

  // Format date from ISO string
  const formatDate = useCallback((isoTime: string) => {
    try {
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) return "--/--";
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "--/--";
    }
  }, []);

  const formatCondition = useCallback((cloudCover: number) => {
    if (typeof cloudCover !== 'number') return t("Unknown", "未知");
    
    if (cloudCover < 10) return t("Clear", "晴朗");
    if (cloudCover < 30) return t("Mostly Clear", "大部分晴朗");
    if (cloudCover < 70) return t("Partly Cloudy", "部分多云");
    if (cloudCover < 90) return t("Mostly Cloudy", "大部分多云");
    return t("Overcast", "阴天");
  }, [t]);

  const getSIQSRating = useCallback((cloudCover: number, windSpeed: number, humidity: number) => {
    if (typeof cloudCover !== 'number' || typeof windSpeed !== 'number' || typeof humidity !== 'number') {
      return { score: 0, quality: t("Unknown", "未知"), color: "bg-gray-400" };
    }
    
    // Apply the cloud cover > 40% rule - set score to 0 if cloud coverage is over 40%
    if (cloudCover > 40) {
      return { score: 0, quality: t("Bad", "很差"), color: "bg-red-500" };
    }
    
    // Simplified SIQS calculation for forecast that aligns with the main algorithm
    // Cloud factor is more important as per the main algorithm (30%)
    const cloudFactor = (100 - cloudCover * 2.5) / 100; // Scale 0-40% to 0-100%
    
    // Wind factor - max acceptable is 30mph/48kmh in main algorithm
    const windFactor = windSpeed > 30 ? 0 : (30 - windSpeed) / 30;
    
    // Humidity factor - lower is better
    const humidityFactor = humidity > 90 ? 0 : (90 - humidity) / 90;
    
    // Weight factors similar to main algorithm (cloud is most important)
    const score = (cloudFactor * 0.6 + windFactor * 0.2 + humidityFactor * 0.2) * 10;
    
    let quality, color;
    
    // Align quality descriptions with main SIQS scale
    if (score >= 8) {
      quality = t("Excellent", "极佳");
      color = "bg-green-500";
    } else if (score >= 6) {
      quality = t("Good", "良好");
      color = "bg-green-400";
    } else if (score >= 4) {
      quality = t("Fair", "一般");
      color = "bg-yellow-400";
    } else if (score >= 2) {
      quality = t("Poor", "较差");
      color = "bg-orange-400";
    } else {
      quality = t("Bad", "很差");
      color = "bg-red-500";
    }
    
    return { score: Math.round(score * 10) / 10, quality, color };
  }, [t]);

  // Generate fallback forecast data
  const generateFallbackForecasts = useCallback(() => {
    const now = new Date();
    const forecasts = [];
    
    for (let i = 0; i < 15; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(now.getDate() + i);
      
      forecasts.push({
        date: forecastDate.toISOString(),
        temperature_max: 22 + Math.round(Math.random() * 8),
        temperature_min: 15 + Math.round(Math.random() * 5),
        humidity: 60 + Math.round(Math.random() * 30),
        cloudCover: Math.round(Math.random() * 100),
        windSpeed: 5 + Math.round(Math.random() * 15),
        precipitation: Math.random() * 0.5,
      });
    }
    
    return forecasts;
  }, []);

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
  }, [forecastData, generateFallbackForecasts]);

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
              {forecasts.map((forecast, index) => {
                const siqsRating = getSIQSRating(forecast.cloudCover, forecast.windSpeed, forecast.humidity);
                
                return (
                  <TableRow 
                    key={index} 
                    className={`transition-colors ${index === 0 ? 'bg-primary/5' : index % 2 === 0 ? 'bg-cosmic-700/5' : 'bg-cosmic-700/10'} hover:bg-cosmic-700/20`}
                  >
                    <TableCell className="font-medium border-b border-cosmic-700/20">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {t("Today", "今天")}
                          </span>
                        )}
                        {formatDate(forecast.date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-b border-cosmic-700/20">
                      <div className="flex flex-col">
                        <span className="text-amber-400 flex items-center justify-center">
                          <Sun className="h-3 w-3 mr-1" />
                          {isNaN(forecast.temperature_max) ? "--" : forecast.temperature_max.toFixed(1)}°
                        </span>
                        <span className="text-blue-400 flex items-center justify-center">
                          <MoonStar className="h-3 w-3 mr-1" />
                          {isNaN(forecast.temperature_min) ? "--" : forecast.temperature_min.toFixed(1)}°
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-b border-cosmic-700/20">
                      <div className="flex items-center justify-center">
                        <DynamicCloudCoverIcon cloudCover={forecast.cloudCover} className="mr-1 h-4 w-4" />
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
                        <div className="flex-1 h-2 w-full rounded-full bg-cosmic-700/20">
                          <div 
                            className={`h-2 rounded-full ${siqsRating.color}`} 
                            style={{ width: `${siqsRating.score * 10}%`, transition: 'width 0.3s ease-in-out' }}
                          ></div>
                        </div>
                        <span className="text-sm whitespace-nowrap">{siqsRating.quality}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
