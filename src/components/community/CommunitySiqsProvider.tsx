
import React, { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface CommunitySiqsProviderProps {
  locationId: string;
  latitude: number;
  longitude: number;
  siqs: number | null;
  onSiqsCalculated: (spotId: string, siqs: number | null, loading: boolean) => void;
}

const CommunitySiqsProvider: React.FC<CommunitySiqsProviderProps> = ({
  locationId,
  latitude,
  longitude,
  siqs,
  onSiqsCalculated
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    // If already have SIQS, no need to calculate
    if (siqs !== null && siqs > 0) {
      return;
    }
    
    // Check if we have valid coordinates
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
      return;
    }
    
    // Simple debounce for calculations
    const timeout = setTimeout(async () => {
      try {
        setIsLoading(true);
        onSiqsCalculated(locationId, null, true);
        
        // For now, just use the existing SIQS if available
        // In a real app, you would make an API call here to calculate real-time SIQS
        setTimeout(() => {
          setIsLoading(false);
          onSiqsCalculated(locationId, siqs || 5.5, false);
        }, 800);
      } catch (error) {
        console.error("Error calculating real-time SIQS:", error);
        setIsLoading(false);
        onSiqsCalculated(locationId, siqs, false);
      }
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [locationId, latitude, longitude, siqs, onSiqsCalculated]);
  
  return null; // This is a non-visual component
};

export default CommunitySiqsProvider;
