
import React from "react";
import { cn } from "@/lib/utils";

interface LightPollutionIndicatorProps {
  bortleScale: number;
  showBortleNumber?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LightPollutionIndicator: React.FC<LightPollutionIndicatorProps> = ({
  bortleScale,
  showBortleNumber = false,
  size = 'md',
  className
}) => {
  // Ensure valid Bortle scale
  const validBortleScale = Math.min(9, Math.max(1, bortleScale || 5));
  
  // Get color based on Bortle scale
  const getColor = () => {
    if (validBortleScale <= 1) return "bg-sky-900/70 text-sky-300";
    if (validBortleScale <= 2) return "bg-blue-900/70 text-blue-300";
    if (validBortleScale <= 3) return "bg-teal-900/70 text-teal-300";
    if (validBortleScale <= 4) return "bg-green-900/70 text-green-300";
    if (validBortleScale <= 5) return "bg-lime-900/70 text-lime-300";
    if (validBortleScale <= 6) return "bg-yellow-900/70 text-yellow-300";
    if (validBortleScale <= 7) return "bg-amber-900/70 text-amber-300";
    if (validBortleScale <= 8) return "bg-orange-900/70 text-orange-300";
    return "bg-red-900/70 text-red-300";
  };
  
  // Get label based on Bortle scale
  const getLabel = () => {
    if (validBortleScale <= 1) return "Excellent dark sky";
    if (validBortleScale <= 2) return "Truly dark sky";
    if (validBortleScale <= 3) return "Rural sky";
    if (validBortleScale <= 4) return "Rural/suburban transition";
    if (validBortleScale <= 5) return "Suburban sky";
    if (validBortleScale <= 6) return "Bright suburban sky";
    if (validBortleScale <= 7) return "Suburban/urban transition";
    if (validBortleScale <= 8) return "City sky";
    return "Inner-city sky";
  };
  
  // Size classes
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-2.5 py-1.5"
  };
  
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded font-medium border",
        getColor(),
        sizeClasses[size],
        "border-opacity-50 shadow-sm",
        className
      )}
    >
      {showBortleNumber ? (
        <span>
          Bortle {validBortleScale.toFixed(1)} - {getLabel()}
        </span>
      ) : (
        <span>{getLabel()}</span>
      )}
    </div>
  );
};

export default LightPollutionIndicator;
