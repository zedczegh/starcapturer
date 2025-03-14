
import React from "react";
import { Cloud, CloudFog, CloudDrizzle, CloudSnow, CloudHail, Sun, CloudSun } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicCloudCoverIconProps {
  cloudCover: number;
  precipitation?: number;
  snowfall?: number;
  className?: string;
}

const DynamicCloudCoverIcon: React.FC<DynamicCloudCoverIconProps> = ({ 
  cloudCover, 
  precipitation = 0, 
  snowfall = 0,
  className 
}) => {
  // Calculate fill based on cloud cover percentage
  const fillOpacity = cloudCover / 100;
  
  // Add red glow for rainy conditions - smaller and more aesthetic
  const hasRain = precipitation > 0;
  const rainGlowStyle = hasRain ? {
    filter: "drop-shadow(0 0 1.5px rgba(234, 56, 76, 0.5))",
    transition: "all 0.3s ease"
  } : {};
  
  // Determine which icon to display based on weather conditions
  const renderWeatherIcon = () => {
    // Heavy snow condition
    if (snowfall > 0.5) {
      return (
        <CloudSnow 
          className={cn("h-3.5 w-3.5 text-primary", hasRain && "text-red-400")}
          style={{
            fill: `rgba(148, 163, 184, ${fillOpacity})`,
            stroke: "currentColor",
            ...rainGlowStyle
          }}
        />
      );
    }
    
    // Heavy rain condition
    if (precipitation > 0.5) {
      return (
        <CloudDrizzle 
          className={cn("h-3.5 w-3.5", hasRain ? "text-red-400" : "text-primary")}
          style={{
            fill: `rgba(148, 163, 184, ${fillOpacity})`,
            stroke: "currentColor",
            ...rainGlowStyle
          }}
        />
      );
    }
    
    // Light rain condition
    if (precipitation > 0) {
      return (
        <CloudHail 
          className={cn("h-3.5 w-3.5", "text-red-400")}
          style={{
            fill: `rgba(148, 163, 184, ${fillOpacity})`,
            stroke: "currentColor",
            ...rainGlowStyle
          }}
        />
      );
    }
    
    // Fog condition (high cloud cover)
    if (cloudCover > 80) {
      return (
        <CloudFog 
          className="h-3.5 w-3.5 text-primary"
          style={{
            fill: `rgba(148, 163, 184, ${fillOpacity})`,
            stroke: "currentColor"
          }}
        />
      );
    }
    
    // Low cloud cover (sunny)
    if (cloudCover < 25) {
      return (
        <Sun 
          className="h-3.5 w-3.5 text-yellow-400" 
          style={{
            filter: "drop-shadow(0 0 2px rgba(250, 204, 21, 0.4))"
          }}
        />
      );
    }
    
    // Partly cloudy (25-40% cloud cover)
    if (cloudCover >= 25 && cloudCover < 40) {
      return (
        <CloudSun 
          className="h-3.5 w-3.5 text-primary" 
          style={{
            fill: `rgba(148, 163, 184, ${fillOpacity})`,
            stroke: "currentColor"
          }}
        />
      );
    }
    
    // Default cloud icon for other conditions
    return (
      <Cloud 
        className="h-3.5 w-3.5 text-primary" 
        style={{
          fill: `rgba(148, 163, 184, ${fillOpacity})`,
          stroke: "currentColor"
        }}
      />
    );
  };
  
  return (
    <div className={`relative ${className || ''}`}>
      {renderWeatherIcon()}
    </div>
  );
};

export default React.memo(DynamicCloudCoverIcon);
