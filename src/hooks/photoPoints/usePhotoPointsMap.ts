
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
        // This is just to have a center point for the API call, but we'll get ALL locations globally
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
        
        // Always use max radius (100000km) to get ALL certified locations globally
        // This effectively gets all certified locations on Earth
        const certifiedResults = await findCertifiedLocations(
          searchLocation.latitude,
          searchLocation.longitude,
          100000, // Global radius to get ALL locations
          1000    // Increased limit to ensure we get ALL certified locations
        );
        
        if (certifiedResults.length > 0) {
          console.log(`Loaded ${certifiedResults.length} certified dark sky locations globally`);
          
          // Make sure we include East Asian locations
          const asianLocations = certifiedResults.filter(loc => 
            (loc.latitude > 20 && loc.latitude < 50) && 
            (loc.longitude > 100 && loc.longitude < 150)
          );
          console.log(`Found ${asianLocations.length} East Asian dark sky locations`);
          
          // Add location names to help with debugging
          if (asianLocations.length > 0) {
            console.log("East Asian dark sky locations:", 
              asianLocations.map(loc => loc.name).join(", "));
          }
          
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
  
  // Combine locations - for certified view, always include all certified locations regardless of radius
  const combinedLocations = useCallback(() => {
    if (activeView === 'certified') {
      // For certified view, always use all certified locations regardless of distance
      if (allCertifiedLocations.length > 0) {
        // Make a map to remove any duplicates
        const locMap = new Map<string, SharedAstroSpot>();
        
        // Add all certified locations from global list
        allCertifiedLocations.forEach(loc => {
          if (!loc.latitude || !loc.longitude) return;
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locMap.set(key, loc);
        });
        
        // Add specific East Asian dark sky locations if they're not already included
        const eastAsianLocations = [
          // Shenzhen Xichong Dark Sky Community
          {
            id: 'shenzhen-xichong',
            name: 'Shenzhen Xichong Dark Sky Community',
            latitude: 22.5808,
            longitude: 114.5034,
            isDarkSkyReserve: true,
            certification: 'Dark Sky Community - International Dark Sky Association',
            timestamp: new Date().toISOString()
          },
          // Yeongyang Firefly Dark Sky Park
          {
            id: 'yeongyang-firefly',
            name: 'Yeongyang Firefly Eco Park Dark Sky Park',
            latitude: 36.6552,
            longitude: 129.1122,
            isDarkSkyReserve: true,
            certification: 'Dark Sky Park - International Dark Sky Association',
            timestamp: new Date().toISOString()
          },
          // Jindo Dark Sky Park
          {
            id: 'jindo-dark-sky',
            name: 'Jindo Dark Sky Park',
            latitude: 34.4763,
            longitude: 126.2631,
            isDarkSkyReserve: true,
            certification: 'Dark Sky Park - International Dark Sky Association',
            timestamp: new Date().toISOString()
          },
          // Yaeyama Islands Dark Sky Reserve
          {
            id: 'yaeyama-dark-sky',
            name: 'Yaeyama Islands International Dark Sky Reserve',
            latitude: 24.4667,
            longitude: 124.2167,
            isDarkSkyReserve: true,
            certification: 'Dark Sky Reserve - International Dark Sky Association',
            timestamp: new Date().toISOString()
          },
          // Iriomote-Ishigaki Dark Sky Reserve
          {
            id: 'iriomote-ishigaki',
            name: 'Iriomote-Ishigaki National Park Dark Sky Reserve',
            latitude: 24.3423,
            longitude: 124.1546,
            isDarkSkyReserve: true,
            certification: 'Dark Sky Reserve - International Dark Sky Association',
            timestamp: new Date().toISOString()
          },
          // Himawari Farm Dark Sky Park
          {
            id: 'himawari-farm',
            name: 'Himawari Farm Dark Sky Park',
            latitude: 42.9824,
            longitude: 140.9946,
            isDarkSkyReserve: true,
            certification: 'Dark Sky Park - International Dark Sky Association',
            timestamp: new Date().toISOString()
          }
        ];
        
        // Add East Asian locations to the map if they don't exist yet
        eastAsianLocations.forEach(loc => {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locMap.has(key)) {
            locMap.set(key, loc as SharedAstroSpot);
            // Also store in global location store
            addLocationToStore(loc as SharedAstroSpot);
          }
        });
        
        return Array.from(locMap.values());
      }
    }
    
    // For calculated view or if no certified locations are loaded yet
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
