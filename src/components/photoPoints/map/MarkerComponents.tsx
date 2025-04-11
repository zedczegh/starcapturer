
import React, { useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { formatDistance } from '@/utils/geoUtils';
import { Star, Award, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isWaterLocation } from '@/utils/locationValidator';

// Get SIQS quality class
const getSiqsClass = (siqs?: number): string => {
  if (!siqs) return '';
  if (siqs >= 7.5) return 'siqs-excellent';
  if (siqs >= 5.5) return 'siqs-good';
  return 'siqs-poor';
};

// Filter out water locations using the improved detection
const isWaterSpot = (location: SharedAstroSpot): boolean => {
  // Never filter out certified locations
  if (location.isDarkSkyReserve || location.certification) {
    return false;
  }
  
  // Use enhanced water detection
  return isWaterLocation(
    location.latitude, 
    location.longitude
  );
};

// Create different marker styles for certified vs calculated locations
const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isHovered: boolean) => {
  if (isCertified) {
    // For certified locations, use a star-shaped marker with gold/yellow color
    return createCustomMarker('#FFD700');
  } else {
    // For calculated locations, use a brighter color based on SIQS with circle shape
    // Replace olive green with a brighter, more vibrant green
    const defaultColor = '#4ADE80'; // Bright green fallback
    const color = location.siqs ? getProgressColor(location.siqs) : defaultColor;
    return createCustomMarker(color);
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
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const markerRef = useRef<L.Marker | null>(null);
  
  // Skip water locations for calculated spots (never skip certified)
  if (!isCertified && isWaterSpot(location)) {
    return null;
  }
  
  // Create the correct marker icon based on location type and hover state
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered);
  }, [location, isCertified, isHovered]);
  
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
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
    
    // Remove hovered class
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.remove('hovered');
    }
  }, [onHover]);
  
  // Effect to manage popup state based on hover
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    
    if (isHovered) {
      marker.openPopup();
      marker.getElement()?.classList.add('hovered');
    } else {
      marker.closePopup();
      marker.getElement()?.classList.remove('hovered');
    }
  }, [isHovered]);

  // Format location name based on language
  const displayName = language === 'zh' && location.chineseName 
    ? location.chineseName 
    : location.name;
  
  // Get SIQS class for styling
  const siqsClass = getSiqsClass(location.siqs);
  
  // Function to navigate to location details
  const goToLocationDetails = () => {
    const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: location.name,
        chineseName: location.chineseName,
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale || 4,
        siqs: location.siqs,
        siqsResult: location.siqs ? { 
          score: location.siqs,
          isViable: location.siqs >= 5.0,
          factors: [],
          isNighttimeCalculation: true
        } : undefined,
        certification: location.certification,
        isDarkSkyReserve: location.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  };
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      ref={markerRef}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <Popup 
        closeOnClick={false}
        autoClose={false}
      >
        <div className={`py-2 px-0.5 max-w-[220px] leaflet-popup-custom-compact marker-popup-gradient ${siqsClass}`}>
          <div className="font-medium text-sm mb-1.5 flex items-center">
            {isCertified && (
              <Star className="h-3.5 w-3.5 mr-1 text-yellow-400 fill-yellow-400" />
            )}
            <span className="text-gray-100">{displayName}</span>
          </div>
          
          {/* Show certification badge for certified locations */}
          {isCertified && location.certification && (
            <div className="mt-1 text-xs font-medium text-amber-400 flex items-center">
              <Award className="h-3 w-3 mr-1" />
              {location.certification}
            </div>
          )}
          
          {/* SIQS Score and Distance */}
          <div className="mt-2 flex items-center justify-between">
            {location.siqs !== undefined && (
              <div className="flex items-center gap-1.5">
                <SiqsScoreBadge score={location.siqs} compact={true} />
              </div>
            )}
            
            {location.distance && (
              <span className="text-xs text-gray-300 flex items-center justify-end">
                {formatDistance(location.distance)}
              </span>
            )}
          </div>
          
          {/* Link to details page */}
          <div className="mt-2 text-center">
            <button 
              onClick={goToLocationDetails}
              className="text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground py-1 px-2 rounded transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t("View Details", "查看详情")}
            </button>
          </div>
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
  // Changed to red color for user location
  const userMarkerIcon = createCustomMarker('#e11d48');
  
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Popup>
        <div className="p-2 leaflet-popup-custom marker-popup-gradient">
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
