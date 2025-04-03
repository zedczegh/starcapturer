
import React from "react";
import { Sun } from "lucide-react";

interface DynamicSunIconProps {
  strength?: number;
  className?: string;
}

const DynamicSunIcon: React.FC<DynamicSunIconProps> = ({ 
  strength = 0.5, 
  className 
}) => {
  // Normalize strength between 0 and 1
  const normalizedStrength = Math.min(1, Math.max(0, strength));
  
  // Calculate fill color based on strength
  // Higher strength = more yellow/orange
  const fillColor = `rgba(255, ${200 - normalizedStrength * 50}, 0, ${normalizedStrength * 0.7})`;
  
  return (
    <div className={`relative ${className || ''}`}>
      <Sun 
        className="h-4 w-4 text-primary" 
        style={{
          fill: fillColor,
          stroke: "currentColor"
        }}
      />
    </div>
  );
};

export default React.memo(DynamicSunIcon);
