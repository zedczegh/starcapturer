
/**
 * Weather icon mapping utility
 * Maps weather conditions to appropriate icon names
 */

import { 
  Cloud, 
  CloudRain, 
  CloudSnow,
  CloudFog,
  CloudLightning,
  Sun,
  Cloudy,
  CloudSun
} from "lucide-react";

// Map weather conditions to their respective icons
export function getWeatherIcon(condition: string) {
  const lowercaseCondition = condition.toLowerCase();
  
  if (lowercaseCondition.includes('clear') || lowercaseCondition.includes('sun')) {
    return Sun;
  }
  
  if (lowercaseCondition.includes('partly cloudy') || 
      lowercaseCondition.includes('scattered clouds')) {
    return CloudSun;
  }
  
  if (lowercaseCondition.includes('cloud') || lowercaseCondition.includes('overcast')) {
    return Cloud;
  }
  
  if (lowercaseCondition.includes('rain') || 
      lowercaseCondition.includes('drizzle') || 
      lowercaseCondition.includes('shower')) {
    return CloudRain;
  }
  
  if (lowercaseCondition.includes('snow') || 
      lowercaseCondition.includes('sleet') || 
      lowercaseCondition.includes('hail')) {
    return CloudSnow;
  }
  
  if (lowercaseCondition.includes('fog') || 
      lowercaseCondition.includes('mist') || 
      lowercaseCondition.includes('haze')) {
    return CloudFog;
  }
  
  if (lowercaseCondition.includes('thunder') || 
      lowercaseCondition.includes('lightning') || 
      lowercaseCondition.includes('storm')) {
    return CloudLightning;
  }
  
  // Default to cloudy if we can't determine
  return Cloudy;
}
