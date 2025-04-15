
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { preloadCertifiedLocations, getAllCertifiedLocations } from '@/services/certifiedLocationsService';

/**
 * Hook for efficiently loading certified locations with preloading capabilities
 * Implements strong caching to prevent reloading when switching views
 */
export function useCertifiedLocationsLoader() {
  const [certifiedLocations, setCertifiedLocations] = useState<SharedAstroSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Load certified locations on mount with immediate cache check
  useEffect(() => {
    // If we've already loaded locations in this session, don't reload
    if (hasLoaded && certifiedLocations.length > 0) {
      console.log("Using already loaded certified locations from memory:", certifiedLocations.length);
      return;
    }
    
    let mounted = true;
    setIsLoading(true);
    setIsError(false);
    
    const loadLocations = async () => {
      try {
        // Start with a 10% progress indicator
        setLoadingProgress(10);
        
        // Preload certified locations - this checks localStorage cache first
        const locations = await preloadCertifiedLocations();
        
        // If component is still mounted, update state
        if (mounted) {
          setCertifiedLocations(locations);
          setLoadingProgress(100);
          setIsLoading(false);
          setHasLoaded(true);
        }
      } catch (error) {
        console.error("Error loading certified locations:", error);
        
        if (mounted) {
          setIsError(true);
          setIsLoading(false);
          
          // Try to use cached locations as fallback
          try {
            const cachedLocations = JSON.parse(localStorage.getItem('cachedCertifiedLocations') || '[]');
            if (cachedLocations.length > 0) {
              setCertifiedLocations(cachedLocations);
              setHasLoaded(true);
            }
          } catch (e) {
            console.error("Error parsing cached locations:", e);
          }
        }
      }
    };
    
    // Simulate progress updates for better user experience
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);
    
    loadLocations();
    
    return () => {
      mounted = false;
      clearInterval(progressInterval);
    };
  }, [certifiedLocations.length, hasLoaded]);
  
  // Refresh certified locations
  const refreshLocations = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress(10);
    
    try {
      const freshLocations = await getAllCertifiedLocations();
      setCertifiedLocations(freshLocations);
      setLoadingProgress(100);
      setIsLoading(false);
    } catch (error) {
      console.error("Error refreshing certified locations:", error);
      setIsError(true);
      setIsLoading(false);
    }
  }, []);
  
  return {
    certifiedLocations,
    isLoading,
    isError,
    loadingProgress,
    refreshLocations
  };
}
