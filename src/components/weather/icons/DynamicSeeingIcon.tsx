
import React from "react";
import { Eye } from "lucide-react";

interface DynamicSeeingIconProps {
  seeingConditions: string | number;
  className?: string;
}

const DynamicSeeingIcon: React.FC<DynamicSeeingIconProps> = ({ seeingConditions, className }) => {
  // Calculate fill based on seeing quality
  let fillColor = "rgba(96, 165, 250, 0.5)"; // Default blue for average seeing
  
  if (typeof seeingConditions === "string") {
    const seeingLower = seeingConditions.toLowerCase();
    
    if (seeingLower.includes("excellent") || seeingLower.includes("very good")) {
      fillColor = "rgba(34, 197, 94, 0.7)"; // Green for excellent seeing
    } else if (seeingLower.includes("good")) {
      fillColor = "rgba(59, 130, 246, 0.7)"; // Blue for good seeing
    } else if (seeingLower.includes("poor") || seeingLower.includes("bad")) {
      fillColor = "rgba(249, 115, 22, 0.7)"; // Orange for poor seeing
    } else if (seeingLower.includes("terrible")) {
      fillColor = "rgba(239, 68, 68, 0.7)"; // Red for terrible seeing
    }
  } else if (typeof seeingConditions === "number") {
    // Numeric scale (typically 1-5 or 1-10)
    // Normalize to a 1-5 scale if it seems to be on a different scale
    const normalizedValue = seeingConditions > 10 ? seeingConditions / 20 : 
                          seeingConditions > 5 ? seeingConditions / 2 : 
                          seeingConditions;
    
    if (normalizedValue >= 4.5) {
      fillColor = "rgba(34, 197, 94, 0.7)"; // Green for excellent seeing (4.5-5)
    } else if (normalizedValue >= 3.5) {
      fillColor = "rgba(59, 130, 246, 0.7)"; // Blue for good seeing (3.5-4.4)
    } else if (normalizedValue >= 2.5) {
      fillColor = "rgba(234, 179, 8, 0.7)"; // Yellow for average seeing (2.5-3.4)
    } else if (normalizedValue >= 1.5) {
      fillColor = "rgba(249, 115, 22, 0.7)"; // Orange for poor seeing (1.5-2.4)
    } else {
      fillColor = "rgba(239, 68, 68, 0.7)"; // Red for terrible seeing (<1.5)
    }
  }
  
  return (
    <div className={`relative ${className || ''}`}>
      <Eye 
        className="h-4 w-4 text-primary" 
        style={{
          fill: fillColor,
          stroke: "currentColor"
        }}
      />
    </div>
  );
};

export default React.memo(DynamicSeeingIcon);
