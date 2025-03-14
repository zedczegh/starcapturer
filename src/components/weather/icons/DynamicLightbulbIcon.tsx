
import React from "react";
import { Lightbulb, HelpCircle } from "lucide-react";

interface DynamicLightbulbIconProps {
  bortleScale: number | null;
}

const DynamicLightbulbIcon: React.FC<DynamicLightbulbIconProps> = ({ bortleScale }) => {
  // If Bortle scale is null or invalid, show a question mark icon
  if (bortleScale === null || bortleScale < 1 || bortleScale > 9) {
    return (
      <div className="relative">
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">Unknown light pollution level</span>
      </div>
    );
  }
  
  // Higher Bortle scale = more light pollution = brighter bulb
  // Use real Bortle scale value for proper representation
  const fillOpacity = Math.min(bortleScale / 9, 1);
  
  // Color changes with Bortle scale - using more accurate color representations
  let fillColor = "";
  
  if (bortleScale >= 8) {
    // Extreme light pollution (8-9): bright orange/red
    fillColor = `rgba(255, 99, 71, ${fillOpacity})`;
  } else if (bortleScale >= 6) {
    // High light pollution (6-7): orange/yellow
    fillColor = `rgba(255, 149, 0, ${fillOpacity})`;
  } else if (bortleScale >= 4) {
    // Moderate light pollution (4-5): yellow
    fillColor = `rgba(250, 204, 21, ${fillOpacity})`;
  } else if (bortleScale >= 2) {
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
      <span className="sr-only">Light pollution level: {bortleScale}</span>
    </div>
  );
};

export default DynamicLightbulbIcon;
