
import { useEffect } from 'react';
import { prefetchCriticalResources } from '@/utils/resourcePrefetcher';
import { initializeCache } from '@/utils/optimizedCache';
import { initSiqsCache } from '@/services/realTimeSiqs/siqsCache';

/**
 * Hook to initialize application performance optimizations
 */
export function useAppInitializer() {
  useEffect(() => {
    // Initialize performance optimizations
    const startTime = performance.now();
    
    // Initialize caches
    initializeCache();
    initSiqsCache();
    
    // Prefetch critical resources after small delay
    setTimeout(() => {
      prefetchCriticalResources();
    }, 1000);
    
    console.log(`App initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`);
    
    // Clean up any resources if needed
    return () => {
      // Cleanup code if necessary
    };
  }, []);
}

export default useAppInitializer;
