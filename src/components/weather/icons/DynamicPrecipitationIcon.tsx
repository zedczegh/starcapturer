
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
  
  if (weatherCode) {
    if (weatherCode >= 71 && weatherCode <= 77) {
      return (
        <div className="relative">
          <CloudSnow className="w-5 h-5 text-blue-200" />
        </div>
      );
    }
    
    if (weatherCode >= 85 && weatherCode <= 86) {
      return (
        <div className="relative">
          <CloudSnow className="w-5 h-5 text-blue-200" />
        </div>
      );
    }
    
    if ((weatherCode >= 61 && weatherCode <= 65) || (weatherCode >= 80 && weatherCode <= 82)) {
      return (
        <div className="relative">
          <CloudRain className="w-5 h-5 text-blue-400" />
        </div>
      );
    }
    
    if (weatherCode >= 51 && weatherCode <= 55) {
      return (
        <div className="relative">
          <CloudDrizzle className="w-5 h-5 text-blue-300" />
        </div>
      );
    }
    
    if ((weatherCode >= 66 && weatherCode <= 67) || (weatherCode >= 56 && weatherCode <= 57)) {
      return (
        <div className="relative">
          <CloudHail className="w-5 h-5 text-indigo-300" />
        </div>
      );
    }
  }
  
  // Fallback to precipitation amount logic
  if (precipitation > 0 && temperature < 0) {
    return (
      <div className="relative">
        <CloudSnow className="w-5 h-5 text-blue-200" />
      </div>
    );
  } else if (precipitation >= 4) {
    return (
      <div className="relative">
        <CloudRain className="w-5 h-5 text-blue-400" />
      </div>
    );
  } else if (precipitation > 0) {
    return (
      <div className="relative">
        <CloudDrizzle className="w-5 h-5 text-blue-300" />
      </div>
    );
  } else if (precipitation === 0) {
    return (
      <div className="relative">
        <Droplets className="w-5 h-5 text-blue-200 opacity-30" />
      </div>
    );
  }
  
  // Default case
  return (
    <div className="relative">
      <Cloud className="w-5 h-5 text-gray-400 opacity-30" />
    </div>
  );
};

export default DynamicPrecipitationIcon;
