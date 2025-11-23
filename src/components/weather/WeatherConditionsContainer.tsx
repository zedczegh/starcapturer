
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Cloud, Loader2 } from "lucide-react";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { useWeatherDataValidator } from "@/hooks/weather/useWeatherDataValidator";
import { NighttimeCloudData } from "@/types/weather";

interface WeatherConditionsContainerProps {
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

const WeatherConditionsContainer: React.FC<WeatherConditionsContainerProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
  forecastData,
  latitude = 0,
  longitude = 0
}) => {
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the validator hook to get stable and validated weather data
  const { stableWeatherData, nighttimeCloudData } = useWeatherDataValidator({
    weatherData,
    forecastData,
    latitude,
    longitude
  });
  
  useEffect(() => {
    const hasValidWeatherData = 
      weatherData && 
      weatherData.temperature !== undefined && 
      weatherData.humidity !== undefined && 
      weatherData.cloudCover !== undefined &&
      weatherData.windSpeed !== undefined;
      
    setIsLoading(!hasValidWeatherData);
    
    const timer = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [weatherData, isLoading]);

  // Translation for seeing conditions and moon phase
  const translatedData = useMemo(() => {
    return {
      seeingConditions: language === 'zh' 
        ? getSeeingConditionInChinese(seeingConditions)
        : seeingConditions,
      moonPhase: typeof moonPhase === 'string' ? moonPhase : ''
    };
  }, [language, seeingConditions, moonPhase]);

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
      <Card className="backdrop-blur-sm border-l-0 border-r-0 sm:border-l sm:border-r border-y sm:border border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300 shadow-lg overflow-hidden hover:shadow-cosmic-600/10 rounded-none sm:rounded-lg">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-transparent sm:border-cosmic-700/30 px-3 sm:px-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            {t("Current Conditions", "当前状况")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 bg-gradient-to-b from-cosmic-800/30 to-cosmic-900/30">
          {isLoading ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-cosmic-400" />
              <span className="ml-2 text-cosmic-300">{t("Loading weather data...", "加载天气数据中...")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-6">
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
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Helper function for Chinese translation
function getSeeingConditionInChinese(condition: string): string {
  const mapping: Record<string, string> = {
    "Excellent": "优秀",
    "Good": "良好",
    "Average": "一般",
    "Poor": "较差",
    "Very Poor": "很差"
  };
  
  return mapping[condition] || condition;
}

export default React.memo(WeatherConditionsContainer);
