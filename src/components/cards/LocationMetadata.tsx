
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistance } from '@/utils/location/formatDistance';

interface LocationMetadataProps {
  distance?: number;
  date?: string;
  latitude: number;
  longitude: number;
  locationName?: string;
}

const LocationMetadata: React.FC<LocationMetadataProps> = ({
  distance,
  date,
  latitude,
  longitude,
  locationName
}) => {
  const { t, language } = useLanguage();
  
  return (
    <div className="text-xs text-muted-foreground">
      {distance !== undefined && (
        <div className="mb-1">
          {t("Distance", "距离")}: {formatDistance(distance, language)}
        </div>
      )}
      
      {date && (
        <div className="mb-1">
          {t("Added", "添加时间")}: {new Date(date).toLocaleDateString()}
        </div>
      )}
      
      <div className="mb-1">
        {t("Coordinates", "坐标")}: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
};

export default LocationMetadata;
