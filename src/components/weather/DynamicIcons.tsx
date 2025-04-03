
import React, { useEffect, useRef, useState } from "react";
import { Cloud as CloudIcon, Moon, Sun, CloudLightning, CloudRain, CloudSnow, CloudWind, Lightbulb, LucideProps } from "lucide-react";

// Dynamic Cloud Cover Icon
export const DynamicCloudCoverIcon: React.FC<{ cloudCover: number }> = ({ cloudCover }) => {
  // Cloud cover opacity based on percentage
  const opacity = Math.min(0.9, Math.max(0.1, cloudCover / 100));
  
  return (
    <div className="relative h-5 w-5">
      <Sun className="absolute h-5 w-5 text-yellow-400" />
      <CloudIcon className="absolute h-5 w-5 text-primary" style={{ opacity }} />
    </div>
  );
};

// Dynamic Moon Phase Icon
export const DynamicMoonIcon: React.FC<{ phase: string }> = ({ phase }) => {
  const moonClassName = "h-5 w-5 text-sky-200";
  
  // Simple version just uses the standard moon icon with proper color
  return <Moon className={moonClassName} />;
};

// Lightbulb icon for Bortle scale
export const DynamicLightbulbIcon: React.FC<{ 
  bortleScale: number | null;
  animated?: boolean;
}> = ({ bortleScale, animated = false }) => {
  // Determine color based on Bortle scale
  // Scale goes from 1 (darkest skies) to 9 (brightest urban skies)
  const getColor = () => {
    if (bortleScale === null) return "text-gray-400";
    if (bortleScale <= 3) return "text-blue-500";
    if (bortleScale <= 6) return "text-amber-400";
    return "text-red-500";
  };
  
  const color = getColor();
  const pulseClass = animated ? "animate-pulse" : "";
  
  return (
    <Lightbulb className={`h-5 w-5 ${color} ${pulseClass}`} />
  );
};

// Weather Icon based on conditions
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
      return <CloudWind className={`${className} text-sky-400`} {...otherProps} />;
    case 'clear':
      return <Sun className={`${className} text-yellow-400`} {...otherProps} />;
    case 'cloudy':
    case 'partly cloudy':
      return <CloudIcon className={`${className} text-primary`} {...otherProps} />;
    default:
      return <Sun className={`${className} text-yellow-400`} {...otherProps} />;
  }
};
