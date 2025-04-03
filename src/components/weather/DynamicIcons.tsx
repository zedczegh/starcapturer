
import React from "react";
import { Cloud as CloudIcon, Moon, Sun, CloudLightning, CloudRain, CloudSnow, Wind, Lightbulb, LucideProps } from "lucide-react";

// Import individual icon components for better organization and proper exports
import DynamicHumidityIcon from "./icons/DynamicHumidityIcon";
import DynamicWindIcon from "./icons/DynamicWindIcon";
import DynamicTemperatureIcon from "./icons/DynamicTemperatureIcon";
import DynamicPrecipitationIcon from "./icons/DynamicPrecipitationIcon";
import DynamicCloudCoverIcon from "./icons/DynamicCloudCoverIcon";
import DynamicMoonIcon from "./icons/DynamicMoonIcon";
import DynamicLightbulbIcon from "./icons/DynamicLightbulbIcon";

// Export all the individual icons for use in other components
export {
  DynamicHumidityIcon,
  DynamicWindIcon,
  DynamicTemperatureIcon,
  DynamicPrecipitationIcon,
  DynamicCloudCoverIcon,
  DynamicMoonIcon,
  DynamicLightbulbIcon
};

// Dynamic Weather Icon based on conditions
export const DynamicWeatherIcon: React.FC<{ 
  condition: string; 
  props?: LucideProps;
}> = ({ condition, props = {} }) => {
  const { className = "h-5 w-5", ...otherProps } = props;
  
  switch(condition?.toLowerCase()) {
    case 'thunderstorm':
      return <CloudLightning className={`${className} text-purple-400`} {...otherProps} />;
    case 'rain':
    case 'drizzle':
      return <CloudRain className={`${className} text-blue-400`} {...otherProps} />;
    case 'snow':
      return <CloudSnow className={`${className} text-sky-200`} {...otherProps} />;
    case 'fog':
    case 'mist':
      return <CloudIcon className={`${className} text-gray-400`} {...otherProps} />;
    case 'windy':
      return <Wind className={`${className} text-sky-400`} {...otherProps} />;
    case 'clear':
      return <Sun className={`${className} text-yellow-400`} {...otherProps} />;
    case 'cloudy':
    case 'partly cloudy':
      return <CloudIcon className={`${className} text-primary`} {...otherProps} />;
    default:
      return <Sun className={`${className} text-yellow-400`} {...otherProps} />;
  }
};

// Dynamic Seeing Icon for astronomical seeing conditions
export const DynamicSeeingIcon: React.FC<{ 
  seeingConditions: string;
  className?: string;
}> = ({ seeingConditions, className }) => {
  const getIconColor = () => {
    const seeing = seeingConditions.toLowerCase();
    if (seeing.includes("excellent") || seeing.includes("perfect")) return "text-green-500";
    if (seeing.includes("good")) return "text-green-400";
    if (seeing.includes("average")) return "text-amber-400";
    if (seeing.includes("poor")) return "text-red-400";
    if (seeing.includes("bad")) return "text-red-500";
    return "text-gray-400";
  };
  
  return (
    <Sun className={`h-5 w-5 ${getIconColor()} ${className || ''}`} />
  );
};
