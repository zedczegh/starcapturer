import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese } from "@/utils/weatherUtils";
import { motion } from "framer-motion";
import { validateWeatherData, validateWeatherAgainstForecast } from "@/utils/validation/dataValidation";
import { useToast } from "@/components/ui/use-toast";
import { getMoonInfo } from '@/services/realTimeSiqs/moonPhaseCalculator';
import { calculateTonightCloudCover } from "@/utils/nighttimeSIQS";
import { calculateAstronomicalNight, formatTime } from "@/utils/astronomy/nightTimeCalculator";
import { Cloud, Loader2 } from "lucide-react";

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
}

const WeatherConditions: React.FC<WeatherConditionsProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
  forecastData,
  latitude = 0,
  longitude = 0
}) => {
  const { language, t } = useLanguage();
  const [stableWeatherData, setStableWeatherData] = useState(weatherData);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const hasValidWeatherData = 
      weatherData && 
      weatherData.temperature !== undefined && 
      weatherData.humidity !== undefined && 
      weatherData.cloudCover !== undefined &&
      weatherData.windSpeed !== undefined;
      
    setIsLoading(!hasValidWeatherData);
    
    if (hasValidWeatherData) {
      setStableWeatherData(weatherData);
    }
    
    const timer = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [weatherData]);
  
  const nighttimeCloudData = useMemo(() => {
    if (!forecastData || !forecastData.hourly) return null;
    
    try {
      const { start, end } = calculateAstronomicalNight(latitude, longitude);
      const nightTimeStr = `${formatTime(start)}-${formatTime(end)}`;
      
      const tonightCloudCover = calculateTonightCloudCover(
        forecastData.hourly,
        latitude,
        longitude
      );
      
      if (tonightCloudCover === 0 && !forecastData.hourly.cloud_cover) {
        return null;
      }
      
      return {
        average: tonightCloudCover,
        timeRange: nightTimeStr,
        description: t ? 
          t("Astronomical Night Cloud Cover", "天文夜云量") : 
          "Astronomical Night Cloud Cover"
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="backdrop-blur-sm border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300 shadow-lg overflow-hidden hover:shadow-cosmic-600/10">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="text-xl flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            {t("Current Conditions", "当前状况")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          {isLoading ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-cosmic-400" />
              <span className="ml-2 text-cosmic-300">{t("Loading weather data...", "加载天气数据中...")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold mb-4 text-cosmic-100 border-b border-cosmic-700/30 pb-2">
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
                <h3 className="text-lg font-semibold mb-4 text-cosmic-100 border-b border-cosmic-700/30 pb-2">
                  {t("Sky Conditions", "天空状况")}
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
