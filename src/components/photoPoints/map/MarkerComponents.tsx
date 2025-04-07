
import React, { useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { MapTooltip } from '@/components/ui/tooltip';

// Create different marker styles for certified vs calculated locations
const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isHovered: boolean) => {
  if (isCertified) {
    // For certified locations, use a star-shaped marker with gold/yellow color
    return createCustomMarker('#FFD700', 'star');
  } else {
    // For calculated locations, use the color based on SIQS with circle shape
    const color = location.siqs ? getProgressColor(location.siqs) : '#777777';
    return createCustomMarker(color, 'circle');
  }
};

// Get SIQS quality label
const getSiqsQualityLabel = (siqs: number, language: string): string => {
  if (siqs >= 80) return language === 'en' ? 'Excellent' : '极佳';
  if (siqs >= 60) return language === 'en' ? 'Good' : '良好';
  if (siqs >= 40) return language === 'en' ? 'Fair' : '一般';
  if (siqs >= 20) return language === 'en' ? 'Poor' : '较差';
  return language === 'en' ? 'Bad' : '很差';
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
  const { language, t } = useLanguage();
  const markerRef = useRef<L.Marker | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);
  const hasTooltipOpenedRef = useRef<boolean>(false);
  
  // Create the correct marker icon based on location type and hover state
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered);
  }, [location, isCertified, isHovered]);
  
  // Get location name in current language
  const locationName = useMemo(() => {
    return language === 'zh' && location.chineseName 
      ? location.chineseName 
      : location.name;
  }, [language, location.chineseName, location.name]);

  // Get SIQS quality text for tooltip
  const siqsQuality = useMemo(() => {
    if (location.siqs === undefined) return '';
    return getSiqsQualityLabel(location.siqs, language);
  }, [location.siqs, language]);
  
  // Handle click event
  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);
  
  // Handle hover events with improved hover handling
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
    
    // Add hovered class to marker for style enhancement
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
    
    // Track that tooltip has been opened
    hasTooltipOpenedRef.current = true;
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
    
    // Remove hovered class
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.remove('hovered');
    }
    
    // Reset tooltip state
    hasTooltipOpenedRef.current = false;
  }, [onHover]);
  
  // Effect to manage popup/tooltip state based on hover
  useEffect(() => {
    const marker = markerRef.current;
    const tooltip = tooltipRef.current;
    
    if (!marker) return;
    
    if (isHovered) {
      marker.openPopup();
      marker.getElement()?.classList.add('hovered');
      
      // Make sure tooltip is opened too
      if (tooltip && !hasTooltipOpenedRef.current) {
        tooltip.addTo(marker._map);
        hasTooltipOpenedRef.current = true;
      }
    } else {
      // Small delay before closing popup to prevent flickering
      const timeoutId = setTimeout(() => {
        if (!markerRef.current) return;
        markerRef.current.closePopup();
        markerRef.current.getElement()?.classList.remove('hovered');
        
        // Close tooltip too
        if (tooltipRef.current && hasTooltipOpenedRef.current) {
          tooltipRef.current.removeFrom(marker._map);
          hasTooltipOpenedRef.current = false;
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isHovered]);
  
  // Format distance for display
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      ref={markerRef}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut
      }}
    >
      {/* Enhanced tooltip with more information */}
      <Tooltip
        direction="top"
        offset={[0, -8]}
        opacity={1.0}
        permanent={false}
        ref={tooltipRef}
        className="custom-tooltip"
      >
        <div className="text-xs font-medium">
          {locationName}
          {location.siqs !== undefined && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-2xs">
              {location.siqs.toFixed(0)} • {siqsQuality}
            </span>
          )}
          {location.distance !== undefined && (
            <div className="text-2xs opacity-80 mt-0.5">
              {formatDistance(location.distance)}
            </div>
          )}
        </div>
      </Tooltip>
      
      {/* Enhanced popup with gradient background */}
      <Popup 
        closeOnClick={false}
        autoClose={false}
        className="custom-popup"
      >
        <div className="p-2 max-w-[180px] leaflet-popup-custom-compact">
          <div className="font-medium text-xs mb-1">
            {locationName}
          </div>
          
          {/* Show certification badge for certified locations */}
          {isCertified && location.certification && (
            <div className="mt-1 text-2xs font-medium text-amber-600">
              {location.certification}
            </div>
          )}
          
          {/* SIQS Score Badge */}
          {location.siqs !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
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
          
          {/* Bortle scale if available */}
          {location.bortleScale && (
            <div className="mt-1 text-2xs">
              {t("Bortle Scale", "包尔特等级")}: {location.bortleScale}
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
  const userMarkerIcon = createCustomMarker('#3b82f6', 'user');
  
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Tooltip
        direction="top"
        offset={[0, -8]}
        opacity={1.0}
        permanent={false}
        className="custom-tooltip"
      >
        <div className="font-medium text-xs">
          {t("Your Location", "您的位置")}
        </div>
      </Tooltip>
      <Popup>
        <div className="p-2 leaflet-popup-custom">
          <strong>{t("Your Location", "您的位置")}</strong>
          <div className="text-xs mt-1">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {currentSiqs !== null && (
            <div className="text-xs mt-1.5 flex items-center">
              <span className="mr-1">SIQS:</span>
              <SiqsScoreBadge score={currentSiqs} compact={true} />
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export { LocationMarker, UserLocationMarker };
