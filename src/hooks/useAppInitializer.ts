
import { useEffect } from 'react';
import { preloadCriticalResources, optimizeImageLoading } from '@/utils/performanceOptimizer';
import { initializeCache } from '@/utils/optimizedCache';
import { initLocationCache } from '@/services/locationCacheService';

/**
 * Hook to initialize app performance optimizations
 */
const useAppInitializer = () => {
  useEffect(() => {
    // Initialize performance optimizations
    const initializePerformance = () => {
      console.log('Initializing performance optimizations...');
      
      // Preload critical resources
      preloadCriticalResources();
      
      // Initialize cache systems
      initializeCache();
      initLocationCache();
      
      // Set up image optimization
      setTimeout(() => {
        optimizeImageLoading();
      }, 100);
      
      // Clean up unused service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            if (registration.scope.includes('old-')) {
              registration.unregister();
            }
          });
        });
      }
    };
    
    // Use requestIdleCallback for non-critical initialization
    if (window.requestIdleCallback) {
      window.requestIdleCallback(initializePerformance);
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(initializePerformance, 100);
    }
  }, []);
};

export default useAppInitializer;
