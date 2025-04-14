
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Award, Shield, MapPin } from 'lucide-react';
import { formatSIQSScore } from '@/utils/geoUtils';
import { useDisplayName } from '../cards/DisplayNameResolver';
import { findNearestTown } from '@/utils/nearestTownCalculator';

interface MapMarkerPopupProps {
  location: SharedAstroSpot;
  onClose: () => void;
  onViewDetails: (location: SharedAstroSpot) => void;
}

const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({ location, onClose, onViewDetails }) => {
  const { language, t } = useLanguage();
  
  // Use the shared display name resolver
  const { displayName, showOriginalName } = useDisplayName({
    location,
    language,
    locationCounter: null
  });
  
  // Get detailed location information
  const nearestTownInfo = location.latitude && location.longitude ? 
    findNearestTown(location.latitude, location.longitude, language) : null;
  
  // Get certification info if available
  const hasCertification = location.certification || location.isDarkSkyReserve;
  
  // Get certification type display text
  const getCertificationText = () => {
    if (location.isDarkSkyReserve) {
      return language === 'en' ? 'Dark Sky Reserve' : '暗夜保护区';
    }
    if (location.certification) {
      return location.certification;
    }
    return '';
  };
  
  return (
    <div className="p-3 min-w-[200px] max-w-[280px]">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-sm line-clamp-1">{displayName}</h4>
        
        {location.siqs > 0 && (
          <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full border border-yellow-500/40">
            <Star className="h-3 w-3 text-yellow-400 mr-1" fill="#facc15" />
            <span className="text-xs font-medium">{formatSIQSScore(location.siqs)}</span>
          </div>
        )}
      </div>
      
      {hasCertification && (
        <div className="flex items-center mb-2 mt-1">
          <div className="flex items-center text-xs">
            {location.isDarkSkyReserve ? 
              <Award className="h-3.5 w-3.5 mr-1 text-blue-400" /> : 
              <Shield className="h-3.5 w-3.5 mr-1 text-green-400" />
            }
            <span>{getCertificationText()}</span>
          </div>
        </div>
      )}
      
      {/* Show original location name if different from nearest town name */}
      {showOriginalName && (
        <div className="flex items-center mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {language === 'en' ? location.name : (location.chineseName || location.name)}
          </span>
        </div>
      )}
      
      {/* Display detailed location information from nearestTownInfo */}
      {nearestTownInfo && nearestTownInfo.detailedName && (
        <div className="flex items-center mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {nearestTownInfo.detailedName}
          </span>
        </div>
      )}
      
      {/* Show coordinates */}
      {location.latitude !== undefined && location.longitude !== undefined && (
        <div className="flex items-center mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </div>
      )}
      
      <div className="mt-2 flex justify-end">
        <Button 
          size="sm"
          variant="secondary"
          className="h-7 py-0 px-2 text-xs"
          onClick={() => onViewDetails(location)}
        >
          {t("Details", "详情")}
        </Button>
      </div>
    </div>
  );
};

export default MapMarkerPopup;
