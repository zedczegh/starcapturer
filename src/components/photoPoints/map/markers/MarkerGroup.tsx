
import React from 'react';
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { LocationMarker } from '../MarkerComponents';

interface MarkerGroupProps {
  locations: SharedAstroSpot[];
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  isCertified: boolean;
  hideMarkerPopups: boolean;
}

const MarkerGroup: React.FC<MarkerGroupProps> = ({ 
  locations, 
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  isCertified,
  hideMarkerPopups
}) => {
  return (
    <>
      {locations.map((location) => {
        // Only render markers with valid coordinates
        if (!location || 
            typeof location.latitude !== 'number' || 
            typeof location.longitude !== 'number' ||
            isNaN(location.latitude) || 
            isNaN(location.longitude)) {
          return null;
        }
        
        // Generate a unique ID for this location
        const locationId = location.id || 
          `location-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        
        // Handle the click event for this marker
        const handleClick = () => {
          if (onLocationClick) {
            onLocationClick(location);
          }
        };
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={handleClick}
            isHovered={hoveredLocationId === locationId && !hideMarkerPopups}
            onHover={hideMarkerPopups ? () => {} : onMarkerHover}
            locationId={locationId}
            isCertified={isCertified}
          />
        );
      })}
    </>
  );
};

export default React.memo(MarkerGroup);
