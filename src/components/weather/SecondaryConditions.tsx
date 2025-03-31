import React from 'react';
import { Moon, Star, Hurricane, Thermometer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ConditionItem from './ConditionItem';
import { DynamicMoonIcon, DynamicSeeingIcon } from './DynamicIcons';

interface SecondaryConditionsProps {
  weatherData: any;
}

const SecondaryConditions: React.FC<SecondaryConditionsProps> = ({ weatherData }) => {
  const { t } = useLanguage();
  
  if (!weatherData) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {t("Weather data unavailable", "天气数据不可用")}
      </div>
    );
  }
  
  // Calculate dew point from temperature and humidity
  const calculateDewPoint = (temp: number, humidity: number) => {
    const a = 17.27;
    const b = 237.7;
    
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100.0);
    const dewPoint = (b * alpha) / (a - alpha);
    
    return Math.round(dewPoint * 10) / 10;
  };
  
  const dewPoint = calculateDewPoint(weatherData.temperature, weatherData.humidity);
  
  // Get moon phase
  const getMoonPhase = () => {
    // If we have moon phase data in the weather data, use it
    if (weatherData.moonPhase !== undefined) {
      return weatherData.moonPhase;
    }
    
    // Otherwise, calculate it based on current date
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Simple estimation algorithm
    const c = 365.25 * year;
    const e = 30.6 * month;
    const jd = c + e + day - 694039.09;
    const jd2 = jd / 29.53;
    return (jd2 - Math.floor(jd2));
  };
  
  // Get bortle scale if available
  const getBortleScale = () => {
    if (weatherData.bortleScale !== undefined) {
      return weatherData.bortleScale;
    }
    
    return 5; // Default to moderate light pollution
  };
  
  // Get visibility description
  const getVisibilityDescription = (visibility: number) => {
    if (visibility >= 20) return t("Excellent", "极佳");
    if (visibility >= 10) return t("Good", "良好");
    if (visibility >= 5) return t("Moderate", "一般");
    return t("Poor", "较差");
  };
  
  const moonPhase = getMoonPhase();
  const bortleScale = getBortleScale();
  
  return (
    <div className="grid grid-cols-2 gap-3">
      <ConditionItem 
        title={t("Moon Phase", "月相")}
        value={`${Math.round(moonPhase * 100)}%`}
        icon={<DynamicMoonIcon phase={moonPhase} className="h-10 w-10" />}
      />
      
      <ConditionItem 
        title={t("Light Pollution", "光污染")}
        value={`Bortle ${bortleScale}`}
        icon={<Star className="h-10 w-10 text-purple-400" />}
      />
      
      <ConditionItem 
        title={t("Seeing", "视宁度")}
        value={weatherData.seeing ? `${weatherData.seeing.toFixed(1)}"` : "~2.1\""}
        icon={<DynamicSeeingIcon seeing={weatherData.seeing || 2.1} className="h-10 w-10" />}
      />
      
      <ConditionItem 
        title={t("Dew Point", "露点")}
        value={`${dewPoint}°C`}
        icon={<Thermometer className="h-10 w-10 text-teal-400" />}
      />
    </div>
  );
};

export default SecondaryConditions;
