
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
      </div>
    );
  }
  
  // Higher Bortle scale = more light pollution = brighter bulb
  const fillOpacity = Math.min(bortleScale / 9, 1);
  
  // Color changes with Bortle scale
  let fillColor = `rgba(250, 204, 21, ${fillOpacity})`;
  
  // For extreme light pollution (Bortle 8-9), make it more orange/red
  if (bortleScale >= 8) {
    fillColor = `rgba(255, 149, 0, ${fillOpacity})`;
  } else if (bortleScale <= 2) {
    // For very dark skies (Bortle 1-2), make it dimmer blue
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
    </div>
  );
};

export default DynamicLightbulbIcon;
