
import React, { useEffect, useCallback, useMemo, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';
import MarkerEventHandler from './MarkerEventHandler';
import { isWaterSpot, getLocationMarker } from './markers/markerUtils';
import { isValidAstronomyLocation } from '@/utils/locationValidator';
import { useMarkerEvents } from './markers/useMarkerEvents';
import LocationPopupContent from './markers/LocationPopupContent';
import UserLocationMarker from './markers/UserLocationMarker';

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
}

const LocationMarker = memo(({ 
  location, 
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified,
  activeView,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}: LocationMarkerProps) => {
  const isMobile = useIsMobile();
  
  // Skip rendering calculated locations in certified view
  if (activeView === 'certified' && !isCertified) {
    return null;
  }
  
  // Enhanced water location filtering with multiple checks
  if (!isCertified) {
    // Apply strict water detection to calculated spots
    if (isWaterSpot(location)) {
      return null;
    }
    
    // Extra safety check using our general validator
    if (!isValidAstronomyLocation(location.latitude, location.longitude, location.name)) {
      return null;
    }
  }
  
  // Create the correct marker icon based on location type, hover state, and device type
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered, isMobile);
  }, [location, isCertified, isHovered, isMobile]);
  
  // Handle click event
  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);
  
  // Get marker event handlers
  const { markerRef, eventMap } = useMarkerEvents({
    locationId,
    onHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  });
  
  // Only handle visual styling on hover, no auto-popup
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    
    if (isHovered) {
      marker.getElement()?.classList.add('hovered');
    } else {
      marker.getElement()?.classList.remove('hovered');
    }
  }, [isHovered]);

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      ref={markerRef}
      onClick={handleClick}
    >
      <MarkerEventHandler 
        marker={markerRef.current}
        eventMap={eventMap}
      />
      
      <Popup 
        closeOnClick={false}
        autoClose={false}
      >
        <LocationPopupContent 
          location={location}
          locationId={locationId}
          isCertified={isCertified}
        />
      </Popup>
    </Marker>
  );
});

LocationMarker.displayName = 'LocationMarker';

export { LocationMarker, UserLocationMarker };
