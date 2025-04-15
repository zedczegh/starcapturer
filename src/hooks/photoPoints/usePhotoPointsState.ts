
import { useState, useCallback, useEffect, useRef } from 'react';
import { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';

// Default radius constants
const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
const DEFAULT_CERTIFIED_RADIUS = 100000; // 100000km for certified locations (effectively global)

export function usePhotoPointsState() {
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
  
  // Use safer approach for state management with refs to track view change
  const [activeView, setActiveViewState] = useState<PhotoPointsViewMode>('certified');
  const activeViewRef = useRef<PhotoPointsViewMode>(activeView);
  
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [locationLoadAttempts, setLocationLoadAttempts] = useState(0);
  const [manualLocationOverride, setManualLocationOverride] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(DEFAULT_CALCULATED_RADIUS);
  
  // Prevent view change operations from stacking
  const viewChangeInProgressRef = useRef(false);
  const lastViewChangeTimestampRef = useRef(0);
  const viewChangeTimeoutRef = useRef<number | null>(null);
  
  // Safe setter for activeView that updates both state and ref
  const setActiveView = useCallback((view: PhotoPointsViewMode) => {
    setActiveViewState(view);
    activeViewRef.current = view;
  }, []);
  
  // Get user position
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
  
  // Update user location from coords
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
  
  // Fallback to saved location
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

  // Complete initial load after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Clean up view change timeout on unmount
  useEffect(() => {
    return () => {
      if (viewChangeTimeoutRef.current) {
        clearTimeout(viewChangeTimeoutRef.current);
        viewChangeTimeoutRef.current = null;
      }
    };
  }, []);

  // Effective location (manual override or user location)
  const effectiveLocation = manualLocationOverride || userLocation;

  // Handle radius change
  const handleRadiusChange = useCallback((value: number) => {
    setCalculatedSearchRadius(value);
  }, []);
  
  // Handle map/list view toggle
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  // Completely redesigned view change handler with better error handling
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    // Skip if trying to change to current view
    if (view === activeViewRef.current) {
      console.log(`Already in ${view} view, no change needed`);
      return;
    }
    
    // Skip if a view change is already in progress
    if (viewChangeInProgressRef.current) {
      console.log("View change already in progress, skipping");
      return;
    }
    
    console.log(`Starting view change from ${activeViewRef.current} to ${view}`);
    
    // Mark transition as in progress
    viewChangeInProgressRef.current = true;
    lastViewChangeTimestampRef.current = Date.now();
    
    // Clear any existing view change timeout
    if (viewChangeTimeoutRef.current !== null) {
      clearTimeout(viewChangeTimeoutRef.current);
      viewChangeTimeoutRef.current = null;
    }
    
    try {
      // Clear location cache to prevent stale data
      clearLocationCache();
      
      // Update the view with a safer approach
      // First update the ref to prevent race conditions
      activeViewRef.current = view;
      
      // Then schedule the state update with a short delay
      viewChangeTimeoutRef.current = window.setTimeout(() => {
        try {
          console.log(`Executing view change to ${view}`);
          setActiveViewState(view);
          
          // Reset in-progress flag after another delay
          setTimeout(() => {
            viewChangeInProgressRef.current = false;
            console.log(`View change to ${view} completed`);
          }, 500);
        } catch (err) {
          console.error("Error during view state update:", err);
          viewChangeInProgressRef.current = false;
        }
      }, 50);
    } catch (err) {
      console.error("Error during view change:", err);
      viewChangeInProgressRef.current = false;
      
      // Try to recover from errors
      activeViewRef.current = view;
      setTimeout(() => setActiveViewState(view), 100);
    }
  }, []);
  
  // Handle location update from map click
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    
    setManualLocationOverride(newLocation);
    setUserLocation(newLocation);
    
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      console.log("Updated user location from map click:", newLocation);
    } catch (err) {
      console.error("Error saving location to localStorage:", err);
    }
    
    try {
      clearLocationCache();
      console.log("Cleared location cache after location change");
    } catch (err) {
      console.error("Error clearing location cache:", err);
    }
  }, []);

  // Reset to user's actual location
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

  // Calculate current search radius based on view mode
  const currentSearchRadius = activeViewRef.current === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius;

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
