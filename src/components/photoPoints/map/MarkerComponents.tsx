
import React, { useCallback, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { formatDistance } from '@/utils/geoUtils';
import { Star, Award, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSiqsClass, getCertificationColor } from '@/utils/markerUtils';

// Create different marker styles for certified vs calculated locations
const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isMobile: boolean) => {
  const sizeMultiplier = isMobile ? 1.2 : 1.0;
  
  if (isCertified) {
    const certColor = getCertificationColor(location);
    return createCustomMarker(certColor, 'star', sizeMultiplier);
  } else {
    const defaultColor = '#4ADE80';
    const color = location.siqs ? getProgressColor(location.siqs) : defaultColor;
    return createCustomMarker(color, 'circle', sizeMultiplier);
  }
};

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
}

const LocationMarker = memo(({ 
  location, 
  onClick,
  locationId,
  isCertified,
  activeView,
}: LocationMarkerProps) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Skip rendering calculated locations in certified view
  if (activeView === 'certified' && !isCertified) {
    return null;
  }

  // Create the correct marker icon based on location type and device type
  const icon = getLocationMarker(location, isCertified, isMobile);
  
  // Handle click event
  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);

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
      onClick={handleClick}
    >
      <Popup
        closeOnClick={false}
        autoClose={true}
      >
        <div className={`py-2 px-0.5 max-w-[220px] leaflet-popup-custom-compact marker-popup-gradient ${siqsClass}`}>
          <div className="font-medium text-sm mb-1.5 flex items-center">
            {isCertified && (
              <Star className="h-3.5 w-3.5 mr-1 text-yellow-400 fill-yellow-400" />
            )}
            <span className="text-gray-100">{displayName}</span>
          </div>
          
          {isCertified && location.certification && (
            <div className="mt-1 text-xs font-medium text-amber-400 flex items-center">
              <Award className="h-3 w-3 mr-1" />
              {location.certification}
            </div>
          )}
          
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
          
          <div className="mt-2 text-center">
            <button 
              onClick={goToLocationDetails}
              className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
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
  
  const userMarkerIcon = createCustomMarker('#e11d48', undefined, isMobile ? 1.2 : 1.0);
  
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Popup 
        closeOnClick={false}
        autoClose={true}
      >
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
