
import React from 'react';
import { MapPin } from 'lucide-react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface LocationHeaderProps {
  displayName: string;
  showOriginalName: boolean;
  location: SharedAstroSpot;
  language: string;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({
  displayName,
  showOriginalName,
  location,
  language
}) => {
  return (
    <div>
      <h3 className="font-semibold text-lg line-clamp-1">{displayName}</h3>
      
      {/* Show original location name if different from displayed name */}
      {showOriginalName && (
        <div className="mt-1.5 mb-2 flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {language === 'en' ? location.name : (location.name)}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationHeader;
