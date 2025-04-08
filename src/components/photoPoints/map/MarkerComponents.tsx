
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

// Get SIQS quality class
const getSiqsClass = (siqs?: number): string => {
  if (!siqs) return '';
  if (siqs >= 7.5) return 'siqs-excellent';
  if (siqs >= 5.5) return 'siqs-good';
  return 'siqs-poor';
};

// Filter out water locations (simplified check)
const isWaterLocation = (location: SharedAstroSpot): boolean => {
  // Check location name or description for common water-related terms
  const waterTerms = ['sea', 'ocean', 'lake', 'river', 'bay', 'gulf', 'strait', 
                      '海', '洋', '湖', '河', '湾', '水'];
  
  const checkForWaterTerms = (text?: string) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return waterTerms.some(term => lowerText.includes(term));
  };
  
  return checkForWaterTerms(location.name) || 
         checkForWaterTerms(location.chineseName) || 
         checkForWaterTerms(location.description);
};

// Create different marker styles for certified vs calculated locations
const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isHovered: boolean) => {
  if (isCertified) {
    // For certified locations, use a star-shaped marker with gold/yellow color
    return createCustomMarker('#FFD700', 'star');
  } else {
    // For calculated locations, use a brighter color based on SIQS with circle shape
    // Replace olive green with a brighter, more vibrant green
    const defaultColor = '#4ADE80'; // Bright green fallback
    const color = location.siqs ? getProgressColor(location.siqs) : defaultColor;
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
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const markerRef = useRef<L.Marker | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  
  // Skip water locations for calculated spots
  if (!isCertified && isWaterLocation(location)) {
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
    
    // Clear any existing timeouts
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    // Add hovered class to marker for style enhancement
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
    
    // Delayed opening of popup for smoother hover
    if (!openTimeoutRef.current && markerRef.current && !markerRef.current.isPopupOpen()) {
      openTimeoutRef.current = window.setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
        openTimeoutRef.current = null;
      }, 150);
    }
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    // Clear open timeout if it exists
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    
    // Delayed popup closing and hover state removal
    closeTimeoutRef.current = window.setTimeout(() => {
      onHover(null);
      
      // Remove hovered class
      const marker = markerRef.current;
      if (marker && marker.getElement()) {
        marker.getElement()?.classList.remove('hovered');
      }
      
      // Close popup with a delay
      if (markerRef.current && markerRef.current.isPopupOpen()) {
        markerRef.current.closePopup();
      }
      
      closeTimeoutRef.current = null;
    }, 200);
  }, [onHover]);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current !== null) {
        window.clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);
  
  // Effect to manage popup state based on hover
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    
    if (isHovered) {
      marker.openPopup();
      marker.getElement()?.classList.add('hovered');
    } else if (!isHovered && closeTimeoutRef.current === null && marker.isPopupOpen()) {
      // Only add a timeout if we don't already have one
      closeTimeoutRef.current = window.setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.closePopup();
          markerRef.current.getElement()?.classList.remove('hovered');
        }
        closeTimeoutRef.current = null;
      }, 200);
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
        siqsResult: location.siqs ? { score: location.siqs } : undefined,
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
      // Fix: Use the onClick prop instead of eventHandlers
      onMouseover={handleMouseOver}
      onMouseout={handleMouseOut}
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
  const userMarkerIcon = createCustomMarker('#3b82f6', 'user');
  
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
