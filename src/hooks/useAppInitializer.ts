
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
    
    // Initialize caches in parallel
    Promise.all([
      // Initialize main cache
      new Promise<void>(resolve => {
        initializeCache();
        resolve();
      }),
      
      // Initialize SIQS cache
      new Promise<void>(resolve => {
        initSiqsCache();
        resolve();
      })
    ]).then(() => {
      console.log(`Caches initialized in ${(performance.now() - startTime).toFixed(2)}ms`);
      
      // Prefetch critical resources after small delay
      setTimeout(() => {
        prefetchCriticalResources();
      }, 1000);
    });
    
    console.log(`App initialization started in ${(performance.now() - startTime).toFixed(2)}ms`);
    
    // Clean up any resources if needed
    return () => {
      // Cleanup code if necessary
    };
  }, []);
}

export default useAppInitializer;
