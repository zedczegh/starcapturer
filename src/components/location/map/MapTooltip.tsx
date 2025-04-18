
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEnhancedLocationDetails } from './tooltip/EnhancedLocationDetails';
import { Language } from '@/services/geocoding/types';
import { getSiqsScore } from '@/utils/siqsHelpers';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';

interface MapTooltipProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
  latitude?: number;
  longitude?: number;
  siqs?: number | { score: number; isViable: boolean } | any;
  isDarkSkyReserve?: boolean;
  certification?: string;
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
  longitude,
  siqs,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  const { language } = useLanguage();
  const typedLanguage: Language = language === 'zh' ? 'zh' : 'en';
  
  // Get enhanced location details using our custom hook
  const { detailedName } = useEnhancedLocationDetails({ 
    latitude, 
    longitude, 
    language: typedLanguage 
  });

  // Check if this is a certified location
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  // Get SIQS score using helper function
  const siqsScore = getSiqsScore(siqs);
  
  // For certified locations without SIQS, use a default good score
  const displaySiqs = siqsScore > 0 ? siqsScore : (isCertified ? 6.5 : 0);
  
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

        {/* Display SIQS score if available or if it's a certified location */}
        {(siqsScore > 0 || isCertified) && (
          <div className="mt-1.5 flex items-center">
            <SiqsScoreBadge 
              score={displaySiqs} 
              compact={true}
              forceCertified={isCertified && siqsScore <= 0}
            />
          </div>
        )}
        
        {children}
      </div>
    </Popup>
  );
};

export default MapTooltip;
