
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese, getMoonPhaseInChinese, getWeatherConditionInChinese } from "@/utils/weatherUtils";
import { motion } from "framer-motion";
import { extractNightForecasts, calculateAverageCloudCover } from "@/components/forecast/NightForecastUtils";
import { validateWeatherData, validateWeatherAgainstForecast } from "@/utils/validation/dataValidation";
import { useToast } from "@/components/ui/use-toast";
import { normalizeMoonPhase } from "@/utils/weather/moonPhaseUtils";

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
}

const WeatherConditions: React.FC<WeatherConditionsProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
  forecastData
}) => {
  const { language, t } = useLanguage();
  const [stableWeatherData, setStableWeatherData] = useState(weatherData);
  const { toast } = useToast();
  
  const nighttimeCloudData = useMemo(() => {
    if (!forecastData || !forecastData.hourly) return null;
    
    try {
      const nightForecasts = extractNightForecasts(forecastData.hourly);
      
      if (nightForecasts.length === 0) return null;
      
      const eveningForecasts = nightForecasts.filter(forecast => {
        const hour = new Date(forecast.time).getHours();
        return hour >= 18 && hour <= 23;
      });
      
      const morningForecasts = nightForecasts.filter(forecast => {
        const hour = new Date(forecast.time).getHours();
        return hour >= 0 && hour < 8;
      });
      
      const eveningCloudCover = calculateAverageCloudCover(eveningForecasts);
      const morningCloudCover = calculateAverageCloudCover(morningForecasts);
      
      const totalHours = eveningForecasts.length + morningForecasts.length;
      
      let avgNightCloudCover;
      if (eveningForecasts.length === 0 && morningForecasts.length === 0) {
        avgNightCloudCover = null;
      } else if (eveningForecasts.length === 0) {
        avgNightCloudCover = morningCloudCover;
      } else if (morningForecasts.length === 0) {
        avgNightCloudCover = eveningCloudCover;
      } else {
        avgNightCloudCover = (
          (eveningCloudCover * eveningForecasts.length) + 
          (morningCloudCover * morningForecasts.length)
        ) / totalHours;
      }
      
      return {
        average: avgNightCloudCover,
        evening: eveningCloudCover,
        morning: morningCloudCover
      };
    } catch (error) {
      console.error("Error calculating nighttime cloud cover:", error);
      return null;
    }
  }, [forecastData]);
  
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
  
  const translatedData = useMemo(() => {
    const normalizedMoonPhase = normalizeMoonPhase(moonPhase);
    
    return {
      seeingConditions: language === 'zh' 
        ? getSeeingConditionInChinese(seeingConditions)
        : seeingConditions,
      moonPhase: language === 'zh'
        ? getMoonPhaseInChinese(normalizedMoonPhase)
        : normalizedMoonPhase,
      weatherCondition: language === 'zh' && stableWeatherData.condition
        ? getWeatherConditionInChinese(stableWeatherData.condition)
        : stableWeatherData.condition
    };
  }, [language, seeingConditions, moonPhase, stableWeatherData.condition]);

  // Animation variants
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
          <CardTitle className="text-xl text-gradient-blue">
            {t("Current Conditions", "当前状况")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <PrimaryConditions
                temperature={stableWeatherData.temperature}
                humidity={stableWeatherData.humidity}
                windSpeed={stableWeatherData.windSpeed}
                seeingConditions={translatedData.seeingConditions}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <SecondaryConditions
                cloudCover={stableWeatherData.cloudCover}
                moonPhase={translatedData.moonPhase}
                bortleScale={bortleScale}
                aqi={stableWeatherData.aqi}
                nighttimeCloudData={nighttimeCloudData}
              />
            </motion.div>
          </div>
          
          {/* Removed NighttimeCloudInfo component as requested */}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(WeatherConditions);
