
import { useEffect, useRef } from 'react';
import { prefetchLocationData } from "@/lib/queryPrefetcher";
import { useQueryClient } from "@tanstack/react-query";

export const useDataPrefetcher = (locationData: any, isLoading: boolean) => {
  const queryClient = useQueryClient();
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (locationData && !isLoading && locationData.latitude && locationData.longitude && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      
      setTimeout(() => {
        prefetchLocationData(queryClient, locationData.latitude, locationData.longitude);
      }, 100);
    }
  }, [locationData, isLoading, queryClient]);
};
