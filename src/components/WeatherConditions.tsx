
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import PrimaryConditions from "@/components/weather/PrimaryConditions";
import SecondaryConditions from "@/components/weather/SecondaryConditions";
import { getSeeingConditionInChinese, getMoonPhaseInChinese } from "@/utils/weatherUtils";
import { calculateMoonPhase } from "@/utils/siqsValidation";

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
  
  // Always calculate real-time moon phase
  const currentMoonPhase = calculateMoonPhase();
  
  // Calculate real-time seeing conditions based on weather data
  const calculateSeeingConditions = () => {
    const { humidity, windSpeed, cloudCover } = weatherData;
    
    // Higher humidity, wind speed, and cloud cover all negatively affect seeing conditions
    let seeingValue = 2; // Start with default "Good"
    
    if (humidity > 85) seeingValue += 1;
    if (windSpeed > 15) seeingValue += 1;
    if (cloudCover > 30) seeingValue += 0.5;
    
    // Clamp value between 1-5
    return Math.max(1, Math.min(5, seeingValue));
  };
  
  // Get real-time seeing conditions
  const realTimeSeeingValue = calculateSeeingConditions();
  const realTimeSeeingConditions = (() => {
    if (realTimeSeeingValue <= 1) return "Excellent";
    if (realTimeSeeingValue <= 2) return "Good";
    if (realTimeSeeingValue <= 3) return "Average";
    if (realTimeSeeingValue <= 4) return "Poor";
    return "Very Poor";
  })();
  
  // Format moon phase string
  const formatMoonPhase = (phase: number) => {
    if (phase <= 0.05 || phase >= 0.95) return "New Moon";
    if (phase < 0.25) return "Waxing Crescent";
    if (phase < 0.30) return "First Quarter";
    if (phase < 0.45) return "Waxing Gibbous";
    if (phase < 0.55) return "Full Moon";
    if (phase < 0.70) return "Waning Gibbous";
    if (phase < 0.80) return "Last Quarter";
    return "Waning Crescent";
  };
  
  const realTimeMoonPhase = formatMoonPhase(currentMoonPhase);
  
  // Translate the seeing conditions and moon phase for Chinese
  const translatedSeeingConditions = language === 'zh' 
    ? getSeeingConditionInChinese(realTimeSeeingConditions)
    : realTimeSeeingConditions;
    
  const translatedMoonPhase = language === 'zh'
    ? getMoonPhaseInChinese(realTimeMoonPhase)
    : realTimeMoonPhase;

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
            seeingConditions={language === 'zh' ? translatedSeeingConditions : realTimeSeeingConditions}
          />
          
          <SecondaryConditions
            cloudCover={weatherData.cloudCover}
            moonPhase={language === 'zh' ? translatedMoonPhase : realTimeMoonPhase}
            bortleScale={bortleScale}
            aqi={weatherData.aqi}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherConditions;
