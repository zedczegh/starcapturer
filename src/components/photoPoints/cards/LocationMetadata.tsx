
import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { findNearestTown } from '@/utils/nearestTownCalculator';

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
  
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km away`, `距离 ${Math.round(distance / 100) * 100} 公里`);
  };
  
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
      {distance !== undefined && (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5" />
          <span>{formatDistance(distance)}</span>
        </div>
      )}
      
      {nearestTownInfo && nearestTownInfo.distance <= 100 && !locationName?.includes(nearestTownInfo.townName) && (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-1.5" />
          <span>
            {language === 'en' ? 'Near ' : '靠近'}
            {nearestTownInfo.townName}
            {nearestTownInfo.distance > 0 ? ` (${nearestTownInfo.formattedDistance})` : ''}
          </span>
        </div>
      )}
      
      {formattedDate && (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1.5" />
          <span>{formattedDate}</span>
        </div>
      )}
    </div>
  );
};

export default LocationMetadata;
