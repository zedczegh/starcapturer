
import React from 'react';
import { Popup } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface MapMarkerPopupProps {
  location: SharedAstroSpot;
  onClick?: (location: SharedAstroSpot) => void;
  showDetails?: boolean;
  siqsLoading?: boolean;
}

const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({ 
  location, 
  onClick,
  showDetails = true,
  siqsLoading = false
}) => {
  if (!location) return null;
  
  const {
    name,
    latitude,
    longitude,
    certification,
    isDarkSkyReserve,
    siqsResult
  } = location;
  
  const displayName = name || 'Unnamed Location';
  
  // Convert coordinates to strings with fixed decimal precision
  const latStr = typeof latitude === 'number' ? latitude.toFixed(6) : 'N/A';
  const lngStr = typeof longitude === 'number' ? longitude.toFixed(6) : 'N/A';
  
  // Check if this is a certified location
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  // Get the SIQS score using our helper
  const siqsScore = getSiqsScore(siqsResult);
  
  // Handle click on the popup content
  const handleClick = () => {
    if (onClick && location) {
      onClick(location);
    }
  };
  
  return (
    <Popup>
      <div 
        className="min-w-[180px] p-1 cursor-pointer" 
        onClick={handleClick}
      >
        <h3 className="font-medium text-sm">{displayName}</h3>
        
        <div className="text-xs text-muted-foreground mt-1">
          {latStr}, {lngStr}
        </div>
        
        {showDetails && (
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              {certification || (isDarkSkyReserve ? 'Dark Sky Reserve' : '')}
            </div>
            
            {/* Show SIQS score badge */}
            <SiqsScoreBadge 
              score={siqsScore} 
              compact={true} 
              loading={siqsLoading}
              isCertified={isCertified}
            />
          </div>
        )}
      </div>
    </Popup>
  );
};

export default MapMarkerPopup;
