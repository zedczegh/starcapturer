
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
  const [certifiedLocationsLoaded, setCertifiedLocationsLoaded] = useState(false);
  const [allCertifiedLocations, setAllCertifiedLocations] = useState<SharedAstroSpot[]>([]);
  
  // Refs for optimization
  const previousLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  const certifiedLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserLocation = useRef<{latitude: number, longitude: number} | null>(null);
  const lastLoadTimestamp = useRef<number>(0);
  const certifiedLocationsCache = useRef<SharedAstroSpot[]>([]);

  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  // Helper function to determine if certified locations should be refreshed
  const shouldRefreshCertified = useCallback((currentLocation: {latitude: number, longitude: number}) => {
    if (!lastUserLocation.current) return true;
    
    // Check if location has changed significantly (more than 20 degrees - roughly 2000km)
    const latDiff = Math.abs(currentLocation.latitude - lastUserLocation.current.latitude);
    const lngDiff = Math.abs(currentLocation.longitude - lastUserLocation.current.longitude);
    
    // Use time-based refresh as well - refresh every 10 minutes regardless
    const timeSinceLastLoad = Date.now() - lastLoadTimestamp.current;
    const timeThreshold = 10 * 60 * 1000; // 10 minutes
    
    return latDiff > 20 || lngDiff > 20 || timeSinceLastLoad > timeThreshold;
  }, []);
  
  // Load all certified locations when map is ready
  useEffect(() => {
    const loadAllCertifiedLocations = async () => {
      // Only load certified locations once or when user location changes significantly
      if (mapReady && userLocation && 
          (!certifiedLocationsLoaded || shouldRefreshCertified(userLocation))) {
        
        try {
          console.log("Loading all certified dark sky locations globally");
          
          // Clear any existing timeout
          if (certifiedLoadingTimeoutRef.current) {
            clearTimeout(certifiedLoadingTimeoutRef.current);
          }
          
          // Use cache if available and recent
          if (certifiedLocationsCache.current.length > 0 && 
              Date.now() - lastLoadTimestamp.current < 60 * 60 * 1000) { // 1 hour cache validity
            console.log(`Using cached certified locations: ${certifiedLocationsCache.current.length} locations`);
            setAllCertifiedLocations(certifiedLocationsCache.current);
            setCertifiedLocationsLoaded(true);
            return;
          }
          
          // Add a small delay to prevent rapid reloading
          certifiedLoadingTimeoutRef.current = setTimeout(async () => {
            const certifiedResults = await findCertifiedLocations(
              userLocation.latitude,
              userLocation.longitude,
              35000, // Global radius to ensure we get ALL locations
              500    // Increased limit to get all certified locations
            );
            
            if (certifiedResults.length > 0) {
              console.log(`Loaded ${certifiedResults.length} certified dark sky locations`);
              setAllCertifiedLocations(certifiedResults);
              certifiedLocationsCache.current = certifiedResults;
              
              // Store all certified locations in the global store for persistence
              certifiedResults.forEach(location => {
                if (location.isDarkSkyReserve || location.certification) {
                  addLocationToStore(location);
                }
              });
            }
            
            lastUserLocation.current = userLocation;
            lastLoadTimestamp.current = Date.now();
            setCertifiedLocationsLoaded(true);
          }, 300);
        } catch (error) {
          console.error("Error loading certified locations:", error);
          setCertifiedLocationsLoaded(true); // Mark as loaded even on error to prevent repeated attempts
        }
      }
    };
    
    loadAllCertifiedLocations();
    
    return () => {
      if (certifiedLoadingTimeoutRef.current) {
        clearTimeout(certifiedLoadingTimeoutRef.current);
      }
    };
  }, [mapReady, userLocation, certifiedLocationsLoaded, shouldRefreshCertified]);
  
  // Combine locations - for certified view, always include all certified locations
  const combinedLocations = useCallback(() => {
    const locMap = new Map<string, SharedAstroSpot>();
    
    // First add all certified locations from the full set
    if (allCertifiedLocations.length > 0) {
      allCertifiedLocations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locMap.set(key, loc);
      });
    }
    
    // Then add locations from main locations array (will overwrite duplicates with more recent data)
    locations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      locMap.set(key, loc);
    });
    
    return Array.from(locMap.values());
  }, [locations, allCertifiedLocations]);
  
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

  // Calculate map center coordinates - memoized to improve performance
  const mapCenter = userLocation 
    ? [userLocation.latitude, userLocation.longitude] as [number, number]
    : processedLocations.length > 0
      ? [processedLocations[0].latitude, processedLocations[0].longitude] as [number, number]
      : [39.9042, 116.4074] as [number, number]; // Default center (Beijing)

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
    initialZoom
  };
};
