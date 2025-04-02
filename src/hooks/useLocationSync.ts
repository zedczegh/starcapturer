
import { useEffect, useState, useCallback } from 'react';
import { subscribeToLocationUpdates, getLatestLocation, LocationUpdate } from '@/services/locationSyncService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook to synchronize location data across different parts of the application
 */
export function useLocationSync() {
  const [syncedLocation, setSyncedLocation] = useState<LocationUpdate | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { t } = useLanguage();
  
  // Handle location updates from other components
  const handleLocationUpdate = useCallback((locationData: LocationUpdate) => {
    console.log('Location sync received update:', locationData.name);
    
    // Don't notify if this is the first sync or from the same source
    if (lastSyncTime && locationData.source !== syncedLocation?.source) {
      toast.info(
        t('Location updated', '位置已更新'),
        {
          description: locationData.name,
          duration: 3000
        }
      );
    }
    
    setSyncedLocation(locationData);
    setLastSyncTime(new Date().toISOString());
  }, [syncedLocation, lastSyncTime, t]);
  
  // Initialize with latest location from localStorage
  useEffect(() => {
    const savedLocation = getLatestLocation();
    if (savedLocation && !syncedLocation) {
      console.log('Initializing with saved location:', savedLocation.name);
      setSyncedLocation(savedLocation);
    }
  }, [syncedLocation]);
  
  // Subscribe to location updates
  useEffect(() => {
    const unsubscribe = subscribeToLocationUpdates(handleLocationUpdate);
    return unsubscribe;
  }, [handleLocationUpdate]);
  
  return {
    syncedLocation,
    lastSyncTime
  };
}
