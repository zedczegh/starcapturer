
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LocationMarker from './LocationMarker';
import { isCertifiedLocation } from '@/utils/locationFiltering';

interface MapMarkersProps {
  locations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent<Element>, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent<Element>) => void;
  handleTouchMove?: (e: React.TouchEvent<Element>) => void;
  useMobileOptimization?: boolean;
  isForecast?: boolean;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  locations,
  activeView,
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  useMobileOptimization = false,
  isForecast = false
}) => {
  const handleLocationClick = (location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  // For large number of markers, we can optimize rendering
  let markersToRender = locations;
  
  // When optimizing for mobile, limit number of markers
  if (useMobileOptimization && locations.length > 50) {
    // First sort by importance (certified locations first)
    const sortedLocations = [...locations].sort((a, b) => {
      // Always prioritize certified locations
      const aIsCertified = isCertifiedLocation(a);
      const bIsCertified = isCertifiedLocation(b);
      
      if (aIsCertified !== bIsCertified) {
        return aIsCertified ? -1 : 1;
      }
      
      // Then by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    });
    
    // Take all certified locations plus a limited number of other locations
    const certifiedLocations = sortedLocations.filter(loc => isCertifiedLocation(loc));
    const otherLocations = sortedLocations
      .filter(loc => !isCertifiedLocation(loc))
      .slice(0, 30); // Limit non-certified locations to 30
      
    markersToRender = [...certifiedLocations, ...otherLocations];
    
    console.log(`Optimized markers: showing ${markersToRender.length} out of ${locations.length} markers`);
  }
  
  return (
    <>
      {markersToRender.map((location) => {
        if (!location.latitude || !location.longitude || 
            Number.isNaN(location.latitude) || 
            Number.isNaN(location.longitude)) {
          return null;
        }
        
        const locationId = location.id || 
          `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        
        const isHovered = hoveredLocationId === locationId;
        const isCertified = isCertifiedLocation(location);
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={handleLocationClick}
            isHovered={isHovered}
            onHover={onMarkerHover}
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

export default React.memo(MapMarkers);
