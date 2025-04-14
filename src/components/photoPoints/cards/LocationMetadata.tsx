
import React, { useEffect } from 'react';
import { MapPin, Calendar, Navigation, Map, Building } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { formatDistance } from '@/utils/location/formatDistance';
import { useEnhancedLocation } from '@/hooks/useEnhancedLocation';

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
  
  // Get enhanced location data with street-level details
  const { locationDetails, loading } = useEnhancedLocation({
    latitude,
    longitude,
    skip: !latitude || !longitude
  });
  
  // Get nearest town if coordinates are available (as fallback)
  let nearestTownInfo = null;
  if (latitude !== undefined && longitude !== undefined) {
    nearestTownInfo = findNearestTown(latitude, longitude, language === 'zh' ? 'zh' : 'en');
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
      
      {/* Street-level information if available */}
      {locationDetails?.streetName && (!locationName || !locationName.includes(locationDetails.streetName)) && (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5" />
          <span className="line-clamp-1">{locationDetails.streetName}</span>
        </div>
      )}
      
      {/* Town/Village information */}
      {((locationDetails?.townName && (!locationName || !locationName.includes(locationDetails.townName))) ||
        (nearestTownInfo?.townName && (!locationName || !locationName.includes(nearestTownInfo.townName)))) && (
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-1.5" />
          <span>{locationDetails?.townName || nearestTownInfo?.townName}</span>
        </div>
      )}
      
      {/* City/county information */}
      {((locationDetails?.cityName && (!locationName || !locationName.includes(locationDetails.cityName))) ||
        (nearestTownInfo?.city && (!locationName || !locationName.includes(nearestTownInfo.city)))) && (
        <div className="flex items-center">
          <Map className="h-4 w-4 mr-1.5" />
          <span>
            {locationDetails?.cityName || nearestTownInfo?.city}
            {(locationDetails?.countyName && locationDetails.countyName !== locationDetails.cityName) && 
              ` (${locationDetails.countyName})`}
            {(!locationDetails?.countyName && nearestTownInfo?.county && 
              nearestTownInfo.county !== nearestTownInfo.city) && 
              ` (${nearestTownInfo.county})`}
          </span>
        </div>
      )}
      
      {/* Nearest town information */}
      {!loading && nearestTownInfo && nearestTownInfo.distance <= 100 && 
       (!locationName || !locationName.includes(nearestTownInfo.townName)) &&
       (!locationDetails?.townName || locationDetails.townName !== nearestTownInfo.townName) && (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5" />
          <span>
            {language === 'en' ? 'Near ' : '靠近'}
            {nearestTownInfo.townName}
          </span>
        </div>
      )}
      
      {/* Detailed location name if different from other displayed info */}
      {!loading && nearestTownInfo && nearestTownInfo.detailedName && 
       (!locationName || !locationName.includes(nearestTownInfo.detailedName)) &&
       (nearestTownInfo.townName !== nearestTownInfo.detailedName) &&
       (!locationDetails?.formattedName || locationDetails.formattedName !== nearestTownInfo.detailedName) && (
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
