
import { useState, useEffect } from 'react';
import { subscribeToLocationUpdates, getCurrentLocation } from '@/services/locationSyncService';

interface UseLocationSyncResult {
  syncedLocation: {
    latitude: number;
    longitude: number;
    name?: string;
  } | null;
  hasSyncedLocation: boolean;
}

export function useLocationSync(): UseLocationSyncResult {
  const [syncedLocation, setSyncedLocation] = useState<{
    latitude: number;
    longitude: number;
    name?: string;
  } | null>(getCurrentLocation());
  
  useEffect(() => {
    // Subscribe to location updates
    const unsubscribe = subscribeToLocationUpdates((location) => {
      if (location) {
        console.log('Location sync received update:', location);
        setSyncedLocation(location);
      }
    });
    
    return unsubscribe;
  }, []);
  
  return {
    syncedLocation,
    hasSyncedLocation: syncedLocation !== null
  };
}
