
import React from "react";
import { Lightbulb } from "lucide-react";

interface DynamicLightbulbIconProps {
  bortleScale: number;
}

const DynamicLightbulbIcon: React.FC<DynamicLightbulbIconProps> = ({ bortleScale }) => {
  // Higher Bortle scale = more light pollution = brighter bulb
  const fillOpacity = Math.min(bortleScale / 9, 1);
  
  return (
    <div className="relative">
      <Lightbulb 
        className="h-4 w-4 text-primary" 
        style={{
          fill: `rgba(250, 204, 21, ${fillOpacity})`,
          stroke: "currentColor"
        }}
      />
    </div>
  );
};

export default DynamicLightbulbIcon;
