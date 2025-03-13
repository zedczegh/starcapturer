
import React from "react";
import { Moon } from "lucide-react";

interface DynamicMoonIconProps {
  phase: string;
  className?: string;
}

const DynamicMoonIcon: React.FC<DynamicMoonIconProps> = ({ phase, className }) => {
  // Calculate fill percentage based on moon phase in both English and Chinese
  let fillPercentage = 0;
  
  // Support both English and Chinese moon phase names
  const isFullMoon = phase.includes("Full") || phase.includes("满月");
  const isGibbous = phase.includes("Gibbous") || phase.includes("凸月");
  const isQuarter = phase.includes("Quarter") || phase.includes("弦月");
  const isCrescent = phase.includes("Crescent") || phase.includes("眉月") || phase.includes("残月");
  const isNewMoon = phase.includes("New") || phase.includes("新月");
  const isWaxing = phase.includes("Waxing") || phase.includes("上弦") || phase.includes("眉月");
  
  if (isFullMoon) {
    fillPercentage = 100;
  } else if (isGibbous) {
    fillPercentage = isWaxing ? 75 : 65;
  } else if (isQuarter) {
    fillPercentage = 50;
  } else if (isCrescent) {
    fillPercentage = isWaxing ? 25 : 15;
  } else if (isNewMoon) {
    fillPercentage = 0;
  }
  
  return (
    <div className="relative">
      <Moon 
        className={`h-4 w-4 text-primary ${className || ''}`} 
        style={{
          fill: `rgba(139, 92, 246, ${fillPercentage / 100})`,
          stroke: fillPercentage === 0 ? "currentColor" : "none"
        }}
      />
    </div>
  );
};

export default DynamicMoonIcon;
