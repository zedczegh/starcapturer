
import React, { useEffect, useState } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface RealTimeLocationUpdaterProps {
  userLocation: { latitude: number; longitude: number } | null;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

/**
 * Component that performs real-time location updates and SIQS calculations
 * This is extracted from PhotoPointsMap to improve modularity
 */
const RealTimeLocationUpdater: React.FC<RealTimeLocationUpdaterProps> = ({
  userLocation,
  onLocationUpdate
}) => {
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  // Effect for real-time location updates
  useEffect(() => {
    if (!userLocation || isUpdating) return;
    
    const now = Date.now();
    // Only update if more than 2 seconds since last update
    if (now - lastUpdateTime < 2000) return;
    
    const performUpdate = async () => {
      setIsUpdating(true);
      try {
        // Calculate real-time SIQS for current location
        if (userLocation.latitude && userLocation.longitude) {
          await calculateRealTimeSiqs(
            userLocation.latitude,
            userLocation.longitude
          );
        }
      } catch (error) {
        console.error("Error in real-time location update:", error);
      } finally {
        setIsUpdating(false);
        setLastUpdateTime(Date.now());
      }
    };
    
    performUpdate();
  }, [userLocation, lastUpdateTime, isUpdating]);
  
  return null;
};

export default RealTimeLocationUpdater;
