
import { useEffect, useRef, useState } from 'react';
import { prefetchLocationData } from "@/lib/queryPrefetcher";
import { useQueryClient } from "@tanstack/react-query";

export const useDataPrefetcher = (locationData: any, isLoading: boolean) => {
  const queryClient = useQueryClient();
  const dataFetchedRef = useRef(false);
  const [prefetchCount, setPrefetchCount] = useState(0);

  useEffect(() => {
    if (locationData && !isLoading && locationData.latitude && locationData.longitude && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      
      // Use a more efficient timeout to avoid blocking the main thread
      const timeoutId = setTimeout(() => {
        // Use Promise.resolve to push to next microtask queue for better performance
        Promise.resolve().then(() => {
          prefetchLocationData(queryClient, locationData.latitude, locationData.longitude)
            .then(() => setPrefetchCount(prev => prev + 1))
            .catch(err => console.error("Prefetch error:", err));
        });
      }, 50); // Reduced from 100ms to 50ms for faster loading
      
      return () => clearTimeout(timeoutId);
    }
  }, [locationData, isLoading, queryClient]);

  // Return prefetch status for potential progress indicators
  return { prefetchComplete: prefetchCount > 0 };
};
