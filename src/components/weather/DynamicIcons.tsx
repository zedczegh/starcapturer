
import React from "react";
import { Droplet, Droplets, Moon, MoonStar, Lightbulb } from "lucide-react";

interface MoonPhaseIconProps {
  phase: string;
  className?: string;
}

export const DynamicMoonIcon: React.FC<MoonPhaseIconProps> = ({ phase, className = "text-primary" }) => {
  // Choose the most appropriate icon based on moon phase
  switch (phase) {
    case "Full Moon":
      return (
        <div className={`relative ${className}`}>
          <Moon className="h-4 w-4 fill-current" />
        </div>
      );
    case "New Moon":
      return <Moon className={`h-4 w-4 ${className}`} />;
    case "First Quarter":
    case "Last Quarter":
      return <MoonStar className={`h-4 w-4 ${className}`} />;
    case "Waxing Crescent":
    case "Waning Crescent":
      return <MoonStar className={`h-4 w-4 ${className}`} />;
    case "Waxing Gibbous":
    case "Waning Gibbous":
      return (
        <div className={`relative ${className}`}>
          <Moon className="h-4 w-4 fill-primary/70" />
        </div>
      );
    default:
      return <Moon className={`h-4 w-4 ${className}`} />;
  }
};

interface LightPollutionIconProps {
  bortleScale: number;
  className?: string;
}

export const DynamicLightbulbIcon: React.FC<LightPollutionIconProps> = ({ 
  bortleScale, 
  className = "text-primary" 
}) => {
  // Lower Bortle scale = less light pollution, higher = more
  let opacity = "0";
  
  if (bortleScale >= 7) {
    opacity = "1"; // Very bright (urban/city)
  } else if (bortleScale >= 5) {
    opacity = "0.7"; // Moderately bright (suburban)
  } else if (bortleScale >= 3) {
    opacity = "0.4"; // Some light (rural)
  } else {
    opacity = "0.1"; // Very little (dark site)
  }
  
  return (
    <div className={`relative ${className}`}>
      <Lightbulb className={`h-4 w-4`} style={{ fill: `rgba(255, 215, 0, ${opacity})` }} />
    </div>
  );
};

interface HumidityIconProps {
  humidity: number;
  className?: string;
}

export const DynamicHumidityIcon: React.FC<HumidityIconProps> = ({ 
  humidity, 
  className = "text-primary" 
}) => {
  // Choose between droplet (low humidity) and droplets (high humidity)
  // Also adjust fill based on humidity level
  if (humidity >= 70) {
    return (
      <Droplets className={`h-4 w-4 ${className}`} style={{ fill: "rgba(59, 130, 246, 0.7)" }} />
    );
  } else if (humidity >= 40) {
    return (
      <Droplets className={`h-4 w-4 ${className}`} style={{ fill: "rgba(59, 130, 246, 0.4)" }} />
    );
  } else {
    return <Droplet className={`h-4 w-4 ${className}`} />;
  }
};
