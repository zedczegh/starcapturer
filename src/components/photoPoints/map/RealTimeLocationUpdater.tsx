
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface RealTimeLocationUpdaterProps {
  userLocation: { latitude: number; longitude: number } | null;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  updateInterval?: number;
}

/**
 * Component to handle real-time location updates for map
 */
const RealTimeLocationUpdater: React.FC<RealTimeLocationUpdaterProps> = ({
  userLocation,
  onLocationUpdate,
  updateInterval = 60000 // Default: update every minute
}) => {
  const { t } = useLanguage();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  
  // Only attempt updates if we have an initial location and an update handler
  useEffect(() => {
    if (!userLocation || !onLocationUpdate) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime;
        
        // Only update if significant time has passed
        if (timeSinceLastUpdate > updateInterval) {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          
          // Check if location has changed significantly (more than 0.5km)
          const hasChangedSignificantly = 
            Math.abs(newLat - userLocation.latitude) > 0.005 || 
            Math.abs(newLng - userLocation.longitude) > 0.005;
          
          if (hasChangedSignificantly) {
            onLocationUpdate(newLat, newLng);
            setLastUpdateTime(now);
            toast.info(t(
              "Your location has been updated automatically", 
              "您的位置已自动更新"
            ), { duration: 3000 });
          }
        }
      },
      (error) => {
        console.log("Location watch error:", error);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 30000,
        maximumAge: updateInterval / 2
      }
    );
    
    // Cleanup
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [userLocation, onLocationUpdate, lastUpdateTime, updateInterval, t]);
  
  // This is a background component with no visual elements
  return null;
};

export default RealTimeLocationUpdater;
