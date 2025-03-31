
import React, { memo } from 'react';
import { Cloud, Sun, CloudSun, CloudRain, ThermometerSun, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationWeatherBadgeProps {
  cloudCover?: number;
  temperature?: number;
  weatherCondition?: string;
  windSpeed?: number;
  precipitation?: number;
}

const LocationWeatherBadge: React.FC<LocationWeatherBadgeProps> = memo(({
  cloudCover,
  temperature,
  weatherCondition,
  windSpeed,
  precipitation
}) => {
  const { t, language } = useLanguage();
  
  // If we don't have any weather data
  if (cloudCover === undefined && 
      temperature === undefined && 
      !weatherCondition && 
      windSpeed === undefined) {
    return null;
  }
  
  // Generate badge text based on available data
  let badgeText = "";
  let badgeClass = "";
  let WeatherIcon = Cloud;
  
  // Use cloud cover as primary indicator if available
  if (cloudCover !== undefined) {
    if (cloudCover < 10) {
      badgeText = t("Clear Sky", "晴朗天空");
      badgeClass = "bg-blue-500/30 text-blue-200 border-blue-500/30";
      WeatherIcon = Sun;
    } else if (cloudCover < 30) {
      badgeText = t("Partly Cloudy", "局部多云");
      badgeClass = "bg-blue-400/30 text-blue-200 border-blue-400/30";
      WeatherIcon = CloudSun;
    } else if (cloudCover < 60) {
      badgeText = t("Mostly Cloudy", "多云");
      badgeClass = "bg-gray-500/30 text-gray-200 border-gray-500/30";
      WeatherIcon = Cloud;
    } else {
      badgeText = t("Overcast", "阴天");
      badgeClass = "bg-gray-600/30 text-gray-200 border-gray-600/30";
      WeatherIcon = Cloud;
    }
  } 
  // Fall back to weather condition if no cloud cover
  else if (weatherCondition) {
    const condition = weatherCondition.toLowerCase();
    
    if (condition.includes('clear') || condition.includes('sunny')) {
      badgeText = t("Clear", "晴朗");
      badgeClass = "bg-blue-500/30 text-blue-200 border-blue-500/30";
      WeatherIcon = Sun;
    } else if (condition.includes('partly') || condition.includes('mostly clear')) {
      badgeText = t("Partly Cloudy", "局部多云");
      badgeClass = "bg-blue-400/30 text-blue-200 border-blue-400/30";
      WeatherIcon = CloudSun;
    } else if (condition.includes('cloud')) {
      badgeText = t("Cloudy", "多云");
      badgeClass = "bg-gray-500/30 text-gray-200 border-gray-500/30";
      WeatherIcon = Cloud;
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      badgeText = t("Rain", "雨");
      badgeClass = "bg-gray-600/40 text-gray-200 border-gray-600/30";
      WeatherIcon = CloudRain;
    } else {
      badgeText = weatherCondition;
      badgeClass = "bg-gray-500/30 text-gray-200 border-gray-500/30";
      WeatherIcon = Cloud;
    }
  }
  // If no weather data, just return null
  else {
    return null;
  }
  
  // Handle special cases where precipitation overrides other conditions
  if (precipitation !== undefined && precipitation > 0.1) {
    badgeText = t("Rain", "雨");
    badgeClass = "bg-gray-600/40 text-gray-200 border-gray-600/30";
    WeatherIcon = CloudRain; 
  }
  
  return (
    <Badge variant="outline" className={`text-xs font-normal px-2 py-0 h-5 ${badgeClass}`}>
      <WeatherIcon className="h-3 w-3 mr-1" />
      {badgeText}
      {temperature !== undefined && (
        <span className="ml-1">{Math.round(temperature)}°</span>
      )}
      {windSpeed !== undefined && windSpeed > 20 && (
        <Wind className="h-3 w-3 ml-1" />
      )}
    </Badge>
  );
});

export default LocationWeatherBadge;
