
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { useEnhancedLocation } from '@/hooks/useEnhancedLocation';

interface MapTooltipProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Enhanced map tooltip component with better styling and performance
 * Removed position prop as it's not needed when used as a child of Marker
 */
const MapTooltip: React.FC<MapTooltipProps> = ({ 
  name, 
  children,
  className = '',
  latitude,
  longitude
}) => {
  const { t, language } = useLanguage();
  
  // Get detailed location information if coordinates are available
  const nearestTownInfo = latitude !== undefined && longitude !== undefined ? 
    findNearestTown(latitude, longitude, language) : null;
  
  // Get enhanced location details with street-level data
  const { locationDetails, loading } = useEnhancedLocation({
    latitude,
    longitude,
    skip: !latitude || !longitude
  });
  
  // Determine what to show as the primary name
  const displayName = locationDetails?.formattedName || name;
  
  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
    >
      <div className={`map-tooltip p-2 leaflet-popup-custom marker-popup-gradient ${className}`}>
        <div className="font-medium text-sm">{displayName}</div>
        
        {/* Display street name when available */}
        {locationDetails?.streetName && !displayName.includes(locationDetails.streetName) && (
          <div className="text-xs text-muted-foreground mt-1">
            {locationDetails.streetName}
          </div>
        )}
        
        {/* Display town/city when available */}
        {locationDetails?.townName && !displayName.includes(locationDetails.townName) && (
          <div className="text-xs text-muted-foreground mt-1">
            {locationDetails.townName}
            {locationDetails.cityName && locationDetails.cityName !== locationDetails.townName &&
              ` (${locationDetails.cityName})`}
          </div>
        )}
        
        {/* Display detailed location when available and different */}
        {nearestTownInfo && nearestTownInfo.detailedName && 
         !displayName.includes(nearestTownInfo.detailedName) &&
         (!locationDetails?.formattedName || locationDetails.formattedName !== nearestTownInfo.detailedName) && (
          <div className="text-xs text-muted-foreground mt-1">
            {nearestTownInfo.detailedName}
          </div>
        )}
        
        {/* Display coordinates when available */}
        {latitude !== undefined && longitude !== undefined && (
          <div className="text-xs text-muted-foreground mt-1">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </div>
        )}
        
        {children}
      </div>
    </Popup>
  );
};

export default MapTooltip;
