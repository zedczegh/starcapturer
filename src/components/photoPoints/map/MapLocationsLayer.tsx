
import React from 'react';
import { useEffect, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker } from './MarkerComponents';

interface MapLocationsLayerProps {
  locations: SharedAstroSpot[];
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
}

export const MapLocationsLayer: React.FC<MapLocationsLayerProps> = ({
  locations,
  onLocationClick,
  hoveredLocationId,
  onMarkerHover
}) => {
  const [displayLocations, setDisplayLocations] = useState<SharedAstroSpot[]>([]);

  useEffect(() => {
    // Ensure we have valid locations
    if (!locations || !Array.isArray(locations)) {
      console.warn('Invalid locations provided to MapLocationsLayer');
      setDisplayLocations([]);
      return;
    }

    // Filter out invalid locations
    const validLocations = locations.filter(
      loc => loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
    );
    
    setDisplayLocations(validLocations);
  }, [locations]);

  const handleLocationClick = (location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  return (
    <>
      {displayLocations.map(location => {
        if (!location || !location.latitude || !location.longitude) return null;
        
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const locationId = location.id || `loc-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`;
        const isHovered = hoveredLocationId === locationId;
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={handleLocationClick}
            isHovered={isHovered}
            onHover={onMarkerHover || (() => {})}
            locationId={locationId}
            isCertified={isCertified}
            activeView={'calculated'}
          />
        );
      })}
    </>
  );
};

export default MapLocationsLayer;
