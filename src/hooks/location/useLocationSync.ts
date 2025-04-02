
import { useState, useEffect } from 'react';
import { subscribeToLocationUpdates, getCurrentLocation } from '@/services/locationSyncService';
import { useNavigate } from 'react-router-dom';

interface UseLocationSyncResult {
  syncedLocation: {
    latitude: number;
    longitude: number;
    name?: string;
  } | null;
  hasSyncedLocation: boolean;
  isLocationUpdating: boolean;
}

export function useLocationSync(): UseLocationSyncResult {
  const [syncedLocation, setSyncedLocation] = useState<{
    latitude: number;
    longitude: number;
    name?: string;
    timestamp?: string;
  } | null>(getCurrentLocation());
  
  const [isLocationUpdating, setIsLocationUpdating] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Subscribe to location updates
    const unsubscribe = subscribeToLocationUpdates((location) => {
      if (location) {
        console.log('Location sync received update:', location);
        
        // Set updating state briefly to show feedback to user
        setIsLocationUpdating(true);
        setSyncedLocation(location);
        
        // If we're on the photo points page, navigate to refresh with new location
        const currentPath = window.location.pathname;
        if (currentPath.includes('/photopoints')) {
          console.log('On photo points page, refreshing with new location');
          
          // Use navigate with the same path but with a timestamp to force refresh
          navigate(`/photopoints?ts=${Date.now()}`, { 
            replace: true, 
            state: { 
              latitude: location.latitude,
              longitude: location.longitude,
              locationName: location.name
            }
          });
        }
        
        // Reset updating state after a short delay
        setTimeout(() => {
          setIsLocationUpdating(false);
        }, 1000);
      }
    });
    
    return unsubscribe;
  }, [navigate]);
  
  return {
    syncedLocation,
    hasSyncedLocation: syncedLocation !== null,
    isLocationUpdating
  };
}
