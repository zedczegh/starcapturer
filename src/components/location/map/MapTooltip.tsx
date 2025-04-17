
import React, { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEnhancedLocationDetails } from './tooltip/EnhancedLocationDetails';
import { Language } from '@/services/geocoding/types';
import { getSiqsScore } from '@/utils/siqsHelpers';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';

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
  const [isOpen, setIsOpen] = useState(false);
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Get enhanced location details using our custom hook
  const { detailedName } = useEnhancedLocationDetails({ 
    latitude, 
    longitude, 
    language: typedLanguage 
  });

  // Check if this is a certified location
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  // Get initial SIQS score using helper function
  const initialSiqsScore = getSiqsScore(siqs);
  
  // Fetch real-time SIQS when tooltip opens for certified locations
  useEffect(() => {
    // Only fetch for certified locations when the tooltip is open
    // and we have valid coordinates
    if (isOpen && isCertified && latitude && longitude) {
      const fetchSiqs = async () => {
        // Don't fetch again if we already have real-time data
        if (realTimeSiqs !== null) return;
        
        setLoading(true);
        try {
          // Estimate Bortle scale based on certification (better for dark sites)
          const estimatedBortleScale = isDarkSkyReserve ? 3 : 4;
          
          const result = await calculateRealTimeSiqs(
            latitude, 
            longitude,
            estimatedBortleScale
          );
          
          if (result && typeof result.siqs === 'number') {
            console.log(`Real-time SIQS for ${name}: ${result.siqs.toFixed(1)}`);
            setRealTimeSiqs(result.siqs);
          }
        } catch (error) {
          console.error("Error fetching real-time SIQS:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSiqs();
    }
  }, [isOpen, isCertified, latitude, longitude, name, realTimeSiqs]);
  
  // Handle popup events
  const handlePopupOpen = () => {
    setIsOpen(true);
  };
  
  const handlePopupClose = () => {
    setIsOpen(false);
  };
  
  // Use real-time SIQS if available, otherwise use provided SIQS (if valid)
  // Don't use a default score anymore
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : initialSiqsScore;
  
  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
    >
      <div 
        className={`map-tooltip p-2 leaflet-popup-custom marker-popup-gradient ${className}`}
        // Use onMount and onUnmount in this wrapper div instead of eventHandlers
        ref={(node) => {
          if (node && !isOpen) {
            setIsOpen(true);
            handlePopupOpen();
          }
        }}
      >
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

        {/* Show SIQS score if available or if it's loading for certified locations */}
        {(displaySiqs > 0 || loading) && (
          <div className="mt-1.5 flex items-center">
            <SiqsScoreBadge 
              score={displaySiqs} 
              compact={true}
              loading={loading}
              isCertified={isCertified}
            />
          </div>
        )}
        
        {children}
      </div>
    </Popup>
  );
};

export default MapTooltip;
