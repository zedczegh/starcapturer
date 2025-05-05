
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese } from "@/utils/weather/moonPhaseUtils";
import { motion } from "framer-motion";
import { validateWeatherData, validateWeatherAgainstForecast } from "@/utils/validation/dataValidation";
import { useToast } from "@/components/ui/use-toast";
import { getMoonInfo } from '@/services/realTimeSiqs/moonPhaseCalculator';
import { calculateTonightCloudCover } from "@/utils/nighttimeSIQS";
import { calculateAstronomicalNight, formatTime } from "@/utils/astronomy/nightTimeCalculator";
import { Cloud, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { detectSuspiciousWeatherData, getWeatherIssueMessage } from "@/utils/validation/weatherValidation";
import { Button } from "@/components/ui/button";

interface WeatherConditionsProps {
  weatherData: {
    temperature: number;
    humidity: number;
    cloudCover: number;
    windSpeed: number;
    precipitation: number;
    time: string;
    condition: string;
    aqi?: number;
  };
  moonPhase: string | number;
  bortleScale: number | null;
  seeingConditions: string;
  forecastData?: any;
  latitude?: number;
  longitude?: number;
  onRefresh?: () => void;
}

const WeatherConditions: React.FC<WeatherConditionsProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
  forecastData,
  latitude = 0,
  longitude = 0,
  onRefresh
}) => {
  const { language, t } = useLanguage();
  const [stableWeatherData, setStableWeatherData] = useState(weatherData);
  const [isLoading, setIsLoading] = useState(true);
  const [dataIssues, setDataIssues] = useState<string[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const hasValidWeatherData = 
      weatherData && 
      weatherData.temperature !== undefined && 
      weatherData.humidity !== undefined && 
      weatherData.cloudCover !== undefined &&
      weatherData.windSpeed !== undefined;
      
    setIsLoading(!hasValidWeatherData);
    
    // Check for suspicious weather data
    if (hasValidWeatherData) {
      const validationResult = detectSuspiciousWeatherData(weatherData);
      setDataIssues(validationResult.issues);
      setStableWeatherData(weatherData);
      
      // Show toast warning if serious issues detected
      if (validationResult.issues.includes('too-many-zeros')) {
        toast({
          title: t("Weather Data Issue", "天气数据问题"),
          description: getWeatherIssueMessage(['too-many-zeros'], language as 'en' | 'zh'),
          variant: "destructive",
          duration: 4000,
        });
      }
    }
    
    const timer = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [weatherData, isLoading, toast, t, language]);
  
  const nighttimeCloudData = useMemo(() => {
    if (!forecastData || !forecastData.hourly) return null;
    
    try {
      const { start, end } = calculateAstronomicalNight(latitude, longitude);
      const nightTimeStr = `${formatTime(start)}-${formatTime(end)}`;
      
      // Get cloud cover for tonight from forecast
      const forecastHourly = forecastData.hourly;
      const tonightCloudCover = calculateTonightCloudCover(
        forecastHourly,
        latitude,
        longitude
      );
      
      console.log(`Calculated astronomical night cloud cover: ${tonightCloudCover}%`);
      
      // Check if we have valid data before returning
      if (isNaN(tonightCloudCover)) {
        console.log("Invalid astronomical night cloud cover data");
        return null;
      }
      
      // Split evening and morning times if possible
      let eveningCloudCover = null;
      let morningCloudCover = null;
      
      if (forecastHourly.time && forecastHourly.cloud_cover) {
        // Calculate evening cloud cover (6pm-12am)
        const eveningTimes = forecastHourly.time.filter((time: string) => {
          const date = new Date(time);
          const hour = date.getHours();
          return hour >= 18 && hour <= 23;
        });
        
        if (eveningTimes.length > 0) {
          const eveningValues = eveningTimes.map((time: string) => {
            const index = forecastHourly.time.indexOf(time);
            return forecastHourly.cloud_cover[index];
          }).filter((val: any) => typeof val === 'number' && !isNaN(val));
          
          if (eveningValues.length > 0) {
            eveningCloudCover = eveningValues.reduce((sum: number, val: number) => sum + val, 0) / eveningValues.length;
          }
        }
        
        // Calculate morning cloud cover (12am-6am)
        const morningTimes = forecastHourly.time.filter((time: string) => {
          const date = new Date(time);
          const hour = date.getHours();
          return hour >= 0 && hour < 6;
        });
        
        if (morningTimes.length > 0) {
          const morningValues = morningTimes.map((time: string) => {
            const index = forecastHourly.time.indexOf(time);
            return forecastHourly.cloud_cover[index];
          }).filter((val: any) => typeof val === 'number' && !isNaN(val));
          
          if (morningValues.length > 0) {
            morningCloudCover = morningValues.reduce((sum: number, val: number) => sum + val, 0) / morningValues.length;
          }
        }
      }
      
      return {
        average: tonightCloudCover,
        timeRange: nightTimeStr,
        description: t ? 
          t("Astronomical Night Cloud Cover", "天文夜云量") : 
          "Astronomical Night Cloud Cover",
        evening: eveningCloudCover,
        morning: morningCloudCover
      };
    } catch (error) {
      console.error("Error calculating nighttime cloud cover:", error);
      return null;
    }
  }, [forecastData, latitude, longitude, t]);
  
  useEffect(() => {
    if (forecastData && validateWeatherData(weatherData)) {
      const { isValid, correctedData, discrepancies } = validateWeatherAgainstForecast(
        weatherData,
        forecastData
      );
      
      if (!isValid && correctedData && discrepancies) {
        console.log("Weather data discrepancies detected:", discrepancies);
        
        setStableWeatherData(correctedData);
        
        if (discrepancies.length > 2) {
          toast({
            title: t("Weather Data Updated", "天气数据已更新"),
            description: t(
              "Weather data has been updated to match current forecast.",
              "天气数据已更新以匹配当前预报。"
            ),
            duration: 3000,
          });
        }
      } else {
        setStableWeatherData(weatherData);
      }
    } else if (validateWeatherData(weatherData)) {
      setStableWeatherData(weatherData);
    }
  }, [weatherData, forecastData, toast, t]);
  
  const { name: calculatedMoonPhaseName } = getMoonInfo();
  
  const translatedData = useMemo(() => {
    return {
      seeingConditions: language === 'zh' 
        ? getSeeingConditionInChinese(seeingConditions)
        : seeingConditions,
      moonPhase: calculatedMoonPhaseName,
    };
  }, [language, seeingConditions, calculatedMoonPhaseName]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { staggerChildren: 0.1, duration: 0.5 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  // Determine if we have suspicious data with too many zeros
  const hasTooManyZeros = dataIssues.includes('too-many-zeros');
  const hasDataIssues = dataIssues.length > 0;

  const handleRefresh = () => {
    if (onRefresh) {
      // Clear issues until new data arrives
      setDataIssues([]);
      // Show loading state
      setIsLoading(true);
      // Trigger refresh
      onRefresh();
      
      toast({
        title: t("Refreshing Data", "正在刷新数据"),
        description: t(
          "Fetching the latest weather information...",
          "正在获取最新的天气信息..."
        ),
      });
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="backdrop-blur-sm border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300 shadow-lg overflow-hidden hover:shadow-cosmic-600/10">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            <div className="flex items-center">
              <Cloud className="w-4 h-4 text-blue-400 mr-1" />
              {t("Current Conditions", "当前状况")}
            </div>
            
            {hasDataIssues && (
              <div className="flex items-center text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">
                  {t("Data issue detected", "检测到数据问题")}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          {isLoading ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-cosmic-400" />
              <span className="ml-2 text-cosmic-300 text-xs">{t("Loading weather data...", "加载天气数据中...")}</span>
            </div>
          ) : hasTooManyZeros ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center gap-4">
              <div className="text-center">
                <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-cosmic-300 mb-1">
                  {getWeatherIssueMessage(['too-many-zeros'], language as 'en' | 'zh')}
                </p>
                <p className="text-xs text-cosmic-400">
                  {t(
                    "Multiple weather values showing as zero may indicate data issues.",
                    "多个天气值显示为零可能表示数据问题。"
                  )}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 bg-cosmic-800/50"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                {t("Refresh Weather Data", "刷新天气数据")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <h3 className="text-xs font-semibold mb-2 text-cosmic-100 border-b border-cosmic-700/30 pb-1.5">
                  {t("Observing Conditions", "观测条件")}
                </h3>
                <PrimaryConditions
                  temperature={stableWeatherData.temperature}
                  humidity={stableWeatherData.humidity}
                  windSpeed={stableWeatherData.windSpeed}
                  seeingConditions={translatedData.seeingConditions}
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <h3 className="text-xs font-semibold mb-2 text-cosmic-100 border-b border-cosmic-700/30 pb-1.5 flex justify-between items-center">
                  <span>{t("Sky Conditions", "天空状况")}</span>
                  {hasDataIssues && !hasTooManyZeros && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-cosmic-400 hover:text-cosmic-200"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </h3>
                <SecondaryConditions
                  cloudCover={stableWeatherData.cloudCover}
                  moonPhase={translatedData.moonPhase}
                  bortleScale={bortleScale}
                  aqi={stableWeatherData.aqi}
                  nighttimeCloudData={nighttimeCloudData}
                />
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(WeatherConditions);
