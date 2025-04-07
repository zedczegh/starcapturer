
import React, { useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';

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
    
    // Create or show tooltip programmatically
    if (marker) {
      if (!marker.getTooltip()) {
        // Create tooltip with location information
        const tooltipContent = 
          `<div class="text-xs font-medium">
            ${locationName}
            ${location.siqs !== undefined ? 
              `<span class="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-2xs">
                ${location.siqs.toFixed(0)} • ${siqsQuality}
              </span>` : ''}
            ${location.distance !== undefined ? 
              `<div class="text-2xs opacity-80 mt-0.5">
                ${location.distance < 1 ? 
                `${Math.round(location.distance * 1000)}m` : 
                `${location.distance.toFixed(1)}km`}
              </div>` : ''}
          </div>`;
          
        const tooltip = L.tooltip({
          direction: 'top',
          offset: [0, -8],
          opacity: 1.0,
          permanent: false,
          className: 'custom-tooltip'
        }).setContent(tooltipContent);
        
        marker.bindTooltip(tooltip).openTooltip();
      } else {
        marker.openTooltip();
      }
    }
    
    // Track that tooltip has been opened
    hasTooltipOpenedRef.current = true;
  }, [locationId, onHover, locationName, location.siqs, location.distance, siqsQuality]);
  
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
    
    if (!marker) return;
    
    if (isHovered) {
      marker.openPopup();
      marker.getElement()?.classList.add('hovered');
      
      // Make sure tooltip is opened too
      if (marker.getTooltip() && !hasTooltipOpenedRef.current) {
        marker.openTooltip();
        hasTooltipOpenedRef.current = true;
      }
    } else {
      // Small delay before closing popup to prevent flickering
      const timeoutId = setTimeout(() => {
        if (!markerRef.current) return;
        markerRef.current.closePopup();
        markerRef.current.closeTooltip();
        markerRef.current.getElement()?.classList.remove('hovered');
        
        hasTooltipOpenedRef.current = false;
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
  
  // Setup event handlers for the marker
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    
    marker.on('click', handleClick);
    marker.on('mouseover', handleMouseOver);
    marker.on('mouseout', handleMouseOut);
    
    return () => {
      marker.off('click', handleClick);
      marker.off('mouseover', handleMouseOver);
      marker.off('mouseout', handleMouseOut);
    };
  }, [handleClick, handleMouseOver, handleMouseOut]);
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      ref={markerRef}
    >
      <Popup>
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
  const markerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    
    // Create and bind tooltip programmatically
    const tooltipContent = `<div class="font-medium text-xs">${t("Your Location", "您的位置")}</div>`;
    const tooltip = L.tooltip({
      direction: 'top',
      offset: [0, -8],
      opacity: 1.0,
      permanent: false,
      className: 'custom-tooltip'
    }).setContent(tooltipContent);
    
    marker.bindTooltip(tooltip);
    
    // Create and bind popup programmatically
    const popupContent = `
      <div class="p-2 leaflet-popup-custom">
        <strong>${t("Your Location", "您的位置")}</strong>
        <div class="text-xs mt-1">
          ${position[0].toFixed(5)}, ${position[1].toFixed(5)}
        </div>
        ${currentSiqs !== null ? `
          <div class="text-xs mt-1.5 flex items-center">
            <span class="mr-1">SIQS:</span>
            <div class="siqs-badge" data-siqs="${currentSiqs}"></div>
          </div>
        ` : ''}
      </div>
    `;
    
    marker.bindPopup(popupContent, {
      closeButton: true,
      className: 'custom-popup'
    });
    
    // After popup is opened, replace the SIQS badge placeholder with actual component
    marker.on('popupopen', () => {
      if (currentSiqs === null) return;
      
      const siqsBadgeEl = document.querySelector('.siqs-badge');
      if (siqsBadgeEl) {
        const colorClass = getProgressColor(currentSiqs);
        siqsBadgeEl.innerHTML = `
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-opacity-20" 
                style="background-color: ${colorClass}20; color: ${colorClass}">
            ${currentSiqs.toFixed(1)}
          </span>
        `;
      }
    });
    
  }, [position, currentSiqs, t]);
  
  return (
    <Marker
      position={position}
      icon={userMarkerIcon}
      ref={markerRef}
    />
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export { LocationMarker, UserLocationMarker };
