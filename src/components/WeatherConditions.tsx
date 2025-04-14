
import React, { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese, getMoonPhaseInChinese, getWeatherConditionInChinese } from "@/utils/weatherUtils";
import { motion } from "framer-motion";
import { extractNightForecasts, calculateAverageCloudCover } from "@/components/forecast/NightForecastUtils";
import NighttimeCloudInfo from "@/components/weather/NighttimeCloudInfo";
import { normalizeMoonPhase } from "@/utils/weather/moonPhaseUtils";
import WeatherDataValidator from "@/components/weather/WeatherDataValidator";

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
    nighttimeCloudData?: {
      average: number | null;
      evening: number;
      morning: number;
    } | null;
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
    <WeatherDataValidator weatherData={weatherData} forecastData={forecastData}>
      {(validatedData) => (
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
                    temperature={validatedData.temperature}
                    humidity={validatedData.humidity}
                    windSpeed={validatedData.windSpeed}
                    seeingConditions={language === 'zh' 
                      ? getSeeingConditionInChinese(seeingConditions)
                      : seeingConditions}
                  />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <SecondaryConditions
                    cloudCover={validatedData.cloudCover}
                    moonPhase={language === 'zh'
                      ? getMoonPhaseInChinese(normalizeMoonPhase(moonPhase))
                      : normalizeMoonPhase(moonPhase)}
                    bortleScale={bortleScale}
                    aqi={validatedData.aqi}
                    nighttimeCloudData={validatedData.nighttimeCloudData}
                  />
                </motion.div>
              </div>
              
              {validatedData.nighttimeCloudData && validatedData.nighttimeCloudData.average !== null && (
                <motion.div variants={itemVariants} className="mt-4">
                  <NighttimeCloudInfo nighttimeCloudData={validatedData.nighttimeCloudData} />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </WeatherDataValidator>
  );
};

export default memo(WeatherConditions);
