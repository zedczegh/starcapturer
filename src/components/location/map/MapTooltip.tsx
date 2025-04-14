
import React, { useEffect, useState } from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { Language } from '@/services/geocoding/types';

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
  const [enhancedLocation, setEnhancedLocation] = useState<any>(null);
  
  // Get enhanced location details
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      const typedLanguage: Language = language === 'zh' ? 'zh' : 'en';
      
      getEnhancedLocationDetails(latitude, longitude, typedLanguage)
        .then(details => {
          setEnhancedLocation(details);
        })
        .catch(error => {
          console.error("Error fetching enhanced location for map tooltip:", error);
        });
    }
  }, [latitude, longitude, language]);
  
  // Get detailed location information if coordinates are available and enhanced details not yet loaded
  const nearestTownInfo = (latitude !== undefined && longitude !== undefined && !enhancedLocation) ? 
    findNearestTown(latitude, longitude, language === 'zh' ? 'zh' : 'en') : null;
  
  // Determine what location information to display
  const detailedName = enhancedLocation?.formattedName || 
                       enhancedLocation?.detailedName || 
                       (nearestTownInfo && nearestTownInfo.detailedName);
  
  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
    >
      <div className={`map-tooltip p-2 leaflet-popup-custom marker-popup-gradient ${className}`}>
        <div className="font-medium text-sm">{name}</div>
        
        {/* Display detailed location when available */}
        {detailedName && detailedName !== name && (
          <div className="text-xs text-muted-foreground mt-1">
            {detailedName}
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
