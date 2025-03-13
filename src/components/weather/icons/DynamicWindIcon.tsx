
import React from "react";
import { Wind } from "lucide-react";

interface DynamicWindIconProps {
  windSpeed: number;
}

const DynamicWindIcon: React.FC<DynamicWindIconProps> = ({ windSpeed }) => {
  // Wind speed thresholds (km/h)
  // Light breeze: < 20
  // Moderate wind: 20-40
  // Strong wind: > 40
  
  let strokeWidth = 1.5;
  let strokeColor = "currentColor";
  
  if (windSpeed > 40) {
    // Strong wind
    strokeWidth = 2.5;
    strokeColor = "rgba(220, 38, 38, 1)"; // Red for strong winds
  } else if (windSpeed > 20) {
    // Moderate wind
    strokeWidth = 2;
    strokeColor = "rgba(249, 115, 22, 1)"; // Orange for moderate winds
  }
  
  const animationClass = windSpeed > 30 ? "animate-pulse" : "";
  
  return (
    <div className={`relative ${animationClass}`}>
      <Wind 
        className="h-4 w-4 text-primary" 
        style={{
          stroke: strokeColor,
          strokeWidth: strokeWidth
        }}
      />
    </div>
  );
};

export default React.memo(DynamicWindIcon);
