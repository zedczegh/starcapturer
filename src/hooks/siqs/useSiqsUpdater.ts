import { useState, useEffect, useCallback } from 'react';
import { calculateNighttimeSiqs } from '@/utils/siqs/cloudCoverUtils';
import { currentSiqsStore } from '@/components/index/CalculatorSection';

interface UseSiqsUpdaterProps {
  initialSiqs?: number | null;
  locationId?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Hook to manage and update SIQS scores consistently across the application
 */
export const useSiqsUpdater = ({ 
  initialSiqs = null,
  locationId,
  latitude,
  longitude
}: UseSiqsUpdaterProps = {}) => {
  const [siqsScore, setSiqsScore] = useState<number | null>(initialSiqs);
  
  // Update localStorage and global store with new SIQS value
  const updateSiqsValue = useCallback((newValue: number | null) => {
    if (newValue === null) {
      setSiqsScore(null);
      currentSiqsStore.setValue(null);
      console.log("SIQS value reset to null");
      return;
    }
    
    // Normalize and validate value
    const validValue = Math.min(10, Math.max(0, newValue));
    setSiqsScore(validValue);
    
    // Update global store
    currentSiqsStore.setValue(validValue);
    console.log(`SIQS value updated to ${validValue}`);
    
    // Update location-specific SIQS in localStorage if we have coordinates
    if (latitude !== undefined && longitude !== undefined) {
      try {
        const storageKey = locationId || `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
        const savedLocationString = localStorage.getItem('latest_siqs_location');
        
        if (savedLocationString) {
          const savedLocation = JSON.parse(savedLocationString);
          
          // Check if this is the same location
          if (savedLocation && 
              savedLocation.latitude === latitude && 
              savedLocation.longitude === longitude) {
            
            // Update SIQS value
            savedLocation.siqs = validValue;
            savedLocation.timestamp = new Date().toISOString();
            localStorage.setItem('latest_siqs_location', JSON.stringify(savedLocation));
            console.log(`Updated stored SIQS for location ${storageKey} to ${validValue}`);
          }
        } else if (locationId) {
          // Create new entry
          const newLocation = {
            id: locationId,
            latitude,
            longitude,
            siqs: validValue,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('latest_siqs_location', JSON.stringify(newLocation));
          console.log(`Created new stored SIQS for location ${locationId} with value ${validValue}`);
        }
      } catch (error) {
        console.error("Error updating SIQS in localStorage:", error);
      }
    }
  }, [locationId, latitude, longitude]);
  
  // Initialize from localStorage on first mount
  useEffect(() => {
    // Try to get SIQS from localStorage on component mount
    if (latitude && longitude) {
      try {
        const storageKey = locationId || `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
        const savedLocationString = localStorage.getItem('latest_siqs_location');
        
        if (savedLocationString) {
          const savedLocation = JSON.parse(savedLocationString);
          if (savedLocation && 
              savedLocation.latitude === latitude && 
              savedLocation.longitude === longitude &&
              typeof savedLocation.siqs === 'number') {
            
            // Use stored SIQS value
            setSiqsScore(savedLocation.siqs);
            currentSiqsStore.setValue(savedLocation.siqs);
            console.log(`Initialized SIQS from localStorage: ${savedLocation.siqs}`);
            return;
          }
        }
      } catch (error) {
        console.error("Error reading SIQS from localStorage:", error);
      }
    }
    
    // If no match in localStorage, use initial value if provided
    if (initialSiqs !== null) {
      setSiqsScore(initialSiqs);
      currentSiqsStore.setValue(initialSiqs);
      console.log(`Initialized SIQS from initialSiqs: ${initialSiqs}`);
    } else {
      // Make sure we explicitly set to null rather than keeping undefined
      setSiqsScore(null);
      currentSiqsStore.setValue(null);
      console.log("No SIQS found, initialized to null");
    }
  }, [locationId, latitude, longitude, initialSiqs]);
  
  // Check for updates from global store periodically
  useEffect(() => {
    // Initial synchronization
    const storedValue = currentSiqsStore.getValue();
    if (storedValue !== null && storedValue !== siqsScore) {
      console.log(`Syncing SIQS from global store: ${storedValue}`);
      setSiqsScore(storedValue);
    }
    
    // Setup interval to check for updates
    const intervalId = setInterval(() => {
      const latestValue = currentSiqsStore.getValue();
      if (latestValue !== null && latestValue !== siqsScore) {
        console.log(`Updated SIQS from global store: ${latestValue}`);
        setSiqsScore(latestValue);
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(intervalId);
  }, [siqsScore]);
  
  return {
    siqsScore,
    updateSiqsValue
  };
};

export default useSiqsUpdater;
