
import React from "react";
import { Thermometer } from "lucide-react";

interface DynamicTemperatureIconProps {
  temperature: number;
}

const DynamicTemperatureIcon: React.FC<DynamicTemperatureIconProps> = ({ temperature }) => {
  // Define temperature ranges and corresponding colors
  let fillColor = "rgba(96, 165, 250, 0.5)"; // Default blue for neutral temps
  let fillOpacity = 0.5;
  
  if (temperature > 30) {
    // Hot temperature - red
    fillColor = "rgba(239, 68, 68, 1)";
    fillOpacity = Math.min((temperature - 20) / 20, 1);
  } else if (temperature > 20) {
    // Warm temperature - orange/yellow
    fillColor = "rgba(245, 158, 11, 1)";
    fillOpacity = (temperature - 15) / 15;
  } else if (temperature < 5) {
    // Very cold temperature - deep blue
    fillColor = "rgba(59, 130, 246, 1)";
    fillOpacity = Math.min((10 - temperature) / 10, 1);
  } else if (temperature < 15) {
    // Cool temperature - light blue
    fillColor = "rgba(96, 165, 250, 1)";
    fillOpacity = (15 - temperature) / 15;
  }
  
  return (
    <div className="relative">
      <Thermometer 
        className="h-4 w-4 text-primary" 
        style={{
          fill: fillColor,
          fillOpacity: fillOpacity,
          stroke: "currentColor"
        }}
      />
    </div>
  );
};

export default React.memo(DynamicTemperatureIcon);
