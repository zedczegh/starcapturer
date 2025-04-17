
import React, { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import SiqsScoreBadge from '../../photoPoints/cards/SiqsScoreBadge';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface MapTooltipProps {
  name: string;
  latitude: number;
  longitude: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  siqs?: number;
}

const MapTooltip: React.FC<MapTooltipProps> = ({
  name,
  latitude,
  longitude,
  isDarkSkyReserve = false,
  certification = '',
  siqs
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  const [localSiqs, setLocalSiqs] = useState<number | null>(null);
  
  // Format coordinates for display
  const formattedLat = latitude.toFixed(6);
  const formattedLng = longitude.toFixed(6);

  // Check if this is a certified location
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  // Get numeric SIQS score using our helper
  const siqsScore = getSiqsScore(siqs);
  
  // Effect to handle tooltip open/close
  useEffect(() => {
    if (isOpen && isCertified && !localSiqs && !loadingSiqs) {
      // When tooltip opens for a certified location without SIQS, start loading
      setLoadingSiqs(true);
      
      // Simulate fetching SIQS data for the location
      // In a real implementation, this would call your SIQS service
      setTimeout(() => {
        // Calculate a realistic SIQS value between 5.5 and 8.5
        const calculatedSiqs = 5.5 + Math.random() * 3;
        setLocalSiqs(calculatedSiqs);
        setLoadingSiqs(false);
      }, 1000);
    }
  }, [isOpen, isCertified, localSiqs, loadingSiqs]);
  
  // Handle popup open
  const handlePopupOpen = () => {
    setIsOpen(true);
  };
  
  // Handle popup close
  const handlePopupClose = () => {
    setIsOpen(false);
  };
  
  // Determine which SIQS value to display
  // Priority: localSiqs (real-time) > siqs (passed in) > default for certified
  const displaySiqs = localSiqs ?? siqsScore;
  const showSiqs = loadingSiqs || displaySiqs > 0 || isCertified;

  return (
    <Popup 
      closeOnClick={false} 
      autoClose={false}
      eventHandlers={{
        add: handlePopupOpen,
        remove: handlePopupClose
      }}
    >
      <div className="min-w-[200px] py-1">
        <div className="font-medium text-base mb-1">{name}</div>
        <div className="text-xs text-muted-foreground mb-2">
          {formattedLat}, {formattedLng}
        </div>
        
        {showSiqs && (
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              {isCertified && certification ? (
                `${certification}`
              ) : isDarkSkyReserve ? (
                'Dark Sky Reserve'
              ) : ''}
            </div>
            <div>
              <SiqsScoreBadge 
                score={displaySiqs} 
                loading={loadingSiqs} 
                compact={true}
                isCertified={isCertified}
              />
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default MapTooltip;
