
import React, { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker, UserLocationMarker } from '../MarkerComponents';

interface MapMarkersProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  hoveredLocationId?: string | null;
  currentSiqs?: number | null;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent<Element>, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent<Element>) => void;
  handleTouchMove?: (e: React.TouchEvent<Element>) => void;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  userLocation,
  locations,
  activeView,
  hoveredLocationId,
  currentSiqs,
  onLocationClick,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}) => {
  // Safe handlers that check if callbacks exist first
  const handleHover = useCallback((id: string | null) => {
    if (onMarkerHover) onMarkerHover(id);
  }, [onMarkerHover]);

  const handleClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) onLocationClick(location);
  }, [onLocationClick]);

  return (
    <>
      {/* Render location markers */}
      {locations.map((location) => {
        const locationId = location.id || `${location.latitude}-${location.longitude}`;
        // Check for certification properties to determine if location is certified
        const isCertified = !!location.isDarkSkyReserve || !!location.certification;
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            activeView={activeView}
            isHovered={hoveredLocationId === locationId}
            onClick={handleClick}
            onHover={handleHover}
            locationId={locationId}
            isCertified={isCertified}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
          />
        );
      })}

      {/* Render user location marker if available */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
          currentSiqs={currentSiqs}
        />
      )}
    </>
  );
};

export default MapMarkers;
