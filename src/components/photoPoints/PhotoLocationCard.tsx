
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { cn } from "@/lib/utils";
import { getSiqsScore } from "@/utils/siqsHelpers";

export interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  className?: string;
  onClick?: () => void;
  index?: number; // Add index prop
  onViewDetails?: (location: SharedAstroSpot) => void; // Add view details prop
  showRealTimeSiqs?: boolean; // Add real time SIQS prop
  showBortleScale?: boolean; // Add bortle scale prop
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  className,
  onClick,
  index, 
  onViewDetails,
  showRealTimeSiqs,
  showBortleScale
}) => {
  // Handle click event
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onViewDetails) {
      onViewDetails(location);
    }
  };
  
  // Extract SIQS value safely whether it's a number or object
  const siqsValue = location.siqs ? getSiqsScore(location.siqs) : null;
  
  // Component implementation
  return (
    <div 
      className={cn("relative bg-slate-800/50 rounded-lg overflow-hidden cursor-pointer", className)}
      onClick={handleClick}
    >
      {/* Your existing card content */}
      <div className="p-3">
        <h3 className="font-medium text-sm">{location.name || "Unnamed Location"}</h3>
        {siqsValue !== null && (
          <div className="text-xs text-gray-300 mt-1">
            SIQS: {siqsValue.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoLocationCard;
