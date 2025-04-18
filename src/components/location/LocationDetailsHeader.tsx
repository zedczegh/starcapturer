
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateForLanguage } from '@/utils/dateFormatting';
import { Card, CardContent } from '../ui/card';
import { MapPin } from 'lucide-react';
import LocationTimeDisplay from './LocationTimeDisplay';

interface LocationDetailsHeaderProps {
  name?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

const LocationDetailsHeader: React.FC<LocationDetailsHeaderProps> = ({
  name,
  latitude,
  longitude,
  timestamp
}) => {
  const { language, t } = useLanguage();
  
  if (!name || !latitude || !longitude) {
    return null;
  }
  
  return (
    <Card className="mb-8 backdrop-blur-sm border-cosmic-700/30 hover:border-cosmic-600/50 transition-all duration-300 shadow-lg overflow-hidden hover:shadow-cosmic-600/10">
      <CardContent className="p-4 md:p-6 bg-gradient-to-r from-cosmic-900 to-cosmic-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-cosmic-50">{name}</h1>
            <div className="flex items-center text-cosmic-300 text-sm mt-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
            </div>
            {timestamp && (
              <div className="text-xs text-cosmic-400 mt-1">
                {t("Added", "添加于")}: {formatDateForLanguage(timestamp, language)}
              </div>
            )}
          </div>
          
          <LocationTimeDisplay 
            latitude={latitude} 
            longitude={longitude} 
            className="mt-2 md:mt-0" 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationDetailsHeader;
