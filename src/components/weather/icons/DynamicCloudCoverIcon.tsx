
import React from "react";
import { Cloud as CloudIcon, Sun } from "lucide-react";

interface DynamicCloudCoverIconProps {
  cloudCover: number;
  className?: string;
  precipitation?: number;
}

const DynamicCloudCoverIcon: React.FC<DynamicCloudCoverIconProps> = ({ 
  cloudCover, 
  className = "", 
  precipitation 
}) => {
  // Cloud cover opacity based on percentage
  const opacity = Math.min(0.9, Math.max(0.1, cloudCover / 100));
  
  // If precipitation is provided, adjust the cloud color
  const cloudColor = precipitation && precipitation > 20 
    ? "text-blue-400" 
    : "text-primary";
  
  return (
    <div className={`relative h-5 w-5 ${className}`}>
      {/* Show sun only for low cloud cover (less than 80%) */}
      {cloudCover < 80 && (
        <Sun className="absolute h-5 w-5 text-yellow-400" />
      )}
      <CloudIcon 
        className={`absolute h-5 w-5 ${cloudColor}`} 
        style={{ 
          opacity: cloudCover < 10 ? 0.2 : opacity,
          // Show cloud in front for high cloud cover
          zIndex: cloudCover > 70 ? 10 : 1
        }} 
      />
    </div>
  );
};

export default DynamicCloudCoverIcon;
