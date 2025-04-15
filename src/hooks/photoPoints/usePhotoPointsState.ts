
import { useState, useCallback, useEffect, useRef } from 'react';
import { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';

// Default radius constants
const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
const DEFAULT_CERTIFIED_RADIUS = 100000; // 100000km for certified locations (effectively global)

export function usePhotoPointsState() {
  // Get geolocation data
  const { 
    loading: locationLoading, 
    coords, 
    getPosition, 
    error: locationError 
  } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 60000, // Use cached position for 1 minute
    timeout: 10000 // Timeout after 10 seconds
  });
  
  // Core state
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [locationLoadAttempts, setLocationLoadAttempts] = useState(0);
  const [manualLocationOverride, setManualLocationOverride] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(DEFAULT_CALCULATED_RADIUS);
  
  // Refs for handling view changes
  const isViewChangeInProgress = useRef(false);
  const viewChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Try to get position on mount
  useEffect(() => {
    if (!coords && locationLoadAttempts < 3) {
      console.log("Getting user position, attempt:", locationLoadAttempts + 1);
      const timeoutId = setTimeout(() => {
        getPosition();
        setLocationLoadAttempts(prev => prev + 1);
      }, locationLoadAttempts * 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [getPosition, coords, locationLoadAttempts]);
  
  // Update user location when coordinates are available
  useEffect(() => {
    if (coords && !manualLocationOverride) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      
      try {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        console.log("Updated user location from geolocation:", newLocation);
      } catch (err) {
        console.error("Error saving location to localStorage:", err);
      }
    }
  }, [coords, manualLocationOverride]);
  
  // Fallback to saved location if needed
  useEffect(() => {
    if ((locationError || locationLoadAttempts >= 3) && !userLocation && !manualLocationOverride) {
      try {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          if (parsedLocation && typeof parsedLocation.latitude === 'number' && typeof parsedLocation.longitude === 'number') {
            setUserLocation(parsedLocation);
            console.log("Using saved location from localStorage as fallback:", parsedLocation);
          }
        }
      } catch (err) {
        console.error("Error loading saved location:", err);
      }
    }
  }, [locationError, userLocation, locationLoadAttempts, manualLocationOverride]);

  // Complete initial load after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewChangeTimeoutRef.current) {
        clearTimeout(viewChangeTimeoutRef.current);
      }
    };
  }, []);

  // Compute derived state
  const effectiveLocation = manualLocationOverride || userLocation;
  const currentSearchRadius = activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius;

  // Handler functions
  const handleRadiusChange = useCallback((value: number) => {
    setCalculatedSearchRadius(value);
  }, []);
  
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    // Skip if same view or change in progress
    if (view === activeView || isViewChangeInProgress.current) {
      return;
    }
    
    console.log(`View change requested: ${activeView} -> ${view}`);
    isViewChangeInProgress.current = true;
    
    // Clear any existing timeout
    if (viewChangeTimeoutRef.current) {
      clearTimeout(viewChangeTimeoutRef.current);
    }
    
    // Update state with delay to prevent race conditions
    viewChangeTimeoutRef.current = setTimeout(() => {
      try {
        clearLocationCache();
        setActiveView(view);
        console.log(`View changed to: ${view}`);
        
        // Reset the flag after a short delay
        setTimeout(() => {
          isViewChangeInProgress.current = false;
        }, 500);
      } catch (error) {
        console.error("Error during view change:", error);
        isViewChangeInProgress.current = false;
      }
    }, 50);
  }, [activeView]);
  
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    
    setManualLocationOverride(newLocation);
    setUserLocation(newLocation);
    
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      clearLocationCache();
      console.log("Updated user location from map click:", newLocation);
    } catch (err) {
      console.error("Error handling location update:", err);
    }
  }, []);

  const handleResetLocation = useCallback(() => {
    setManualLocationOverride(null);
    if (coords) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      try {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
      } catch (err) {
        console.error("Error saving reset location:", err);
      }
    } else {
      getPosition();
    }
  }, [coords, getPosition]);

  return {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    calculatedSearchRadius,
    currentSearchRadius,
    
    setActiveView,
    toggleMapView,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    
    DEFAULT_CALCULATED_RADIUS,
    DEFAULT_CERTIFIED_RADIUS
  };
}
