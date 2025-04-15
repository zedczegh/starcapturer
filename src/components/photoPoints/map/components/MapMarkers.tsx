
import React, { useCallback } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
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

  const handleTouch = useCallback((e: React.TouchEvent<Element>, id: string) => {
    if (handleTouchStart) handleTouchStart(e, id);
  }, [handleTouchStart]);

  const handleEnd = useCallback((e: React.TouchEvent<Element>) => {
    if (handleTouchEnd) handleTouchEnd(e);
  }, [handleTouchEnd]);

  const handleMove = useCallback((e: React.TouchEvent<Element>) => {
    if (handleTouchMove) handleTouchMove(e);
  }, [handleTouchMove]);

  const handleClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) onLocationClick(location);
  }, [onLocationClick]);

  return (
    <>
      {/* Render location markers */}
      {locations.map((location) => (
        <LocationMarker
          key={location.id || `${location.latitude}-${location.longitude}`}
          location={location}
          activeView={activeView}
          isHovered={hoveredLocationId === location.id}
          onClick={handleClick}
          onHover={handleHover}
          onTouchStart={handleTouch}
          onTouchEnd={handleEnd}
          onTouchMove={handleMove}
        />
      ))}

      {/* Render user location marker if available */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
          siqs={currentSiqs}
        />
      )}
    </>
  );
};

export default MapMarkers;
