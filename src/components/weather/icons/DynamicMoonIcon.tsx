
import React, { useMemo } from "react";
import { Moon } from "lucide-react";

interface DynamicMoonIconProps {
  phase: string;
  className?: string;
}

const DynamicMoonIcon: React.FC<DynamicMoonIconProps> = ({ phase, className }) => {
  // Calculate fill percentage based on moon phase in both English and Chinese
  const fillPercentage = useMemo(() => {
    // Support both English and Chinese moon phase names
    const isFullMoon = phase.includes("Full") || phase.includes("满月");
    const isGibbous = phase.includes("Gibbous") || phase.includes("凸月");
    const isQuarter = phase.includes("Quarter") || phase.includes("弦月");
    const isCrescent = phase.includes("Crescent") || phase.includes("眉月") || phase.includes("残月");
    const isNewMoon = phase.includes("New") || phase.includes("新月");
    const isWaxing = phase.includes("Waxing") || phase.includes("上弦") || phase.includes("眉月");
    
    if (isFullMoon) {
      return 100;
    } else if (isGibbous) {
      return isWaxing ? 75 : 65;
    } else if (isQuarter) {
      return 50;
    } else if (isCrescent) {
      return isWaxing ? 25 : 15;
    } else if (isNewMoon) {
      return 0;
    }
    
    // Default to 50% if we can't determine the phase
    return 50;
  }, [phase]);
  
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

export default React.memo(DynamicMoonIcon);
