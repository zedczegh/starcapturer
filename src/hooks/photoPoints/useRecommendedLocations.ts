
import { useState, useEffect, useCallback } from 'react';
import { useLocationDataCache } from '@/hooks/useLocationData';
import { fetchLocationsByProximity } from '@/lib/api/astroSpots';
import { DARK_SKY_LOCATIONS } from '@/data/darkSkyLocations';
import { useSiqsStore } from '@/stores/siqsStore';
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';

const MAX_LOAD_MORE_CLICKS = 3; // Limit to prevent excessive API calls

export const useRecommendedLocations = (userLocation: { latitude: number; longitude: number } | null) => {
  const [searchRadius, setSearchRadius] = useState(500); // Default 500km
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const [locations, setLocations] = useState<any[]>([]);
  const [calculatedStarted, setCalculatedStarted] = useState(false);
  const [calculatedLocations, setCalculatedLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastSearched, setLastSearched] = useState<string | null>(null);
  const { getCachedData, setCachedData } = useLocationDataCache();
  
  // Get current SIQS score from store
  const currentSiqs = useSiqsStore.getState().score;

  // Reset state when user location changes
  useEffect(() => {
    if (userLocation) {
      const locationKey = `${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}`;
      
      if (lastSearched !== locationKey) {
        setLocations([]);
        setCalculatedLocations([]);
        setHasMore(false);
        setLoadMoreClickCount(0);
        setCalculatedStarted(false);
        setLastSearched(locationKey);
      }
    }
  }, [userLocation, lastSearched]);

  // Fetch locations when search parameters change
  useEffect(() => {
    const fetchLocations = async () => {
      if (!userLocation) return;
      
      setLoading(true);
      try {
        // First, get dark sky locations within radius
        const darkSkyInRadius = DARK_SKY_LOCATIONS.filter(location => {
          if (!location.latitude || !location.longitude) return false;
          
          // Calculate distance (rough approximation)
          const latDiff = location.latitude - userLocation.latitude;
          const lngDiff = location.longitude - userLocation.longitude;
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // km
          
          return distance <= searchRadius;
        });
        
        // Then fetch calculated locations from API
        const apiLocations = await fetchLocationsByProximity(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius
        );
        
        // Combine and deduplicate
        const combined = [...darkSkyInRadius];
        
        // Add API locations that aren't already in dark sky locations
        apiLocations.forEach(apiLoc => {
          const exists = darkSkyInRadius.some(
            dsl => dsl.latitude === apiLoc.latitude && dsl.longitude === apiLoc.longitude
          );
          
          if (!exists) {
            combined.push(apiLoc);
          }
        });
        
        // Calculate SIQS for all locations in parallel (max 5 at a time)
        const locationsWithSiqs = await batchCalculateSiqs(combined, 5);
        
        setLocations(locationsWithSiqs);
        setHasMore(apiLocations.length >= 10); // If we got 10+ results, assume there might be more
        
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, [userLocation, searchRadius, getCachedData, setCachedData]);

  // Function to load more locations
  const loadMore = useCallback(async () => {
    if (!userLocation || loading || !hasMore) return;
    
    setSearching(true);
    try {
      // Increment load more clicks counter
      setLoadMoreClickCount(prev => prev + 1);
      
      // Expand search radius for each click
      const newRadius = searchRadius + 200;
      setSearchRadius(newRadius);
      
    } catch (error) {
      console.error("Error loading more locations:", error);
    } finally {
      setSearching(false);
    }
  }, [userLocation, searchRadius, loading, hasMore]);

  // Function to refresh SIQS data
  const refreshSiqsData = useCallback(async () => {
    if (locations.length === 0) return;
    
    setSearching(true);
    try {
      const refreshedLocations = await batchCalculateSiqs(locations, 5);
      setLocations(refreshedLocations);
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
    } finally {
      setSearching(false);
    }
  }, [locations]);

  // Function to load more calculated locations
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation || loading || calculatedStarted) return;
    
    setCalculatedStarted(true);
    setSearching(true);
    
    try {
      // TODO: Implement algorithm to calculate more locations
      // For now, just a simulated delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // setCalculatedLocations(generatedLocations);
    } catch (error) {
      console.error("Error generating calculated locations:", error);
    } finally {
      setSearching(false);
    }
    
    return true;
  }, [userLocation, loading, calculatedStarted]);

  // Check if we can load more calculated locations
  const canLoadMoreCalculated = loadMoreClickCount < MAX_LOAD_MORE_CLICKS;

  return {
    searchRadius,
    setSearchRadius,
    locations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    calculatedLocations,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks: MAX_LOAD_MORE_CLICKS,
    currentSiqs
  };
};
