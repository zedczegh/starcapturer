
import { useRef, useEffect } from 'react';
import { lazyLoadContainerRef, preloadImagesForRoute } from '@/utils/imageOptimizer';
import { useLocation } from 'react-router-dom';

/**
 * Hook to optimize image loading for a component
 * @returns A ref to attach to a container element for lazy loading
 */
export function useImageOptimizer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  
  // Pre-fetch images based on current route
  useEffect(() => {
    preloadImagesForRoute(location.pathname);
  }, [location.pathname]);
  
  // Set up lazy loading when container mounts
  useEffect(() => {
    lazyLoadContainerRef(containerRef.current);
  }, []);
  
  return containerRef;
}

export default useImageOptimizer;
