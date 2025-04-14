import React, { useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { formatDistance } from '@/utils/geoUtils';
import { Star, Award, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isWaterLocation, isValidAstronomyLocation, isLikelyCoastalWater } from '@/utils/locationValidator';
import { useIsMobile } from '@/hooks/use-mobile';
import MarkerEventHandler from './MarkerEventHandler';

// Get SIQS quality class
const getSiqsClass = (siqs?: number): string => {
  if (!siqs) return '';
  if (siqs >= 7.5) return 'siqs-excellent';
  if (siqs >= 5.5) return 'siqs-good';
  return 'siqs-poor';
};

// Enhanced filtering for water locations
const isWaterSpot = (location: SharedAstroSpot): boolean => {
  // Never filter out certified locations
  if (location.isDarkSkyReserve || location.certification) {
    return false;
  }
  
  // Multi-layered water detection
  // 1. Main water detection
  if (isWaterLocation(location.latitude, location.longitude, false)) {
    return true;
  }
  
  // 2. Coastal water detection
  if (isLikelyCoastalWater(location.latitude, location.longitude)) {
    return true;
  }
  
  // 3. Name-based detection
  if (location.name) {
    const lowerName = location.name.toLowerCase();
    const waterKeywords = [
      'ocean', 'sea', 'bay', 'gulf', 'lake', 'strait', 
      'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach'
    ];
    
    for (const keyword of waterKeywords) {
      if (lowerName.includes(keyword)) {
        return true;
      }
    }
  }
  
  return false;
};

// Get certification type based color for markers
const getCertificationColor = (location: SharedAstroSpot): string => {
  if (!location.isDarkSkyReserve && !location.certification) {
    return '#FFD700'; // Default gold
  }
  
  const certification = (location.certification || '').toLowerCase();
  
  // Different colors for different certification types
  if (certification.includes('reserve') || certification.includes('sanctuary')) {
    return '#9b87f5'; // Purple for reserves
  } else if (certification.includes('park')) {
    return '#4ADE80'; // Green for parks
  } else if (certification.includes('community')) {
    return '#FFA500'; // Orange for communities
  } else if (certification.includes('urban')) {
    return '#0EA5E9'; // Blue for urban night skies
  } else {
    return '#FFD700'; // Gold for generic certified locations
  }
};

// Create different marker styles for certified vs calculated locations
const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isHovered: boolean, isMobile: boolean) => {
  // Enhanced appearance for mobile
  const sizeMultiplier = isMobile ? 1.2 : 1.0; // 20% larger on mobile
  
  if (isCertified) {
    // For certified locations, use a color based on certification type
    const certColor = getCertificationColor(location);
    return createCustomMarker(certColor, 'star', sizeMultiplier);
  } else {
    // For calculated locations, use a brighter color based on SIQS with circle shape
    const defaultColor = '#4ADE80'; // Bright green fallback
    const color = location.siqs ? getProgressColor(location.siqs) : defaultColor;
    return createCustomMarker(color, 'circle', sizeMultiplier);
  }
};

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
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const markerRef = useRef<L.Marker | null>(null);
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
  
  // Handle custom touch events for better mobile experience
  const handleMarkerTouchStart = useCallback((e: TouchEvent) => {
    if (handleTouchStart) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchStart(syntheticEvent, locationId);
    }
    
    // Add hovered class to marker for style enhancement
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
  }, [locationId, handleTouchStart]);
  
  const handleMarkerTouchEnd = useCallback((e: TouchEvent) => {
    if (handleTouchEnd) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchEnd(syntheticEvent, locationId);
    }
  }, [locationId, handleTouchEnd]);
  
  const handleMarkerTouchMove = useCallback((e: TouchEvent) => {
    if (handleTouchMove) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchMove(syntheticEvent);
    }
  }, [handleTouchMove]);
  
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
    >
      <MarkerEventHandler 
        marker={markerRef.current}
        eventMap={{
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
          touchstart: handleMarkerTouchStart,
          touchend: handleMarkerTouchEnd,
          touchmove: handleMarkerTouchMove
        }}
      />
      
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
          
          {/* Link to details page - larger touch target on mobile */}
          <div className="mt-2 text-center">
            <button 
              onClick={goToLocationDetails}
              className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground py-1 ${isMobile ? 'py-2' : 'py-1'} px-2 rounded transition-colors`}
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
  const isMobile = useIsMobile();
  
  // Changed to red color for user location and larger on mobile
  const userMarkerIcon = createCustomMarker('#e11d48', undefined, isMobile ? 1.2 : 1.0);
  
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

// Helper hook to provide proper event handlers for markers
export const useMarkerEvents = () => {
  const map = useMap();
  
  // Initialize event handlers that properly work with Leaflet
  useEffect(() => {
    if (!map) return;
    
    // Extend Leaflet's Marker prototype to support our custom events if needed
    if (!L.Marker.prototype._touchHandlersAdded) {
      L.Marker.prototype._touchHandlersAdded = true;
      
      // Original handler reference
      const originalOn = L.Marker.prototype.on;
      
      // Extend the 'on' method to handle custom events
      L.Marker.prototype.on = function(types, fn, context) {
        // Call the original method for standard events
        return originalOn.call(this, types, fn, context);
      };
    }
    
    return () => {
      // Clean up if needed
    };
  }, [map]);
  
  return { map };
};

export { LocationMarker, UserLocationMarker };
