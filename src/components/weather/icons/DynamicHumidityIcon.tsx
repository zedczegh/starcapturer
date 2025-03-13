
import React from "react";
import { Droplets } from "lucide-react";

interface DynamicHumidityIconProps {
  humidity: number;
  className?: string;
}

const DynamicHumidityIcon: React.FC<DynamicHumidityIconProps> = ({ humidity, className }) => {
  // Calculate fill based on humidity level
  const fillOpacity = humidity / 100;
  
  return (
    <div className={`relative ${className || ''}`}>
      <Droplets 
        className="h-4 w-4 text-primary" 
        style={{
          fill: `rgba(96, 165, 250, ${fillOpacity})`,
          stroke: humidity < 10 ? "currentColor" : "none"
        }}
      />
    </div>
  );
};

export default DynamicHumidityIcon;
