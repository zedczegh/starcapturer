
import React from "react";
import PhotoLocationCard from "../PhotoLocationCard";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Update the props interface to include initialLoad and onViewDetails
interface LocationsGridProps {
  locations: SharedAstroSpot[];
  initialLoad?: boolean; 
  isMobile?: boolean;
  onViewDetails: (point: SharedAstroSpot) => void;
}

const LocationsGrid: React.FC<LocationsGridProps> = ({
  locations,
  initialLoad = false,
  isMobile = false,
  onViewDetails,
}) => {
  if (!locations || locations.length === 0) {
    return (
      <div className="text-center p-4 text-gray-400">
        No locations found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 pb-4">
      {locations.map((location) => (
        <PhotoLocationCard
          key={location.id || `${location.latitude}-${location.longitude}`}
          location={location}
          onClick={() => onViewDetails(location)}
        />
      ))}
    </div>
  );
};

export default LocationsGrid;
