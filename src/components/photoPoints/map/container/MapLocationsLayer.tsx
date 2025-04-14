
import React from 'react';
import { LocationMarker, UserLocationMarker } from '../MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface MapLocationsLayerProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  hoveredLocationId?: string | null;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMarkerHover: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  currentSiqs: number | null;
  activeView: 'certified' | 'calculated';
}

/**
 * Component that renders all location markers on the map
 */
const MapLocationsLayer: React.FC<MapLocationsLayerProps> = ({
  userLocation,
  locations,
  hoveredLocationId,
  onLocationClick,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  currentSiqs,
  activeView
}) => {
  return (
    <>
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
          currentSiqs={currentSiqs}
        />
      )}
      
      {locations.map(location => {
        if (!location.latitude || !location.longitude) return null;
        
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        const isHovered = hoveredLocationId === locationId;
        
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

export default MapLocationsLayer;
