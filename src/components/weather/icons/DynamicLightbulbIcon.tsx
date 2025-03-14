
import React from "react";
import { Lightbulb, HelpCircle } from "lucide-react";

interface DynamicLightbulbIconProps {
  bortleScale: number | null;
}

const DynamicLightbulbIcon: React.FC<DynamicLightbulbIconProps> = ({ bortleScale }) => {
  // If Bortle scale is null or invalid, use a default fallback value instead of showing a question mark
  const validBortleScale = bortleScale !== null && bortleScale >= 1 && bortleScale <= 9 
    ? bortleScale 
    : 4; // Default to 4 (moderate light pollution) instead of showing unknown
  
  // Higher Bortle scale = more light pollution = brighter bulb
  const fillOpacity = Math.min(validBortleScale / 9, 1);
  
  // Color changes with Bortle scale - using more accurate color representations
  let fillColor = "";
  
  if (validBortleScale >= 8) {
    // Extreme light pollution (8-9): bright orange/red
    fillColor = `rgba(255, 99, 71, ${fillOpacity})`;
  } else if (validBortleScale >= 6) {
    // High light pollution (6-7): orange/yellow
    fillColor = `rgba(255, 149, 0, ${fillOpacity})`;
  } else if (validBortleScale >= 4) {
    // Moderate light pollution (4-5): yellow
    fillColor = `rgba(250, 204, 21, ${fillOpacity})`;
  } else if (validBortleScale >= 2) {
    // Low light pollution (2-3): blue/green
    fillColor = `rgba(156, 220, 254, ${fillOpacity * 0.8})`;
  } else {
    // Very dark skies (1): deep blue
    fillColor = `rgba(96, 165, 250, ${fillOpacity * 0.7})`;
  }
  
  return (
    <div className="relative">
      <Lightbulb 
        className="h-4 w-4 text-primary" 
        style={{
          fill: fillColor,
          stroke: "currentColor"
        }}
      />
      <span className="sr-only">Light pollution level: {validBortleScale}</span>
    </div>
  );
};

export default DynamicLightbulbIcon;
