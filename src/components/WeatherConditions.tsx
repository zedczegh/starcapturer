
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese, getMoonPhaseInChinese, getWeatherConditionInChinese } from "@/utils/weatherUtils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

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
  } | null;
  moonPhase: string | number;
  bortleScale: number | null;
  seeingConditions: string;
  loading?: boolean;
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

const WeatherConditions: React.FC<WeatherConditionsProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
  loading = false,
}) => {
  const { language, t } = useLanguage();
  
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
      weatherCondition: language === 'zh' && weatherData?.condition
        ? getWeatherConditionInChinese(weatherData.condition)
        : weatherData?.condition || t("Unknown", "未知")
    };
  }, [language, seeingConditions, moonPhase, weatherData?.condition, t]);

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

  // Show loading state
  if (loading || !weatherData) {
    return (
      <Card className="backdrop-blur-sm border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300 shadow-lg overflow-hidden hover:shadow-cosmic-600/10">
        <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
          <CardTitle className="text-xl text-gradient-blue">
            {t("Current Conditions", "当前状况")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("Loading weather data...", "正在加载天气数据...")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div variants={itemVariants}>
              <PrimaryConditions
                temperature={weatherData.temperature}
                humidity={weatherData.humidity}
                windSpeed={weatherData.windSpeed}
                seeingConditions={translatedData.seeingConditions}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <SecondaryConditions
                cloudCover={weatherData.cloudCover}
                moonPhase={translatedData.moonPhase}
                bortleScale={bortleScale}
                aqi={weatherData.aqi}
              />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeatherConditions;
