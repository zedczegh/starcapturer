
import React from "react";
import { CloudSnow, CloudRain, Droplets, CloudDrizzle, CloudHail, Cloud } from "lucide-react";

interface DynamicPrecipitationIconProps {
  precipitation: number;
  weatherCode?: number;
  temperature?: number;
}

const DynamicPrecipitationIcon: React.FC<DynamicPrecipitationIconProps> = ({ 
  precipitation, 
  weatherCode,
  temperature = 0
}) => {
  // Determine which icon to show based on precipitation and weather code
  // Weather codes from Open Meteo API:
  // 51-55: Drizzle
  // 56-57: Freezing drizzle
  // 61-65: Rain
  // 66-67: Freezing rain
  // 71-77: Snow
  // 80-82: Rain showers
  // 85-86: Snow showers
  
  // Common rain glow style for rainy conditions
  const rainGlowStyle = {
    filter: "drop-shadow(0 0 3px rgba(234, 56, 76, 0.5))",
    transition: "all 0.3s ease"
  };
  
  if (weatherCode) {
    if (weatherCode >= 71 && weatherCode <= 77) {
      return (
        <div className="relative inline-flex items-center justify-center w-5 h-5">
          <CloudSnow className="w-4 h-4 text-blue-200" />
        </div>
      );
    }
    
    if (weatherCode >= 85 && weatherCode <= 86) {
      return (
        <div className="relative inline-flex items-center justify-center w-5 h-5">
          <CloudSnow className="w-4 h-4 text-blue-200" />
        </div>
      );
    }
    
    if ((weatherCode >= 61 && weatherCode <= 65) || (weatherCode >= 80 && weatherCode <= 82)) {
      return (
        <div className="relative inline-flex items-center justify-center w-5 h-5">
          <CloudRain 
            className="w-4 h-4 text-blue-400" 
            style={rainGlowStyle}
          />
        </div>
      );
    }
    
    if (weatherCode >= 51 && weatherCode <= 55) {
      return (
        <div className="relative inline-flex items-center justify-center w-5 h-5">
          <CloudDrizzle 
            className="w-4 h-4 text-blue-300" 
            style={rainGlowStyle}
          />
        </div>
      );
    }
    
    if ((weatherCode >= 66 && weatherCode <= 67) || (weatherCode >= 56 && weatherCode <= 57)) {
      return (
        <div className="relative inline-flex items-center justify-center w-5 h-5">
          <CloudHail 
            className="w-4 h-4 text-indigo-300" 
            style={rainGlowStyle}
          />
        </div>
      );
    }
  }
  
  // Fallback to precipitation amount logic
  if (precipitation > 0 && temperature < 0) {
    return (
      <div className="relative inline-flex items-center justify-center w-5 h-5">
        <CloudSnow className="w-4 h-4 text-blue-200" />
      </div>
    );
  } else if (precipitation >= 4) {
    return (
      <div className="relative inline-flex items-center justify-center w-5 h-5">
        <CloudRain 
          className="w-4 h-4 text-blue-400" 
          style={rainGlowStyle}
        />
      </div>
    );
  } else if (precipitation > 0) {
    return (
      <div className="relative inline-flex items-center justify-center w-5 h-5">
        <CloudDrizzle 
          className="w-4 h-4 text-blue-300" 
          style={rainGlowStyle}
        />
      </div>
    );
  } else if (precipitation === 0) {
    return (
      <div className="relative inline-flex items-center justify-center w-5 h-5">
        <Droplets className="w-4 h-4 text-blue-200 opacity-30" />
      </div>
    );
  }
  
  // Default case
  return (
    <div className="relative inline-flex items-center justify-center w-5 h-5">
      <Cloud className="w-4 h-4 text-gray-400 opacity-30" />
    </div>
  );
};

export default DynamicPrecipitationIcon;
