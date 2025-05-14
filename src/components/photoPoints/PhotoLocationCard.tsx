
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { cn } from "@/lib/utils";

// Update the props interface to include onClick
export interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  className?: string;
  onClick?: () => void;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  className,
  onClick 
}) => {
  // Component implementation
  return (
    <div 
      className={cn("relative bg-slate-800/50 rounded-lg overflow-hidden cursor-pointer", className)}
      onClick={onClick}
    >
      {/* Your existing card content */}
      <div className="p-3">
        <h3 className="font-medium text-sm">{location.name || "Unnamed Location"}</h3>
        {location.siqs && (
          <div className="text-xs text-gray-300 mt-1">
            SIQS: {location.siqs.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoLocationCard;
