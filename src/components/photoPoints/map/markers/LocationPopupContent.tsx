
import React from 'react';
import { ExternalLink, Star, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import { formatDistance } from '@/utils/geoUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSiqsClassForLocation } from './markerUtils';

interface LocationPopupContentProps {
  location: SharedAstroSpot;
  locationId: string;
  isCertified: boolean;
}

const LocationPopupContent: React.FC<LocationPopupContentProps> = ({
  location,
  locationId,
  isCertified
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Format location name based on language
  const displayName = language === 'zh' && location.chineseName 
    ? location.chineseName 
    : location.name;
  
  // Get SIQS class for styling
  const siqsClass = getSiqsClassForLocation(location.siqs);
  
  // Function to navigate to location details
  const goToLocationDetails = () => {
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
          className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          {t("View Details", "查看详情")}
        </button>
      </div>
    </div>
  );
};

export default LocationPopupContent;
