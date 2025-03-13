
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese, getMoonPhaseInChinese, getWeatherConditionInChinese } from "@/utils/weatherUtils";

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
  moonPhase: string;
  bortleScale: number;
  seeingConditions: string;
}

const WeatherConditions: React.FC<WeatherConditionsProps> = ({
  weatherData,
  moonPhase,
  bortleScale,
  seeingConditions,
}) => {
  const { language, t } = useLanguage();
  
  // Use memoized translations for better performance
  const translatedData = useMemo(() => {
    // Translate relevant conditions for Chinese
    return {
      seeingConditions: language === 'zh' 
        ? getSeeingConditionInChinese(seeingConditions)
        : seeingConditions,
      moonPhase: language === 'zh'
        ? getMoonPhaseInChinese(moonPhase)
        : moonPhase,
      weatherCondition: language === 'zh' && weatherData.condition
        ? getWeatherConditionInChinese(weatherData.condition)
        : weatherData.condition
    };
  }, [language, seeingConditions, moonPhase, weatherData.condition]);

  return (
    <Card className={`glassmorphism border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300 shadow-lg overflow-hidden ${language === 'zh' ? 'zh-card' : ''}`}>
      <CardHeader className="pb-2 bg-gradient-to-r from-cosmic-900 to-cosmic-800 border-b border-cosmic-700/30">
        <CardTitle className={`text-xl text-gradient-blue ${language === 'zh' ? 'tracking-wider' : ''}`}>
          {t("Current Conditions", "当前状况")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PrimaryConditions
            temperature={weatherData.temperature}
            humidity={weatherData.humidity}
            windSpeed={weatherData.windSpeed}
            seeingConditions={translatedData.seeingConditions}
          />
          
          <SecondaryConditions
            cloudCover={weatherData.cloudCover}
            moonPhase={translatedData.moonPhase}
            bortleScale={bortleScale}
            aqi={weatherData.aqi}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherConditions;
