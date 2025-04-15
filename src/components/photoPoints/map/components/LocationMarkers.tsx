
import React, { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker } from '../MarkerComponents';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';

interface LocationMarkersProps {
  locations: SharedAstroSpot[];
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  hideMarkerPopups: boolean;
  activeView: 'certified' | 'calculated';
  isCertifiedView: boolean;
}

export const LocationMarkers: React.FC<LocationMarkersProps> = ({
  locations,
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  hideMarkerPopups,
  activeView,
  isCertifiedView
}) => {
  // Pre-filter locations to avoid rendering water spots
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      if (!location || !hasValidCoordinates(location)) return false;
      if (isCertifiedView) return true;
      return !isWaterSpot(location) && isValidAstronomyLocation(location.latitude, location.longitude, location.name);
    });
  }, [locations, isCertifiedView]);

  return (
    <>
      {filteredLocations.map((location) => {
        const locationId = getLocationId(location);
        const locationIsCertified = isCertified(location);
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={() => onLocationClick?.(location)}
            isHovered={hoveredLocationId === locationId && !hideMarkerPopups}
            onHover={hideMarkerPopups ? () => {} : onMarkerHover}
            locationId={locationId}
            isCertified={locationIsCertified}
            activeView={activeView}
          />
        );
      })}
    </>
  );
};

// Helper functions
const hasValidCoordinates = (location: SharedAstroSpot): boolean => {
  return !!(location.latitude && 
          location.longitude && 
          !isNaN(location.latitude) && 
          !isNaN(location.longitude) &&
          Math.abs(location.latitude) <= 90 &&
          Math.abs(location.longitude) <= 180);
};

const isWaterSpot = (location: SharedAstroSpot): boolean => {
  return isWaterLocation(location.latitude, location.longitude, false);
};

const getLocationId = (location: SharedAstroSpot): string => {
  return location.id || 
    `location-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
};

const isCertified = (location: SharedAstroSpot): boolean => {
  return location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== '');
};
