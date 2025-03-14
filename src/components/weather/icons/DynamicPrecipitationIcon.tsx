
import React from "react";
import { Cloud, CloudRain, CloudSnow, CloudHail, CloudFog, CloudLightning, Sun } from "lucide-react";

interface DynamicPrecipitationIconProps {
  precipitation: number;
  weatherCode?: number;
  temperature?: number; // Add temperature as an optional prop
}

const DynamicPrecipitationIcon: React.FC<DynamicPrecipitationIconProps> = ({ 
  precipitation, 
  weatherCode,
  temperature = 0 // Default to 0 if not provided
}) => {
  // Determine which icon to show based on precipitation and weather code
  // Weather codes from Open Meteo API:
  // 0=Clear sky, 1,2,3=Mainly clear/partly cloudy/overcast
  // 45,48=Fog, 51,53,55=Drizzle, 56,57=Freezing Drizzle
  // 61,63,65=Rain, 66,67=Freezing Rain, 71,73,75=Snow, 77=Snow grains
  // 80,81,82=Rain showers, 85,86=Snow showers, 95,96,99=Thunderstorm
  
  // Handle thunder conditions (codes 95-99)
  if (weatherCode && weatherCode >= 95) {
    return (
      <div className="relative animate-pulse">
        <CloudLightning 
          className="h-4 w-4 text-yellow-400" 
          style={{
            stroke: "currentColor",
            fill: "rgba(250, 204, 21, 0.3)"
          }}
        />
      </div>
    );
  }
  
  // Handle snow conditions (codes 71-77, 85-86)
  if ((weatherCode && (
      (weatherCode >= 71 && weatherCode <= 77) || 
      (weatherCode >= 85 && weatherCode <= 86)
    )) || (precipitation > 0 && temperature < 0)) {
    return (
      <div className="relative">
        <CloudSnow 
          className="h-4 w-4 text-blue-300" 
          style={{
            stroke: "currentColor",
            fill: "rgba(186, 230, 253, 0.3)"
          }}
        />
      </div>
    );
  }
  
  // Handle fog conditions (codes 45-48)
  if (weatherCode && (weatherCode === 45 || weatherCode === 48)) {
    return (
      <div className="relative">
        <CloudFog 
          className="h-4 w-4 text-slate-400" 
          style={{
            stroke: "currentColor",
            fill: "rgba(148, 163, 184, 0.3)"
          }}
        />
      </div>
    );
  }
  
  // Handle rain conditions (codes 51-67, 80-82) or precipitation > 0
  if ((weatherCode && (
      (weatherCode >= 51 && weatherCode <= 67) || 
      (weatherCode >= 80 && weatherCode <= 82)
    )) || precipitation > 0) {
    // Opacity based on amount of precipitation
    const opacity = Math.min(precipitation * 2, 1); // Scale it up a bit for visibility
    const isHeavy = precipitation > 0.5 || (weatherCode && (weatherCode === 65 || weatherCode === 67 || weatherCode === 82));
    
    return (
      <div className={`relative ${isHeavy ? 'animate-pulse' : ''}`}>
        <CloudRain 
          className={`h-4 w-4 ${isHeavy ? 'text-blue-500' : 'text-blue-400'}`}
          style={{
            stroke: "currentColor",
            fill: `rgba(96, 165, 250, ${opacity})`
          }}
        />
      </div>
    );
  }
  
  // Clear conditions (code 0)
  if (weatherCode === 0) {
    return <Sun className="h-4 w-4 text-yellow-400" />;
  }
  
  // Default: cloudy or partly cloudy (codes 1-3)
  return <Cloud className="h-4 w-4 text-slate-400" />;
};

export default React.memo(DynamicPrecipitationIcon);
