
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { MapPin } from "lucide-react";

interface LocationHeaderMainDisplayProps {
  // The main, prominent name for the card (certified/official/enhanced, etc.)
  mainName: string;
  // The original name (for subtitle/smaller font)
  originalName?: string;
  // If true, show the original name; may be empty if it's same as mainName
  showOriginalName?: boolean;
}

const LocationHeaderMainDisplay: React.FC<LocationHeaderMainDisplayProps> = ({
  mainName,
  originalName,
  showOriginalName,
}) => (
  <div>
    <h3 className="font-semibold text-lg line-clamp-1">{mainName}</h3>
    {showOriginalName && originalName && (
      <div className="mt-1.5 mb-2 flex items-center">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
        <span className="text-xs text-muted-foreground line-clamp-1">
          {originalName}
        </span>
      </div>
    )}
  </div>
);

export default LocationHeaderMainDisplay;
