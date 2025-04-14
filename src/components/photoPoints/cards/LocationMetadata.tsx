
import React from 'react';
import { MapPin, Calendar, Navigation, Map } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { formatDistance } from '@/utils/location/formatDistance';

interface LocationMetadataProps {
  distance?: number;
  date?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

const LocationMetadata: React.FC<LocationMetadataProps> = ({ 
  distance, 
  date,
  latitude,
  longitude,
  locationName
}) => {
  const { language, t } = useLanguage();
  
  // Get nearest town if coordinates are available
  let nearestTownInfo = null;
  if (latitude !== undefined && longitude !== undefined) {
    nearestTownInfo = findNearestTown(latitude, longitude, language);
  }
  
  // Format date if available
  const formattedDate = date ? new Date(date).toLocaleDateString(
    language === 'en' ? 'en-US' : 'zh-CN',
    { month: 'short', day: 'numeric', year: 'numeric' }
  ) : null;
  
  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      {/* Distance information */}
      {distance !== undefined && (
        <div className="flex items-center">
          <Navigation className="h-4 w-4 mr-1.5" />
          <span>{formatDistance(distance, language)}</span>
        </div>
      )}
      
      {/* City/county information */}
      {nearestTownInfo?.city && (!locationName || !locationName.includes(nearestTownInfo.city)) && (
        <div className="flex items-center">
          <Map className="h-4 w-4 mr-1.5" />
          <span>
            {nearestTownInfo.city}
            {nearestTownInfo.county && nearestTownInfo.county !== nearestTownInfo.city && 
             ` (${nearestTownInfo.county})`}
          </span>
        </div>
      )}
      
      {/* Nearest town information */}
      {nearestTownInfo && nearestTownInfo.distance <= 100 && 
       (!locationName || !locationName.includes(nearestTownInfo.townName)) && (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5" />
          <span>
            {language === 'en' ? 'Near ' : '靠近'}
            {nearestTownInfo.townName}
          </span>
        </div>
      )}
      
      {/* Detailed location name if different from other displayed info */}
      {nearestTownInfo && nearestTownInfo.detailedName && 
       (!locationName || !locationName.includes(nearestTownInfo.detailedName)) &&
       (nearestTownInfo.townName !== nearestTownInfo.detailedName) && (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5" />
          <span className="line-clamp-1">
            {nearestTownInfo.detailedName}
          </span>
        </div>
      )}
      
      {/* Date information */}
      {formattedDate && (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1.5" />
          <span>{formattedDate}</span>
        </div>
      )}
      
      {/* Coordinates for precise location */}
      {latitude !== undefined && longitude !== undefined && (
        <div className="flex items-center text-xs opacity-75">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
        </div>
      )}
    </div>
  );
};

export default LocationMetadata;
