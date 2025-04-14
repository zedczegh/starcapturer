
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { findNearestTown } from '@/utils/nearestTownCalculator';

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
  
  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
    >
      <div className={`map-tooltip p-2 leaflet-popup-custom marker-popup-gradient ${className}`}>
        <div className="font-medium text-sm">{name}</div>
        
        {/* Display detailed location when available */}
        {nearestTownInfo && nearestTownInfo.detailedName && (
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
