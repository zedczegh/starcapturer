
import React, { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEnhancedLocationDetails } from './tooltip/EnhancedLocationDetails';
import { Language } from '@/services/geocoding/types';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';

interface MapTooltipProps {
  name: string;
  children?: React.ReactNode;
  className?: string;
  latitude?: number;
  longitude?: number;
  siqs?: number;
  certification?: string;
  isDarkSkyReserve?: boolean;
}

const MapTooltip: React.FC<MapTooltipProps> = ({ 
  name, 
  children,
  className = '',
  latitude,
  longitude,
  siqs,
  certification,
  isDarkSkyReserve
}) => {
  const { language } = useLanguage();
  const typedLanguage: Language = language === 'zh' ? 'zh' : 'en';
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get enhanced location details using our custom hook
  const { detailedName } = useEnhancedLocationDetails({ 
    latitude, 
    longitude, 
    language: typedLanguage 
  });
  
  // Fetch real-time SIQS if coordinates are available
  useEffect(() => {
    if (latitude && longitude) {
      // Check for cached SIQS data first
      const cacheKey = `siqs_${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const { siqs: cachedSiqs, timestamp } = JSON.parse(cachedData);
          // Use cached data if less than 1 hour old
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            console.log("Using cached SIQS data for tooltip");
            setRealTimeSiqs(cachedSiqs);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to read cached SIQS data:", e);
      }
      
      // Fetch real-time data if no valid cache
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Use a reasonable bortle scale estimate based on location type
          const bortleScale = isDarkSkyReserve || certification ? 3 : 5;
          
          const result = await calculateRealTimeSiqs(latitude, longitude, bortleScale);
          if (result && result.siqs) {
            setRealTimeSiqs(result.siqs);
            
            // Cache the result
            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                siqs: result.siqs,
                timestamp: Date.now()
              }));
            } catch (e) {
              console.warn("Failed to cache SIQS data:", e);
            }
          }
        } catch (error) {
          console.error("Error fetching real-time SIQS for tooltip:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [latitude, longitude, isDarkSkyReserve, certification]);
  
  // Determine which SIQS score to display
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : siqs;
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
    >
      <div className={`map-tooltip p-2 leaflet-popup-custom marker-popup-gradient ${className}`}>
        <div className="flex items-start justify-between">
          <div className="font-medium text-sm">{name}</div>
          {displaySiqs !== undefined && (
            <SiqsScoreBadge 
              score={displaySiqs} 
              loading={isLoading} 
              compact={true}
              isCertified={isCertified}
              latitude={latitude}
              longitude={longitude}
            />
          )}
        </div>
        
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
