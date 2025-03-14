
import React from "react";
import { Cloud, CloudFog, CloudDrizzle, CloudSnow, CloudHail } from "lucide-react";

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
  
  // Add red glow for rainy conditions
  const rainGlowStyle = precipitation > 0 ? {
    filter: "drop-shadow(0 0 2px rgba(234, 56, 76, 0.4))",
    transition: "all 0.3s ease"
  } : {};
  
  // Determine which icon to display based on weather conditions
  const renderWeatherIcon = () => {
    // Heavy snow condition
    if (snowfall > 0.5) {
      return (
        <CloudSnow 
          className="h-4 w-4 text-primary" 
          style={{
            fill: `rgba(148, 163, 184, ${fillOpacity})`,
            stroke: "currentColor"
          }}
        />
      );
    }
    
    // Heavy rain condition
    if (precipitation > 0.5) {
      return (
        <CloudDrizzle 
          className="h-4 w-4 text-primary" 
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
          className="h-4 w-4 text-primary" 
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
          className="h-4 w-4 text-primary" 
          style={{
            fill: `rgba(148, 163, 184, ${fillOpacity})`,
            stroke: "currentColor"
          }}
        />
      );
    }
    
    // Default cloud icon
    return (
      <Cloud 
        className="h-4 w-4 text-primary" 
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
