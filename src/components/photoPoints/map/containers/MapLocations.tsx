
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker } from '../MarkerComponents';

interface MapLocationsProps {
  locations: SharedAstroSpot[];
  onLocationClick: (location: SharedAstroSpot) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile: boolean;
  activeView: 'certified' | 'calculated';
}

const MapLocations: React.FC<MapLocationsProps> = ({
  locations,
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  activeView
}) => {
  // Added debug log to track locations
  console.log(`MapLocations rendering ${locations.length} locations for ${activeView} view`);
  
  return (
    <>
      {locations.map(location => {
        if (!location.latitude || !location.longitude) return null;
        
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        const isHovered = hoveredLocationId === locationId;
        
        // Limit non-certified locations on mobile only if there are many locations
        // Modified to be less aggressive with filtering to ensure calculated spots appear
        if (isMobile && !isCertified && locations.length > 50 && Math.random() > 0.7) {
          return null;
        }
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={onLocationClick}
            isHovered={isHovered}
            onHover={onMarkerHover || (() => {})}
            locationId={locationId}
            isCertified={isCertified}
            activeView={activeView}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
          />
        );
      })}
    </>
  );
};

export default MapLocations;
