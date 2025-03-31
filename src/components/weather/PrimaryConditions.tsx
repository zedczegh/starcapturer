
import React from 'react';
import { Cloud, Thermometer, Wind, Droplets } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ConditionItem from './ConditionItem';
import { DynamicCloudCoverIcon, DynamicWindIcon, DynamicTemperatureIcon } from './DynamicIcons';

interface PrimaryConditionsProps {
  weatherData: any;
}

const PrimaryConditions: React.FC<PrimaryConditionsProps> = ({ weatherData }) => {
  const { t } = useLanguage();
  
  if (!weatherData) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {t("Weather data unavailable", "天气数据不可用")}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 gap-3">
      <ConditionItem 
        title={t("Temperature", "温度")}
        value={`${weatherData.temperature.toFixed(1)}°C`}
        icon={<DynamicTemperatureIcon temperature={weatherData.temperature} className="h-10 w-10" />}
      />
      
      <ConditionItem 
        title={t("Cloud Cover", "云量")}
        value={`${weatherData.cloudCover}%`}
        icon={<DynamicCloudCoverIcon cloudCover={weatherData.cloudCover} className="h-10 w-10" />}
      />
      
      <ConditionItem 
        title={t("Wind", "风速")}
        value={`${weatherData.windSpeed.toFixed(1)} km/h`}
        icon={<DynamicWindIcon windSpeed={weatherData.windSpeed} className="h-10 w-10" />}
      />
      
      <ConditionItem 
        title={t("Humidity", "湿度")}
        value={`${weatherData.humidity}%`}
        icon={<Droplets className="h-10 w-10 text-blue-400" />}
      />
    </div>
  );
};

export default PrimaryConditions;
