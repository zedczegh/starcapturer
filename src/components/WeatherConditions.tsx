
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese, getMoonPhaseInChinese } from "@/utils/weatherUtils";

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
  
  // Translate the seeing conditions and moon phase for Chinese
  const translatedSeeingConditions = language === 'zh' 
    ? getSeeingConditionInChinese(seeingConditions)
    : seeingConditions;
    
  const translatedMoonPhase = language === 'zh'
    ? getMoonPhaseInChinese(moonPhase)
    : moonPhase;

  return (
    <Card className="glassmorphism border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gradient-blue">{t("Current Conditions", "当前状况")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <PrimaryConditions
            temperature={weatherData.temperature}
            humidity={weatherData.humidity}
            windSpeed={weatherData.windSpeed}
            seeingConditions={language === 'zh' ? translatedSeeingConditions : seeingConditions}
          />
          
          <SecondaryConditions
            cloudCover={weatherData.cloudCover}
            moonPhase={language === 'zh' ? translatedMoonPhase : moonPhase}
            bortleScale={bortleScale}
            aqi={weatherData.aqi}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherConditions;
