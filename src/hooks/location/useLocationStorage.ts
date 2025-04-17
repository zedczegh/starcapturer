
import { useState, useEffect } from "react";
import { saveLocation, getSavedLocation } from "@/utils/locationStorage";

export interface StoredLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
}

export const useLocationStorage = (
  locationName: string,
  latitude: string,
  longitude: string,
  bortleScale: number | null
) => {
  const [hasTriedStoredLocation, setHasTriedStoredLocation] = useState(false);

  // Try to restore previous location when component initializes
  const restoreSavedLocation = (
    setLocationName: (name: string) => void,
    setLatitude: (lat: string) => void,
    setLongitude: (lng: string) => void,
    setShowAdvancedSettings: (show: boolean) => void,
    setLocalBortleScale: (scale: number | null) => void,
    fetchLightPollution: (lat: number, lng: number) => Promise<void>
  ) => {
    if (hasTriedStoredLocation || locationName || latitude || longitude) {
      return; // Already initialized or tried
    }
    
    try {
      const storedLocation = getSavedLocation();
      if (storedLocation && storedLocation.name && 
          typeof storedLocation.latitude === 'number' &&
          typeof storedLocation.longitude === 'number') {
        
        // Restore the saved location
        setLocationName(storedLocation.name);
        setLatitude(storedLocation.latitude.toString());
        setLongitude(storedLocation.longitude.toString());
        setShowAdvancedSettings(true);
        
        // Update Bortle scale based on the restored location
        if (bortleScale === null && storedLocation.bortleScale === undefined) {
          fetchLightPollution(storedLocation.latitude, storedLocation.longitude);
        } else if (storedLocation.bortleScale !== undefined) {
          setLocalBortleScale(storedLocation.bortleScale);
        }
      }
    } catch (error) {
      console.error("Error restoring location:", error);
    } finally {
      setHasTriedStoredLocation(true);
    }
  };
  
  // Save location whenever it changes
  const persistLocation = () => {
    if (!locationName || !latitude || !longitude) return;
    
    const parsedLatitude = parseFloat(latitude);
    const parsedLongitude = parseFloat(longitude);
    
    if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) return;
    
    saveLocation({
      name: locationName,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      bortleScale: bortleScale || undefined
    });
  };
  
  return {
    hasTriedStoredLocation,
    setHasTriedStoredLocation,
    restoreSavedLocation,
    persistLocation
  };
};
