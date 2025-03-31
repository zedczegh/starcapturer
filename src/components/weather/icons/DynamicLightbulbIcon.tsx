
import React from "react";
import { Lightbulb } from "lucide-react";

interface DynamicLightbulbIconProps {
  quality: number;  // 0-100 scale where 100 is best
  className?: string;
}

const DynamicLightbulbIcon: React.FC<DynamicLightbulbIconProps> = ({ quality, className }) => {
  // Determine color based on quality
  const getColor = () => {
    if (quality >= 80) return "text-green-400";  // Excellent
    if (quality >= 60) return "text-lime-400";   // Good
    if (quality >= 40) return "text-yellow-400"; // Fair
    if (quality >= 20) return "text-orange-400"; // Poor
    return "text-red-400";                     // Bad
  };
  
  // Determine opacity based on quality
  const getOpacity = () => {
    return Math.max(0.3, quality / 100);
  };
  
  const color = getColor();
  const opacity = getOpacity();
  
  return (
    <div className={`relative ${className || ''}`}>
      <Lightbulb 
        className={`h-5 w-5 ${color}`} 
        style={{ 
          fill: `rgba(255, 255, 0, ${opacity})`, 
          filter: `brightness(${1 + opacity})` 
        }} 
      />
    </div>
  );
};

export default DynamicLightbulbIcon;
