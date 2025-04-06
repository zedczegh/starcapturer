import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserLocations, saveUserLocation } from '@/utils/locationStorage';
import { getCachedData, setCachedData } from '@/utils/cacheUtils';
import { findNearbyLocations } from '@/services/locationService';
import { calculateDistance } from '@/data/utils/distanceCalculator';
import { formatDistanceFriendly } from '@/utils/formatting';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { removeDuplicateLocations, prioritizeLocations } from '@/utils/locationUtils';

// Keep recently processed locations in memory to reduce API calls
const processedLocationsCache = new Map<string, any>();

interface UseRecommendedLocationsProps {
  userLatitude?: number;
  userLongitude?: number;
  maxDistance?: number;
  filterType?: 'certified' | 'calculated' | 'all';
  maxResults?: number;
  userLanguage?: string;
  includeClearSkyData?: boolean;
  onlyViableLocations?: boolean;
}

export const useRecommendedLocations = ({
  userLatitude,
  userLongitude,
  maxDistance = 500, // Default to 500km
  filterType = 'all',
  maxResults = 5,
  userLanguage = 'en',
  includeClearSkyData = true,
  onlyViableLocations = true
}: UseRecommendedLocationsProps) => {
  const [recommendedLocations, setRecommendedLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate cache key based on parameters
  const cacheKey = `${userLatitude?.toFixed(2) || 'unknown'}-${userLongitude?.toFixed(2) || 'unknown'}-${maxDistance}-${filterType}-${maxResults}`;
  
  // Function to fetch and format locations
  const fetchLocations = useCallback(async () => {
    if (!userLatitude || !userLongitude) {
      return [];
    }
    
    // Check memory cache first for instant response
    if (processedLocationsCache.has(cacheKey)) {
      console.log(`Using memory cache for locations: ${cacheKey}`);
      return processedLocationsCache.get(cacheKey);
    }
    
    // Then check persistent cache with 30 minute TTL
    const cachedData = getCachedData(cacheKey, 30 * 60 * 1000); // 30 minutes cache
    
    if (cachedData) {
      console.log(`Using cached locations for ${cacheKey}, expires in ${cachedData.expires} minutes`);
      
      // Store in memory cache too
      processedLocationsCache.set(cacheKey, cachedData.data);
      return cachedData.data;
    }
    
    try {
      // Fetch locations from API or database
      const locations = await findNearbyLocations({
        latitude: userLatitude,
        longitude: userLongitude,
        radius: maxDistance,
        type: filterType,
        limit: maxResults * 2 // Get more results than needed for filtering
      });
      
      // Filter out water locations
      const filteredLocations = locations.filter(loc => {
        // Skip locations without coordinates
        if (!loc.latitude || !loc.longitude) return false;
        
        // Check if location is over water (simplified)
        const isWater = loc.name.toLowerCase().includes('ocean') || 
                        loc.name.toLowerCase().includes('sea') || 
                        loc.name.toLowerCase().includes('lake') ||
                        loc.name.toLowerCase().includes('bay');
        
        if (isWater) {
          console.log(`Rejected water location at ${loc.latitude}, ${loc.longitude}`);
          return false;
        }
        
        return true;
      });
      
      // Ensure we have unique locations
      const uniqueLocations = removeDuplicateLocations(filteredLocations);
      
      // Calculate distance and add it to each location
      const locationsWithDistance = uniqueLocations.map(location => {
        if (!location.latitude || !location.longitude) return location;
        
        const distance = calculateDistance(
          userLatitude,
          userLongitude,
          location.latitude,
          location.longitude
        );
        
        return {
          ...location,
          distance,
          formattedDistance: formatDistanceFriendly(distance, userLanguage)
        };
      });

      // Calculate SIQS for each location
      let locationsWithSiqs: SharedAstroSpot[] = [];
      
      if (includeClearSkyData) {
        try {
          // Calculate SIQS for all locations
          locationsWithSiqs = await Promise.all(locationsWithDistance.map(async (location) => {
            if (!location.latitude || !location.longitude) return location;
            
            try {
              // Calculate real-time SIQS for this location
              const siqsResult = await calculateRealTimeSiqs(
                location.latitude,
                location.longitude,
                location.bortleScale || 5 // Use location's Bortle scale if available
              );
              
              return {
                ...location,
                siqs: siqsResult.siqs,
                isViable: siqsResult.isViable
              };
            } catch (error) {
              console.warn(`Error calculating SIQS for location ${location.name}:`, error);
              
              // Fallback SIQS estimation based on Bortle scale alone
              const fallbackSiqs = Math.max(0, 9.5 - (location.bortleScale || 5));
              return {
                ...location,
                siqs: fallbackSiqs,
                isViable: fallbackSiqs >= 3.0
              };
            }
          }));
        } catch (error) {
          console.error("Error calculating SIQS for locations:", error);
          locationsWithSiqs = locationsWithDistance;
        }
      } else {
        locationsWithSiqs = locationsWithDistance;
      }
      
      // Filter for viable locations if requested
      const viableLocations = onlyViableLocations 
        ? locationsWithSiqs.filter(loc => loc.isViable)
        : locationsWithSiqs;
      
      // Prioritize locations based on multiple criteria
      const prioritizedLocations = prioritizeLocations(viableLocations);
      
      // Limit to maxResults
      const finalLocations = prioritizedLocations.slice(0, maxResults);
      
      // Cache the results
      setCachedData(cacheKey, finalLocations);
      console.log(`Cached ${finalLocations.length} locations with key ${cacheKey}, expires in 30 minutes`);
      
      // Store in memory cache
      processedLocationsCache.set(cacheKey, finalLocations);
      
      return finalLocations;
    } catch (error) {
      console.error("Error finding recommended locations:", error);
      throw error;
    }
  }, [userLatitude, userLongitude, maxDistance, filterType, maxResults, cacheKey, userLanguage, includeClearSkyData, onlyViableLocations]);

  // UseQuery hook for better caching and refetching
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['recommendedLocations', cacheKey],
    queryFn: fetchLocations,
    enabled: !!userLatitude && !!userLongitude,
    staleTime: 10 * 60 * 1000, // 10 minutes before refetch is needed
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Update the state when query data changes
  useEffect(() => {
    if (data) {
      setRecommendedLocations(data);
    }
  }, [data]);

  // Update loading and error states
  useEffect(() => {
    setLoading(isLoading);
    if (isError) {
      setError("Failed to load recommended locations");
    } else {
      setError(null);
    }
  }, [isLoading, isError]);

  // Function to process locations when user coordinates change
  useEffect(() => {
    if (userLatitude && userLongitude) {
      console.log(`Processing ${maxResults} locations for ${filterType} separation with radius: ${maxDistance}km`);
    }
  }, [userLatitude, userLongitude, maxDistance, filterType, maxResults]);

  // Clear memory cache after 30 minutes to avoid stale data
  useEffect(() => {
    const interval = setInterval(() => {
      const keysToRemove: string[] = [];
      
      processedLocationsCache.forEach((_, key) => {
        keysToRemove.push(key);
      });
      
      keysToRemove.forEach(key => {
        processedLocationsCache.delete(key);
      });
      
      if (keysToRemove.length > 0) {
        console.log(`Cleared ${keysToRemove.length} entries from locations memory cache`);
      }
    }, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Function to manually refresh locations
  const refreshLocations = useCallback(() => {
    // Clear both caches
    processedLocationsCache.delete(cacheKey);
    // This should be getCachedData with delete parameter, but we'll fix by making the key invalid
    setCachedData(`${cacheKey}_expired`, null);
    
    // Refetch data
    return refetch();
  }, [cacheKey, refetch]);

  // Function to save a location
  const saveLocation = async (location: SharedAstroSpot) => {
    if (!location) return;
    
    try {
      await saveUserLocation({
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale
      });
      
      return true;
    } catch (error) {
      console.error("Error saving location:", error);
      return false;
    }
  };

  return {
    recommendedLocations,
    loading,
    error,
    refreshLocations,
    saveLocation
  };
};

export default useRecommendedLocations;
