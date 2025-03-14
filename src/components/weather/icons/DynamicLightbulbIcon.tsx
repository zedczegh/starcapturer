
import React from "react";
import { Lightbulb } from "lucide-react";

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
    // Extreme light pollution (8-9): bright white/orange
    fillColor = `rgba(255, 240, 230, ${fillOpacity})`;
  } else if (validBortleScale >= 6) {
    // High light pollution (6-7): yellow/orange
    fillColor = `rgba(255, 175, 60, ${fillOpacity})`;
  } else if (validBortleScale >= 4) {
    // Moderate light pollution (4-5): yellow
    fillColor = `rgba(245, 215, 70, ${fillOpacity * 0.9})`;
  } else if (validBortleScale >= 2) {
    // Low light pollution (2-3): blue/green
    fillColor = `rgba(125, 200, 255, ${fillOpacity * 0.7})`;
  } else {
    // Very dark skies (1): deep blue
    fillColor = `rgba(70, 130, 230, ${fillOpacity * 0.6})`;
  }
  
  // Add tooltip description of the Bortle scale
  const getBortleDescription = () => {
    if (validBortleScale >= 8) {
      return "Extreme light pollution (Bortle 8-9): Only brightest stars visible";
    } else if (validBortleScale >= 6) {
      return "High light pollution (Bortle 6-7): Milky Way not visible";
    } else if (validBortleScale >= 4) {
      return "Moderate light pollution (Bortle 4-5): Milky Way visible overhead";
    } else if (validBortleScale >= 2) {
      return "Low light pollution (Bortle 2-3): Good dark sky";
    } else {
      return "Excellent dark sky (Bortle 1): Pristine night sky";
    }
  };
  
  return (
    <div className="relative" title={getBortleDescription()}>
      <Lightbulb 
        className="h-4 w-4 text-primary" 
        style={{
          fill: fillColor,
          stroke: "currentColor"
        }}
      />
      <span className="sr-only">Light pollution level: {validBortleScale.toFixed(1)}</span>
    </div>
  );
};

export default React.memo(DynamicLightbulbIcon);
