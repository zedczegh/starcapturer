
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
  return (
    <>
      {locations.map(location => {
        if (!location.latitude || !location.longitude) return null;
        
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        const isHovered = hoveredLocationId === locationId;
        
        if (isMobile && !isCertified && locations.length > 30 && Math.random() > 0.5) {
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
