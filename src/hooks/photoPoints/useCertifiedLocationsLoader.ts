
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { preloadCertifiedLocations, getAllCertifiedLocations } from '@/services/certifiedLocationsService';

/**
 * Hook for efficiently loading certified locations with preloading capabilities
 * @param shouldLoad Control whether to load certified locations or not
 */
export function useCertifiedLocationsLoader(shouldLoad: boolean = true) {
  const [certifiedLocations, setCertifiedLocations] = useState<SharedAstroSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Load certified locations on mount with immediate cache check
  useEffect(() => {
    if (!shouldLoad) {
      setIsLoading(false);
      return;
    }
    
    let mounted = true;
    setIsLoading(true);
    setIsError(false);
    
    // Try to use cached locations first for immediate display
    try {
      const cachedLocations = JSON.parse(localStorage.getItem('cachedCertifiedLocations') || '[]');
      if (cachedLocations.length > 0 && mounted) {
        console.log(`Using ${cachedLocations.length} cached certified locations for immediate display`);
        setCertifiedLocations(cachedLocations);
        setLoadingProgress(50); // Show 50% progress since we're still refreshing from API
      }
    } catch (e) {
      console.error("Error parsing cached locations:", e);
    }
    
    const loadLocations = async () => {
      try {
        // Start with a 10% progress indicator if we didn't load from cache
        if (loadingProgress === 0) {
          setLoadingProgress(10);
        }
        
        // Preload certified locations
        const locations = await preloadCertifiedLocations();
        
        // If component is still mounted, update state
        if (mounted) {
          setCertifiedLocations(locations);
          setLoadingProgress(100);
          setIsLoading(false);
          
          // Cache locations for future use (with no filtering)
          try {
            localStorage.setItem('cachedCertifiedLocations', JSON.stringify(locations));
          } catch (e) {
            console.error("Error caching certified locations:", e);
          }
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
        return Math.min(90, prev + 10);
      });
    }, 300);
    
    loadLocations();
    
    return () => {
      mounted = false;
      clearInterval(progressInterval);
    };
  }, [shouldLoad]);
  
  // Refresh certified locations
  const refreshLocations = useCallback(async () => {
    if (!shouldLoad) return;
    
    setIsLoading(true);
    setLoadingProgress(10);
    
    try {
      const freshLocations = await getAllCertifiedLocations();
      setCertifiedLocations(freshLocations);
      setLoadingProgress(100);
      setIsLoading(false);
      
      // Update cache with fresh locations
      try {
        localStorage.setItem('cachedCertifiedLocations', JSON.stringify(freshLocations));
      } catch (e) {
        console.error("Error caching certified locations:", e);
      }
    } catch (error) {
      console.error("Error refreshing certified locations:", error);
      setIsError(true);
      setIsLoading(false);
    }
  }, [shouldLoad]);
  
  return {
    certifiedLocations,
    isLoading,
    isError,
    loadingProgress,
    refreshLocations
  };
}
