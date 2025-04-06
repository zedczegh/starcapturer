
import React, { useEffect, useCallback, useRef, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';

// Create different marker styles for certified vs calculated locations
const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean) => {
  if (isCertified) {
    // For certified locations, use a star-shaped marker with gold/yellow color
    return createCustomMarker('#FFD700', 'star');
  } else {
    // For calculated locations, use the color based on SIQS with circle shape
    const color = location.siqs ? getProgressColor(location.siqs) : '#777777';
    return createCustomMarker(color, 'circle');
  }
};

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
}

const LocationMarker = memo(({ 
  location, 
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified
}: LocationMarkerProps) => {
  const { language } = useLanguage();
  const markerRef = useRef<L.Marker | null>(null);
  
  // Create the correct marker icon based on location type
  const icon = getLocationMarker(location, isCertified);
  
  // Handle click event
  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);
  
  // Handle hover events with debouncing
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
  }, [onHover]);
  
  // Effect to manage popup state based on hover
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    
    if (isHovered) {
      marker.openPopup();
    } else {
      marker.closePopup();
    }
  }, [isHovered]);
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      ref={markerRef}
      // Fix: Use onClick and onMouseOver props directly instead of eventHandlers
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <Popup 
        // Fix: Use properties that match react-leaflet API
        autoClose={false}
        closeOnClick={false}
      >
        <div className="p-1.5 max-w-[160px] leaflet-popup-custom-compact">
          <div className="font-medium text-xs">
            {language === 'zh' && location.chineseName 
              ? location.chineseName 
              : location.name}
          </div>
          
          {/* Show certification badge for certified locations */}
          {isCertified && location.certification && (
            <div className="mt-1 text-2xs font-medium text-amber-600">
              {location.certification}
            </div>
          )}
          
          {/* SIQS Score Badge */}
          {location.siqs !== undefined && (
            <div className="mt-1 flex items-center gap-1">
              <SiqsScoreBadge score={location.siqs} compact={true} />
              {location.distance && (
                <span className="text-xs text-muted-foreground">
                  {location.distance < 1 
                    ? `${(location.distance * 1000).toFixed(0)}m`
                    : `${location.distance.toFixed(1)}km`}
                </span>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

LocationMarker.displayName = 'LocationMarker';

// User location marker component
const UserLocationMarker = memo(({ 
  position, 
  currentSiqs 
}: { 
  position: [number, number], 
  currentSiqs: number | null 
}) => {
  const { t } = useLanguage();
  const userMarkerIcon = createCustomMarker('#9b87f5', 'user');
  
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Popup>
        <div className="p-1 leaflet-popup-custom">
          <strong>{t("Your Location", "您的位置")}</strong>
          <div className="text-xs mt-1">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {currentSiqs !== null && (
            <div className="text-xs mt-1">
              SIQS: <span className="font-medium">{currentSiqs.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export { LocationMarker, UserLocationMarker };
