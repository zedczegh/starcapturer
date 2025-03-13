
import React from "react";
import { MapPin } from "lucide-react";

interface MapMarkerProps {
  name: string;
  placeDetails?: string;
  onClick: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({ name, placeDetails, onClick }) => {
  return (
    <li
      className="cursor-pointer hover:bg-accent/50 transition-colors px-3 py-2"
      onClick={onClick}
    >
      <div className="flex items-start">
        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-primary/80" />
        <div className="w-full">
          <div className="font-medium">{name}</div>
          {placeDetails && (
            <div className="text-xs text-muted-foreground break-words">
              {placeDetails}
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default MapMarker;
