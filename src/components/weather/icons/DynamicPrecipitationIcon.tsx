
import React from "react";
import { Cloud, CloudRain } from "lucide-react";

interface DynamicPrecipitationIconProps {
  precipitation: number;
}

const DynamicPrecipitationIcon: React.FC<DynamicPrecipitationIconProps> = ({ precipitation }) => {
  // Show rain icon if there's precipitation, otherwise just a cloud
  if (precipitation > 0) {
    // Opacity based on amount of precipitation
    const opacity = Math.min(precipitation * 2, 1); // Scale it up a bit for visibility
    
    return (
      <div className="relative">
        <CloudRain 
          className="h-4 w-4 text-primary" 
          style={{
            stroke: "currentColor",
            fill: `rgba(96, 165, 250, ${opacity})`
          }}
        />
      </div>
    );
  }
  
  return <Cloud className="h-4 w-4 text-primary" />;
};

export default React.memo(DynamicPrecipitationIcon);
