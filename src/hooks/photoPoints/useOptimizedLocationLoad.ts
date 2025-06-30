
import { useState, useEffect, useCallback, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useIsMobile } from '@/hooks/use-mobile';

interface OptimizedLocationLoadOptions {
  initialBatchSize?: number;
  mobileInitialBatchSize?: number;
  subsequentBatchSize?: number;
  mobileSubsequentBatchSize?: number;
  loadDelay?: number;
  maxLoadCount?: number;
}

/**
 * Optimized location loading with mobile-specific batching
 */
export const useOptimizedLocationLoad = (
  locations: SharedAstroSpot[],
  options: OptimizedLocationLoadOptions = {}
) => {
  const isMobile = useIsMobile();
  
  const {
    initialBatchSize = 15,
    mobileInitialBatchSize = 8,
    subsequentBatchSize = 10,
    mobileSubsequentBatchSize = 5,
    loadDelay = 100,
    maxLoadCount = Infinity
  } = options;
  
  // Use mobile-optimized batch sizes
  const effectiveInitialBatch = isMobile ? mobileInitialBatchSize : initialBatchSize;
  const effectiveSubsequentBatch = isMobile ? mobileSubsequentBatchSize : subsequentBatchSize;
  
  const [visibleLocations, setVisibleLocations] = useState<SharedAstroSpot[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  
  // Memoize sorted locations to prevent unnecessary re-renders
  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      // Prioritize certified locations
      if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) return -1;
      if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) return 1;
      
      // Then sort by SIQS score
      const siqsA = typeof a.siqs === 'number' ? a.siqs : 0;
      const siqsB = typeof b.siqs === 'number' ? b.siqs : 0;
      return siqsB - siqsA;
    });
  }, [locations]);
  
  // Initialize with the first batch
  useEffect(() => {
    if (sortedLocations.length === 0) {
      setVisibleLocations([]);
      setAllLoaded(true);
      setLoadCount(0);
      return;
    }
    
    const initialBatch = sortedLocations.slice(0, Math.min(effectiveInitialBatch, sortedLocations.length));
    setVisibleLocations(initialBatch);
    setAllLoaded(initialBatch.length >= sortedLocations.length);
    setLoadCount(1);
  }, [sortedLocations, effectiveInitialBatch]);
  
  // Optimized load more function
  const loadMore = useCallback(() => {
    if (loadingMore || allLoaded || loadCount >= maxLoadCount) return;
    
    setLoadingMore(true);
    
    // Use requestAnimationFrame for smoother loading
    requestAnimationFrame(() => {
      setTimeout(() => {
        setVisibleLocations(prev => {
          const currentLength = prev.length;
          const nextBatch = sortedLocations.slice(
            currentLength,
            currentLength + effectiveSubsequentBatch
          );
          
          if (nextBatch.length > 0) {
            setLoadCount(count => count + 1);
            setAllLoaded(currentLength + nextBatch.length >= sortedLocations.length);
            return [...prev, ...nextBatch];
          } else {
            setAllLoaded(true);
            return prev;
          }
        });
        
        setLoadingMore(false);
      }, loadDelay);
    });
  }, [
    sortedLocations,
    loadingMore,
    allLoaded,
    effectiveSubsequentBatch,
    loadDelay,
    loadCount,
    maxLoadCount
  ]);
  
  // Enhanced scroll detection for mobile
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      // Clear timeout to debounce scroll events
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        if (allLoaded || loadingMore) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const totalHeight = document.body.offsetHeight;
        
        // Different thresholds for mobile vs desktop
        const threshold = isMobile ? 300 : 500;
        
        if (scrollPosition > totalHeight - threshold) {
          loadMore();
        }
      }, isMobile ? 100 : 50); // More aggressive debouncing on mobile
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [loadMore, allLoaded, loadingMore, isMobile]);
  
  return {
    visibleLocations,
    loadingMore,
    allLoaded,
    loadMore,
    loadCount,
    totalLocations: sortedLocations.length
  };
};
