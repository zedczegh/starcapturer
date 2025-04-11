
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations } from './useMapLocations';
import { useMapUtils } from './useMapUtils';
import { findCertifiedLocations } from '@/services/locationSearchService';
import { addLocationToStore } from '@/services/calculatedLocationsService';
import { getIDADarkSkyLocations } from '@/services/idaLocationService';

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
          
          // Add a small delay to prevent rapid reloading
          certifiedLoadingTimeoutRef.current = setTimeout(async () => {
            // First get IDA certified locations from our curated list
            const idaLocations = getIDADarkSkyLocations();
            
            // Then get additional certified locations from the API
            const apiCertifiedResults = await findCertifiedLocations(
              userLocation.latitude,
              userLocation.longitude,
              10000, // Global radius
              150 // Increased limit to get more certified locations
            );
            
            // Combine both lists, removing duplicates
            const combinedResults = [...idaLocations];
            
            // Add API results that don't already exist in the IDA list
            for (const apiLoc of apiCertifiedResults) {
              // Skip if this location already exists in the combined results
              const exists = combinedResults.some(loc => 
                (loc.id && loc.id === apiLoc.id) || 
                (Math.abs(loc.latitude - apiLoc.latitude) < 0.01 && 
                 Math.abs(loc.longitude - apiLoc.longitude) < 0.01)
              );
              
              if (!exists) {
                combinedResults.push(apiLoc);
              }
            }
            
            if (combinedResults.length > 0) {
              console.log(`Loaded ${combinedResults.length} certified dark sky locations (${idaLocations.length} from IDA database, ${apiCertifiedResults.length} from API)`);
              setAllCertifiedLocations(combinedResults);
              
              // Store all certified locations in the global store for persistence
              combinedResults.forEach(location => {
                if (location.isDarkSkyReserve || location.certification) {
                  addLocationToStore(location);
                }
              });
            }
            
            lastUserLocation.current = userLocation;
            setCertifiedLocationsLoaded(true);
          }, 500);
        } catch (error) {
          console.error("Error loading certified locations:", error);
          
          // Even if the API call fails, use our manual IDA locations
          const idaLocations = getIDADarkSkyLocations();
          setAllCertifiedLocations(idaLocations);
          console.log(`Fallback to manual IDA locations: ${idaLocations.length} locations`);
          
          setCertifiedLocationsLoaded(true);
        }
      }
    };
    
    loadAllCertifiedLocations();
    
    return () => {
      if (certifiedLoadingTimeoutRef.current) {
        clearTimeout(certifiedLoadingTimeoutRef.current);
      }
    };
  }, [mapReady, userLocation, certifiedLocationsLoaded]);
  
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
      
      // First add certified locations from main locations array
      locations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        locMap.set(key, loc);
      });
      
      // Then add global certified locations, not overwriting existing ones
      allCertifiedLocations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        if (!locMap.has(key)) {
          locMap.set(key, loc);
        }
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
    initialZoom
  };
};
