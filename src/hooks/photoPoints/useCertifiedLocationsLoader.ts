
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { preloadCertifiedLocations, getAllCertifiedLocations } from '@/services/certifiedLocationsService';

/**
 * Hook for efficiently loading certified locations with preloading capabilities
 */
export function useCertifiedLocationsLoader() {
  const [certifiedLocations, setCertifiedLocations] = useState<SharedAstroSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Load certified locations on mount with immediate cache check
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setIsError(false);
    
    const loadLocations = async () => {
      try {
        // Start with a 10% progress indicator
        setLoadingProgress(10);
        
        // Preload certified locations
        const locations = await preloadCertifiedLocations();
        
        if (!mounted) return;
        
        // Update progress
        setLoadingProgress(75);
        
        // Get all certified locations
        const allLocations = await getAllCertifiedLocations();
        
        if (!mounted) return;
        
        // Complete loading
        setCertifiedLocations(allLocations);
        setLoadingProgress(100);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading certified locations:', error);
        if (mounted) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    };
    
    loadLocations();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  return {
    certifiedLocations,
    isLoading,
    isError,
    loadingProgress
  };
}

export default useCertifiedLocationsLoader;
