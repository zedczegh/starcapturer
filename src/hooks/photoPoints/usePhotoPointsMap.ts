
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations } from './useMapLocations';
import { useMapUtils } from './useMapUtils';
import { findCertifiedLocations } from '@/services/locationSearchService';
import { addLocationToStore } from '@/services/calculatedLocationsService';

interface UsePhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
}

export const usePhotoPointsMap = ({
  userLocation,
  locations,
  searchRadius,
  activeView
}: UsePhotoPointsMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SharedAstroSpot | null>(null);
  const previousLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  const [certifiedLocationsLoaded, setCertifiedLocationsLoaded] = useState(false);
  const [allCertifiedLocations, setAllCertifiedLocations] = useState<SharedAstroSpot[]>([]);
  const certifiedLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track last user location for performance optimization
  const lastUserLocation = useRef<{latitude: number, longitude: number} | null>(null);

  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  // Load all certified locations immediately when component mounts
  useEffect(() => {
    const loadAllCertifiedLocations = async () => {
      try {
        console.log("Loading all certified dark sky locations globally on page load");
        
        // Use a default location if user location is not available yet
        const searchLocation = userLocation || { latitude: 39.9042, longitude: 116.4074 };
        
        const certifiedResults = await findCertifiedLocations(
          searchLocation.latitude,
          searchLocation.longitude,
          10000, // Global radius
          300 // Increased limit to get more certified locations
        );
        
        if (certifiedResults.length > 0) {
          console.log(`Loaded ${certifiedResults.length} certified dark sky locations`);
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
        console.error("Error loading certified locations on mount:", error);
        setCertifiedLocationsLoaded(true); // Mark as loaded even on error to prevent repeated attempts
      }
    };
    
    // Load certified locations immediately on mount
    loadAllCertifiedLocations();
    
    return () => {
      if (certifiedLoadingTimeoutRef.current) {
        clearTimeout(certifiedLoadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Refresh certified locations when map is ready and user location changes significantly
  useEffect(() => {
    const refreshCertifiedLocations = async () => {
      if (mapReady && userLocation && shouldRefreshCertified(userLocation)) {
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
    };
    
    refreshCertifiedLocations();
    
    return () => {
      if (certifiedLoadingTimeoutRef.current) {
        clearTimeout(certifiedLoadingTimeoutRef.current);
      }
    };
  }, [mapReady, userLocation]);
  
  // Helper function to determine if certified locations should be refreshed
  const shouldRefreshCertified = (currentLocation: {latitude: number, longitude: number}) => {
    if (!lastUserLocation.current) return true;
    
    // Check if location has changed significantly (more than 500km)
    const latDiff = Math.abs(currentLocation.latitude - lastUserLocation.current.latitude);
    const lngDiff = Math.abs(currentLocation.longitude - lastUserLocation.current.longitude);
    
    // Rough distance calculation - if either coordinate has changed by ~5 degrees, that's roughly 500km
    return latDiff > 5 || lngDiff > 5;
  };
  
  // Combine locations - for certified view, always include all certified locations
  const combinedLocations = useCallback(() => {
    if (activeView === 'certified' && allCertifiedLocations.length > 0) {
      // Make a map to remove any duplicates
      const locMap = new Map<string, SharedAstroSpot>();
      
      // First add all certified locations from global list
      allCertifiedLocations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locMap.set(key, loc);
      });
      
      // Then add locations from main locations array
      locations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        // Prefer locations from the main array as they might have more up-to-date data
        locMap.set(key, loc);
      });
      
      return Array.from(locMap.values());
    }
    
    return locations;
  }, [locations, allCertifiedLocations, activeView]);
  
  // Use the location processing hook
  const { processedLocations } = useMapLocations({
    userLocation,
    locations: combinedLocations(),
    searchRadius,
    activeView,
    mapReady
  });

  // Track location changes
  useEffect(() => {
    if (!userLocation) return;
    
    // Check if location has changed significantly
    const locationChanged = !previousLocationRef.current ||
      Math.abs(previousLocationRef.current.latitude - userLocation.latitude) > 0.01 ||
      Math.abs(previousLocationRef.current.longitude - userLocation.longitude) > 0.01;
    
    if (locationChanged) {
      previousLocationRef.current = userLocation;
    }
  }, [userLocation]);

  // Calculate map center coordinates
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : processedLocations.length > 0
      ? [processedLocations[0].latitude, processedLocations[0].longitude]
      : [39.9042, 116.4074]; // Default center (Beijing)

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const initialZoom = getZoomLevel(searchRadius);

  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations: processedLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    allCertifiedLocationsCount: allCertifiedLocations.length
  };
};
