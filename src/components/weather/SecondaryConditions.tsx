
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Droplets, Wind, Sun } from 'lucide-react';

interface WeatherCondition {
  humidity?: number;
  cloudiness?: number;
  windSpeed?: number;
  [key: string]: any;
}

interface SecondaryConditionsProps {
  conditions?: WeatherCondition[];
  currentTimestamp?: string;
  showMoreLink?: boolean;
  cloudCover?: number;
  moonPhase?: string;
  bortleScale?: number | null;
  aqi?: number;
  nighttimeCloudData?: {
    average: number | null;
    evening: number;
    morning: number;
  } | null;
}

const SecondaryConditions: React.FC<SecondaryConditionsProps> = ({ 
  conditions, 
  currentTimestamp,
  showMoreLink = false,
  cloudCover,
  moonPhase,
  bortleScale,
  aqi,
  nighttimeCloudData
}) => {
  const { t } = useLanguage();
  
  // Get average condition values
  const getAverageValue = (property: keyof WeatherCondition): number => {
    if (!conditions || conditions.length === 0) return 0;
    
    const sum = conditions.reduce((acc, condition) => {
      const value = condition[property];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return Math.round((sum / conditions.length) * 10) / 10;
  };
  
  // Use directly provided values or calculate from conditions
  const averageHumidity = conditions ? getAverageValue('humidity') : 0;
  const averageCloudiness = cloudCover !== undefined ? cloudCover : (conditions ? getAverageValue('cloudiness') : 0);
  const averageWindSpeed = conditions ? getAverageValue('windSpeed') : 0;
  
  return (
    <Card className="border-cosmic-600/20 bg-cosmic-900/40 backdrop-blur-sm">
      <CardContent className="p-4 grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center">
          <Droplets className="h-5 w-5 text-blue-400 mb-1" />
          <p className="text-xs text-muted-foreground mb-1">
            {t("Humidity", "湿度")}
          </p>
          <p className="text-sm font-medium">
            {t(`${averageHumidity}%`, `${averageHumidity}%`)}
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          <Wind className="h-5 w-5 text-gray-400 mb-1" />
          <p className="text-xs text-muted-foreground mb-1">
            {t("Wind", "风速")}
          </p>
          <p className="text-sm font-medium">
            {t(`${averageWindSpeed} km/h`, `${averageWindSpeed} 公里/时`)}
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          <Sun className="h-5 w-5 text-amber-400 mb-1" />
          <p className="text-xs text-muted-foreground mb-1">
            {t("Clear Sky", "晴朗度")}
          </p>
          <p className="text-sm font-medium">
            {t(`${100 - averageCloudiness}%`, `${100 - averageCloudiness}%`)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecondaryConditions;
