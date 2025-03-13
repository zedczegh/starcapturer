
import React from "react";
import { Moon } from "lucide-react";

interface DynamicMoonIconProps {
  phase: string;
}

const DynamicMoonIcon: React.FC<DynamicMoonIconProps> = ({ phase }) => {
  // Calculate fill percentage based on moon phase
  let fillPercentage = 0;
  
  if (phase.includes("Full")) {
    fillPercentage = 100;
  } else if (phase.includes("Gibbous")) {
    fillPercentage = phase.includes("Waxing") ? 75 : 65;
  } else if (phase.includes("Quarter")) {
    fillPercentage = 50;
  } else if (phase.includes("Crescent")) {
    fillPercentage = phase.includes("Waxing") ? 25 : 15;
  } else if (phase.includes("New")) {
    fillPercentage = 0;
  }
  
  return (
    <div className="relative">
      <Moon 
        className="h-4 w-4 text-primary" 
        style={{
          fill: `rgba(139, 92, 246, ${fillPercentage / 100})`,
          stroke: fillPercentage === 0 ? "currentColor" : "none"
        }}
      />
    </div>
  );
};

export default DynamicMoonIcon;
