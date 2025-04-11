
import React, { useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { formatDistance } from '@/utils/geoUtils';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isWaterLocation } from '@/utils/locationValidator';
import MapTooltip from '@/components/location/map/MapTooltip';
import { Button } from '@/components/ui/button';

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
    location.longitude, 
    Boolean(location.isDarkSkyReserve || location.certification)
  );
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
const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isHovered: boolean) => {
  if (isCertified) {
    // For certified locations, use a color based on certification type
    const certColor = getCertificationColor(location);
    return createCustomMarker(certColor, 'star');
  } else {
    // For calculated locations, use a brighter color based on SIQS with circle shape
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
  const goToLocationDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    
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
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <MapTooltip 
        name={displayName}
        className={`location-popup ${siqsClass}`}
        certification={location.certification}
        isDarkSkyReserve={location.isDarkSkyReserve}
      >
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
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 text-xs w-full bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30 text-primary-foreground py-1 px-2 rounded transition-colors"
            onClick={goToLocationDetails}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t("View Details", "查看详情")}
          </Button>
        </div>
      </MapTooltip>
    </Marker>
  );
});

LocationMarker.displayName = 'LocationMarker';

export default LocationMarker;
