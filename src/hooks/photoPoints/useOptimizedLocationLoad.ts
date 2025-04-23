
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface OptimizedLocationLoadOptions {
  initialBatchSize?: number;
  subsequentBatchSize?: number;
  loadDelay?: number;
  maxLoadCount?: number;
}

export const useOptimizedLocationLoad = (
  locations: SharedAstroSpot[],
  options: OptimizedLocationLoadOptions = {}
) => {
  const {
    initialBatchSize = 10,
    subsequentBatchSize = 5,
    loadDelay = 150,
    maxLoadCount = Infinity
  } = options;
  
  const [visibleLocations, setVisibleLocations] = useState<SharedAstroSpot[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  
  // Initialize with the first batch
  useEffect(() => {
    if (locations.length === 0) {
      setVisibleLocations([]);
      setAllLoaded(true);
      return;
    }
    
    const initialBatch = locations.slice(0, Math.min(initialBatchSize, locations.length));
    setVisibleLocations(initialBatch);
    setAllLoaded(initialBatch.length >= locations.length);
    setLoadCount(1);
  }, [locations, initialBatchSize]);
  
  // Load more function with optimized batching
  const loadMore = useCallback(() => {
    if (loadingMore || allLoaded || loadCount >= maxLoadCount) return;
    
    setLoadingMore(true);
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      const currentLength = visibleLocations.length;
      const nextBatch = locations.slice(
        currentLength,
        currentLength + subsequentBatchSize
      );
      
      if (nextBatch.length > 0) {
        setVisibleLocations(prev => [...prev, ...nextBatch]);
        setLoadCount(prev => prev + 1);
        setAllLoaded(currentLength + nextBatch.length >= locations.length);
      } else {
        setAllLoaded(true);
      }
      
      setLoadingMore(false);
    }, loadDelay);
  }, [
    locations,
    visibleLocations,
    loadingMore,
    allLoaded,
    subsequentBatchSize,
    loadDelay,
    loadCount,
    maxLoadCount
  ]);
  
  // Auto-load more when scrolling
  useEffect(() => {
    const handleScroll = () => {
      // Only check if we're not at the bottom and not currently loading
      if (allLoaded || loadingMore) return;
      
      // Check if we're near the bottom of the page
      const scrollPosition = window.innerHeight + window.scrollY;
      const totalHeight = document.body.offsetHeight;
      
      // Load more when user is 500px from bottom
      if (scrollPosition > totalHeight - 500) {
        loadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, allLoaded, loadingMore]);
  
  return {
    visibleLocations,
    loadingMore,
    allLoaded,
    loadMore,
    loadCount
  };
};
