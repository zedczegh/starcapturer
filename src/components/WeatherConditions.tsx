
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese, getMoonPhaseInChinese, getWeatherConditionInChinese } from "@/utils/weatherUtils";
import { motion } from "framer-motion";

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
}

// Helper function to normalize moon phase display
export const normalizeMoonPhase = (phase: string | number): string => {
  if (typeof phase === 'number') {
    // If it's a value between 0 and 1 (fraction of lunar cycle)
    if (phase >= 0 && phase <= 1) {
      if (phase <= 0.05 || phase >= 0.95) return "New Moon";
      if (phase < 0.25) return "Waxing Crescent";
      if (phase < 0.30) return "First Quarter";
      if (phase < 0.45) return "Waxing Gibbous";
      if (phase < 0.55) return "Full Moon";
      if (phase < 0.70) return "Waning Gibbous";
      if (phase < 0.80) return "Last Quarter";
      return "Waning Crescent";
    }
    
    // For any other numeric format, convert to string
    return `Moon Phase ${phase}`;
  }
  
  // If it's already a string but empty, provide a default
  if (!phase) return "Unknown Phase";
  
  return phase; // If it's already a string, return as is
};

// Validate weather data to ensure it's complete and has valid values
const validateWeatherData = (data: any) => {
  const isValid = data && 
    typeof data.temperature === 'number' &&
    typeof data.humidity === 'number' &&
    typeof data.cloudCover === 'number' &&
    typeof data.windSpeed === 'number' &&
    typeof data.precipitation === 'number' &&
    typeof data.time === 'string' &&
    typeof data.condition === 'string';
  
  if (!isValid) {
    console.error("Invalid weather data detected:", data);
    return false;
  }
  
  return true;
};

const WeatherConditions: React.FC<WeatherConditionsProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
}) => {
  const { language, t } = useLanguage();
  const [stableWeatherData, setStableWeatherData] = useState(weatherData);
  const [updateKey, setUpdateKey] = useState(0);
  
  // Ensure weather data is stable and validated
  useEffect(() => {
    // Only update stable weather data if we have valid new data
    if (validateWeatherData(weatherData)) {
      setStableWeatherData(weatherData);
      // Increment update key to force re-render of components
      setUpdateKey(prev => prev + 1);
    } else {
      console.warn("Received invalid weather data, keeping previous stable data");
    }
  }, [weatherData]);
  
  // Use memoized translations and normalizations for better performance
  const translatedData = useMemo(() => {
    // Normalize moon phase first to ensure consistent format
    const normalizedMoonPhase = normalizeMoonPhase(moonPhase);
    
    // Translate relevant conditions for Chinese
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
      key={`weather-container-${updateKey}`}
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
              />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default React.memo(WeatherConditions);
