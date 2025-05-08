
import React from 'react';
import { Popup } from 'react-leaflet';
import { Star } from 'lucide-react';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface MapLocationPopupProps {
  name: string;
  position: [number, number];
  isDarkSkyReserve?: boolean;
  certification?: string;
  siqs?: number | null;
}

const MapLocationPopup: React.FC<MapLocationPopupProps> = ({ 
  name, 
  position,
  isDarkSkyReserve = false,
  certification = '',
  siqs = null
}) => {
  // Check if this is a certified location
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  // Get actual score value - ensure it's properly normalized
  const siqsScore = getSiqsScore(siqs);

  return (
    <Popup closeOnClick={false} autoClose={false}>
      <div className="p-2 leaflet-popup-custom marker-popup-gradient">
        <div className="flex items-start">
          <div>
            <div className="font-medium text-sm">{name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {position[0].toFixed(4)}, {position[1].toFixed(4)}
            </div>
            
            {/* Show certification info if available */}
            {isCertified && (
              <div className="mt-1 text-xs font-medium text-primary/90 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-primary" fill="currentColor" />
                {isDarkSkyReserve ? 'Dark Sky Reserve' : certification}
              </div>
            )}
            
            {/* Show SIQS score if available */}
            <div className="mt-1.5 flex items-center">
              <SiqsScoreBadge 
                score={siqsScore} 
                compact={true} 
                loading={false}
                isCertified={isCertified}
                forceCertified={false}
              />
            </div>
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default MapLocationPopup;
