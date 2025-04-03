
import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationMetadataProps {
  distance?: number;
  date?: string;
}

const LocationMetadata: React.FC<LocationMetadataProps> = ({ distance, date }) => {
  const { language, t } = useLanguage();
  
  // Format the distance for display
  const formatDistance = (distance?: number) => {
    if (!distance) return t("Unknown distance", "未知距离");
    
    if (distance < 1) {
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    }
    
    if (distance < 10) {
      return t(`${distance.toFixed(1)} km away`, `距离 ${distance.toFixed(1)} 公里`);
    }
    
    return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
  };
  
  // Format the date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return '';
    }
  };
  
  return (
    <div className="flex flex-col space-y-2.5 mt-3">
      <div className="flex items-center text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="font-medium">{formatDistance(distance)}</span>
      </div>
      
      {date && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium">{formatDate(date)}</span>
        </div>
      )}
    </div>
  );
};

export default LocationMetadata;
