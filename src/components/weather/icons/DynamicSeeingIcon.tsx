
import React from "react";
import { Eye } from "lucide-react";

interface DynamicSeeingIconProps {
  seeingConditions: string;
  className?: string;
}

const DynamicSeeingIcon: React.FC<DynamicSeeingIconProps> = ({ seeingConditions, className }) => {
  // Extract numeric part from seeing conditions string if possible
  let seeingValue = 3; // Default middle value
  
  if (typeof seeingConditions === 'string') {
    // Try to extract a number from the string
    const match = seeingConditions.match(/([1-5](\.[0-9])?)/);
    if (match) {
      seeingValue = parseFloat(match[0]);
    } else if (seeingConditions.includes("Perfect") || seeingConditions.includes("完美")) {
      seeingValue = 1;
    } else if (seeingConditions.includes("Excellent") || seeingConditions.includes("极佳")) {
      seeingValue = 1.5;
    } else if (seeingConditions.includes("Good") || seeingConditions.includes("良好")) {
      seeingValue = 2;
    } else if (seeingConditions.includes("Fair") || seeingConditions.includes("尚可")) {
      seeingValue = 3;
    } else if (seeingConditions.includes("Poor") || seeingConditions.includes("较差")) {
      seeingValue = 4;
    } else if (seeingConditions.includes("Terrible") || seeingConditions.includes("极差")) {
      seeingValue = 5;
    }
  }
  
  // Invert scale (1 is best seeing, 5 is worst)
  // For color: good seeing (low number) = blue, bad seeing (high number) = red
  const invertedValue = 6 - seeingValue; // 5 to 1 scale
  const blueValue = Math.round((invertedValue / 5) * 255);
  const redValue = Math.round(((5 - invertedValue) / 5) * 255);
  
  // Calculate opacity based on seeing (better seeing = more transparent)
  const fillOpacity = (seeingValue - 1) / 4; // Scale 1-5 to 0-1
  
  return (
    <div className={`relative ${className || ''}`}>
      <Eye 
        className="h-4 w-4 text-primary" 
        style={{
          fill: `rgba(${redValue}, ${Math.min(blueValue, 150)}, ${blueValue}, ${fillOpacity})`,
          stroke: "currentColor"
        }}
      />
    </div>
  );
};

export default React.memo(DynamicSeeingIcon);
