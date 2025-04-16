
import React, { useMemo } from "react";
import { Moon } from "lucide-react";

interface DynamicMoonIconProps {
  phase: string;
  className?: string;
}

const DynamicMoonIcon: React.FC<DynamicMoonIconProps> = ({ phase, className }) => {
  // Calculate fill percentage based on moon phase in both English and Chinese
  const fillPercentage = useMemo(() => {
    if (!phase) return 50; // Default to half moon if no phase provided
    
    // Support both numeric values and string names
    if (typeof phase === 'number') {
      return phase * 100; // If it's already a normalized value between 0-1
    }
    
    // Exact phrase matching for better accuracy
    const phaseLower = phase.toLowerCase();
    
    // Full moon
    if (phaseLower.includes("full") || phaseLower.includes("满月")) {
      return 100;
    }
    
    // New moon
    if (phaseLower.includes("new") || phaseLower.includes("新月")) {
      return 0;
    }
    
    // Waxing (growing) phases
    if (phaseLower.includes("waxing") || phaseLower.includes("上弦") || phaseLower.includes("眉月") || phaseLower.includes("盈凸")) {
      if (phaseLower.includes("crescent") || phaseLower.includes("眉月")) {
        return 25; // Waxing crescent
      }
      if (phaseLower.includes("gibbous") || phaseLower.includes("凸月") || phaseLower.includes("盈凸")) {
        return 75; // Waxing gibbous
      }
    }
    
    // Waning (shrinking) phases
    if (phaseLower.includes("waning") || phaseLower.includes("下弦") || phaseLower.includes("残月") || phaseLower.includes("亏凸")) {
      if (phaseLower.includes("crescent") || phaseLower.includes("残月")) {
        return 15; // Waning crescent
      }
      if (phaseLower.includes("gibbous") || phaseLower.includes("凸月") || phaseLower.includes("亏凸")) {
        return 65; // Waning gibbous
      }
    }
    
    // Quarter phases
    if (phaseLower.includes("quarter") || phaseLower.includes("弦月")) {
      if (phaseLower.includes("first") || phaseLower.includes("上弦")) {
        return 50; // First quarter
      }
      if (phaseLower.includes("last") || phaseLower.includes("下弦")) {
        return 50; // Last quarter (visually similar but different side)
      }
      return 50; // Generic quarter
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
