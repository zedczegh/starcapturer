
import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findCertifiedLocations } from '@/services/locationSearchService';
import { addLocationToStore } from '@/services/calculatedLocationsService';

/**
 * Hook to manage loading and refreshing certified locations
 */
export const useCertifiedLocationsLoader = () => {
  const [allCertifiedLocations, setAllCertifiedLocations] = useState<SharedAstroSpot[]>([]);
  const [certifiedLocationsLoaded, setCertifiedLocationsLoaded] = useState(false);
  const certifiedLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserLocation = useRef<{latitude: number, longitude: number} | null>(null);

  // Load initial certified locations
  const loadInitialCertifiedLocations = useCallback(async (userLocation?: { latitude: number; longitude: number } | null) => {
    try {
      console.log("Loading all certified dark sky locations globally");
      
      // Use a default location if user location is not available yet
      const searchLocation = userLocation || { latitude: 39.9042, longitude: 116.4074 };
      
      // First, try to load from cache for faster initial render
      try {
        const cachedData = localStorage.getItem('cachedCertifiedLocations');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`Using ${parsed.length} cached certified locations initially`);
            setAllCertifiedLocations(parsed);
          }
        }
      } catch (error) {
        console.error("Error loading cached certified locations:", error);
      }
      
      const certifiedResults = await findCertifiedLocations(
        searchLocation.latitude,
        searchLocation.longitude,
        10000, // Global radius
        500 // Increased limit for more locations
      );
      
      if (certifiedResults.length > 0) {
        console.log(`Loaded ${certifiedResults.length} certified dark sky locations`);
        
        // Save to cache for faster future loads
        try {
          localStorage.setItem('cachedCertifiedLocations', JSON.stringify(certifiedResults));
        } catch (error) {
          console.error("Error saving certified locations to cache:", error);
        }
        
        setAllCertifiedLocations(certifiedResults);
        
        // Store all certified locations in the global store for persistence
        certifiedResults.forEach(location => {
          if (location.isDarkSkyReserve || location.certification) {
            addLocationToStore(location);
          }
        });
      }
      
      lastUserLocation.current = searchLocation;
      setCertifiedLocationsLoaded(true);
    } catch (error) {
      console.error("Error loading certified locations:", error);
      setCertifiedLocationsLoaded(true); // Mark as loaded even on error to prevent repeated attempts
    }
  }, []);

  // Refresh certified locations based on new user location
  const refreshCertifiedLocations = useCallback(async (userLocation: {latitude: number, longitude: number}) => {
    if (shouldRefreshCertified(userLocation)) {
      try {
        console.log("Refreshing certified dark sky locations based on new user location");
        
        // Clear any existing timeout
        if (certifiedLoadingTimeoutRef.current) {
          clearTimeout(certifiedLoadingTimeoutRef.current);
        }
        
        // Add a small delay to prevent rapid reloading
        certifiedLoadingTimeoutRef.current = setTimeout(async () => {
          const certifiedResults = await findCertifiedLocations(
            userLocation.latitude,
            userLocation.longitude,
            10000, // Global radius
            300 // Increased limit
          );
          
          if (certifiedResults.length > 0) {
            console.log(`Refreshed ${certifiedResults.length} certified dark sky locations`);
            setAllCertifiedLocations(prevLocations => {
              // Combine new results with existing locations, removing duplicates
              const existingIds = new Set(prevLocations.map(loc => loc.id));
              const newLocations = certifiedResults.filter(loc => !existingIds.has(loc.id));
              return [...prevLocations, ...newLocations];
            });
            
            // Store all certified locations in the global store for persistence
            certifiedResults.forEach(location => {
              if (location.isDarkSkyReserve || location.certification) {
                addLocationToStore(location);
              }
            });
          }
          
          lastUserLocation.current = userLocation;
        }, 500);
      } catch (error) {
        console.error("Error refreshing certified locations:", error);
      }
    }
  }, []);

  // Helper function to determine if certified locations should be refreshed
  const shouldRefreshCertified = (currentLocation: {latitude: number, longitude: number}) => {
    if (!lastUserLocation.current) return true;
    
    // Check if location has changed significantly (more than 500km)
    const latDiff = Math.abs(currentLocation.latitude - lastUserLocation.current.latitude);
    const lngDiff = Math.abs(currentLocation.longitude - lastUserLocation.current.longitude);
    
    // Rough distance calculation - if either coordinate has changed by ~5 degrees, that's roughly 500km
    return latDiff > 5 || lngDiff > 5;
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (certifiedLoadingTimeoutRef.current) {
        clearTimeout(certifiedLoadingTimeoutRef.current);
      }
    };
  }, []);

  return {
    allCertifiedLocations,
    certifiedLocationsLoaded,
    loadInitialCertifiedLocations,
    refreshCertifiedLocations
  };
};
