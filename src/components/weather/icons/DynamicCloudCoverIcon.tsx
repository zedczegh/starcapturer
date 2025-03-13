
import React from "react";
import { Cloud } from "lucide-react";

interface DynamicCloudCoverIconProps {
  cloudCover: number;
  className?: string;
}

const DynamicCloudCoverIcon: React.FC<DynamicCloudCoverIconProps> = ({ cloudCover, className }) => {
  // Calculate fill based on cloud cover percentage
  const fillOpacity = cloudCover / 100;
  
  return (
    <div className={`relative ${className || ''}`}>
      <Cloud 
        className="h-4 w-4 text-primary" 
        style={{
          fill: `rgba(148, 163, 184, ${fillOpacity})`,
          stroke: "currentColor"
        }}
      />
    </div>
  );
};

export default React.memo(DynamicCloudCoverIcon);
