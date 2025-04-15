
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker, UserLocationMarker } from '../MarkerComponents';

interface MapMarkersProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  hoveredLocationId?: string | null;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent<Element>, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent<Element>) => void;
  handleTouchMove?: (e: React.TouchEvent<Element>, touchStartPos: any) => any;
  currentSiqs: number | null;
}

/**
 * MapMarkers - Renders all markers on the map
 */
const MapMarkers: React.FC<MapMarkersProps> = ({
  userLocation,
  locations,
  activeView,
  hoveredLocationId,
  onLocationClick,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  currentSiqs
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

export default MapMarkers;
