
import React from "react";
import { EyeIcon } from "lucide-react";

interface DynamicSeeingIconProps {
  seeingValue: number;
  className?: string;
}

const DynamicSeeingIcon: React.FC<DynamicSeeingIconProps> = ({ seeingValue, className }) => {
  // Calculate color based on seeing quality
  // Lower seeing values are better (less atmospheric disturbance)
  const getSeeingColor = () => {
    if (seeingValue <= 1.5) return "text-green-400"; // Excellent
    if (seeingValue <= 2.5) return "text-teal-400";  // Good
    if (seeingValue <= 3.5) return "text-yellow-400"; // Fair
    return "text-red-400"; // Poor
  };
  
  const iconColor = getSeeingColor();
  
  return (
    <div className={`relative ${className || ''}`}>
      <EyeIcon className={`h-5 w-5 ${iconColor}`} />
    </div>
  );
};

export default DynamicSeeingIcon;
