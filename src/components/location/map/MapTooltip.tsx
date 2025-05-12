
import React, { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEnhancedLocationDetails } from './tooltip/EnhancedLocationDetails';
import { Language } from '@/services/geocoding/types';
import { getSiqsScore, normalizeToSiqsScale } from '@/utils/siqsHelpers';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';
import RealTimeSiqsProvider from '@/components/photoPoints/cards/RealTimeSiqsProvider';
import { getDisplaySiqs } from '@/utils/unifiedSiqsDisplay';

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
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  
  // Get enhanced location details using our custom hook
  const { detailedName, isWaterLocation } = useEnhancedLocationDetails({ 
    latitude, 
    longitude, 
    language: typedLanguage 
  });

  // Check if this is a certified location
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  // Get normalized SIQS score using helper function
  const initialSiqsScore = getSiqsScore(siqs);
  
  // Use unified SIQS display function - no default scores for certified locations
  const displaySiqs = getDisplaySiqs({
    realTimeSiqs: realTimeSiqs !== null ? normalizeToSiqsScale(realTimeSiqs) : null,
    staticSiqs: initialSiqsScore,
    isCertified,
    isDarkSkyReserve
  });
  
  const handleSiqsCalculated = (siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs !== null ? normalizeToSiqsScale(siqs) : null);
    setSiqsLoading(loading);
  };

  // Override water location name if needed
  const displayedName = isWaterLocation && !isCertified ? 
    (language === 'zh' ? '水域位置' : 'Water Location') : 
    name;

  // Determine if we should show the detailed location
  const shouldShowDetailedName = detailedName && 
                               detailedName !== name && 
                               (!isWaterLocation || isCertified);
  
  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
    >
      <div className={`map-tooltip p-2 leaflet-popup-custom marker-popup-gradient ${className}`}>
        <div className="font-medium text-sm">{displayedName}</div>
        
        {/* Display detailed location when available */}
        {shouldShowDetailedName && (
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

        {/* Display SIQS score, but don't use default scores for certified locations */}
        <div className="mt-1.5 flex items-center">
          <SiqsScoreBadge 
            score={displaySiqs} 
            compact={true}
            loading={siqsLoading}
            isCertified={isCertified}
            forceCertified={false} // Don't force certified default scores
          />
        </div>
        
        {children}
        
        {/* Real-time SIQS provider - hidden component */}
        {latitude !== undefined && longitude !== undefined && !isWaterLocation && (
          <RealTimeSiqsProvider
            isVisible={true}
            latitude={latitude}
            longitude={longitude}
            isCertified={isCertified}
            isDarkSkyReserve={isDarkSkyReserve}
            existingSiqs={siqs}
            onSiqsCalculated={handleSiqsCalculated}
          />
        )}
      </div>
    </Popup>
  );
};

export default MapTooltip;
