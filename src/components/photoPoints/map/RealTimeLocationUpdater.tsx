
import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';

interface RealTimeLocationUpdaterProps {
  userLocation: { latitude: number; longitude: number } | null;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

/**
 * Component that automatically refreshes location data without user interaction
 * Auto-clears cache and updates location data when needed
 */
const RealTimeLocationUpdater: React.FC<RealTimeLocationUpdaterProps> = ({
  userLocation,
  onLocationUpdate
}) => {
  const { t } = useLanguage();
  const [lastUserLocation, setLastUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  
  // Check if location has changed significantly
  const checkLocationChange = useCallback(() => {
    if (!userLocation || !lastUserLocation) return;
    
    const latDiff = Math.abs(userLocation.latitude - lastUserLocation.latitude);
    const lngDiff = Math.abs(userLocation.longitude - lastUserLocation.longitude);
    
    // If location changed more than ~1km, refresh data
    if (latDiff > 0.01 || lngDiff > 0.01) {
      console.log("Location changed significantly, refreshing data");
      clearLocationCache();
      setLastUserLocation(userLocation);
    }
  }, [userLocation, lastUserLocation]);
  
  // Initialize last location
  useEffect(() => {
    if (userLocation && !lastUserLocation) {
      setLastUserLocation(userLocation);
    }
  }, [userLocation, lastUserLocation]);
  
  // Check location change periodically
  useEffect(() => {
    checkLocationChange();
    
    // Also periodically refresh if needed
    const refreshInterval = setInterval(() => {
      checkLocationChange();
    }, 60000); // Check every minute
    
    return () => clearInterval(refreshInterval);
  }, [checkLocationChange]);
  
  return null; // This component doesn't render anything
};

export default RealTimeLocationUpdater;
