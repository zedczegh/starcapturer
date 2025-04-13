
import { useState, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

export const useLocationLoadingState = (initialRadius: number) => {
  const [searchRadius, setSearchRadius] = useState<number>(initialRadius);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState<boolean>(false);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState<number>(0);
  
  // Refs for tracking previous state
  const prevRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<{latitude: number; longitude: number} | null>(null);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);

  return {
    // State
    searchRadius,
    setSearchRadius,
    locations,
    setLocations,
    loading,
    setLoading,
    searching,
    setSearching,
    hasMore,
    setHasMore,
    page,
    setPage,
    canLoadMoreCalculated,
    setCanLoadMoreCalculated,
    loadMoreClickCount,
    setLoadMoreClickCount,
    
    // Refs
    prevRadiusRef,
    prevLocationRef,
    previousLocationsRef
  };
};
