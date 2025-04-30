
import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistance } from '@/utils/geoUtils';
import { formatDateForLanguage } from '@/utils/dateFormatting';

interface LocationMetadataProps {
  distance?: number;
  date?: string | Date;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  showParentheses?: boolean;
}

const LocationMetadata: React.FC<LocationMetadataProps> = ({
  distance,
  date,
  latitude,
  longitude,
  locationName
}) => {
  const { language, t } = useLanguage();
  
  // Format the date according to the current language
  const formattedDate = date ? formatDateForLanguage(date, language) : '';
  
  // Format distance if available
  const formattedDistance = distance !== undefined ? formatDistance(distance) : '';
  
  // Only show coordinates without distance
  const showCoordinates = latitude !== undefined && longitude !== undefined;
  
  return (
    <div className="space-y-2 text-xs">
      {/* Date information if available */}
      {formattedDate && (
        <div className="flex items-center text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 mr-1.5" />
          <span>{formattedDate}</span>
        </div>
      )}
      
      {/* Location with coordinates */}
      {showCoordinates && (
        <div className="flex items-center text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
          <span className="break-all">
            {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationMetadata;
