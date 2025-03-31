
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots'; 
import { 
  findLocationsWithinRadius,
  findCalculatedLocations 
} from '@/services/locationSearchService';
import { 
  calculateRealTimeSiqs, 
  batchCalculateSiqs
} from '@/services/realTimeSiqsService';
import { calculateDistance } from '@/data/utils/distanceCalculator';

interface UseRecommendedLocationsProps {
  userLocation: { latitude: number; longitude: number } | null;
  initialRadius?: number;
  maxResults?: number;
}

// Default values
const DEFAULT_RADIUS = 1000; // 1000 km
const MAX_RADIUS = 10000; // 10,000 km
const DEFAULT_MAX_RESULTS = 20;

/**
 * Hook to manage recommended locations for photo points
 * Optimized for performance with batched processing
 */
export function useRecommendedLocations(
  userLocation: { latitude: number; longitude: number } | null,
  initialRadius: number = DEFAULT_RADIUS,
  maxResults: number = DEFAULT_MAX_RESULTS
) {
  const { language, t } = useLanguage();
  const [searchRadius, setSearchRadius] = useState(initialRadius);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastSearchParamsRef = useRef('');
  const isInitialFetchRef = useRef(true);
  const fetchTimeoutRef = useRef<number | null>(null);
  
  // Helper to validate and set search radius
  const setValidSearchRadius = useCallback((radius: number) => {
    const validRadius = Math.min(Math.max(100, radius), MAX_RADIUS);
    setSearchRadius(validRadius);
  }, []);
  
  // Calculate and sort locations by distance and SIQS
  const sortLocations = useCallback((locs: SharedAstroSpot[]) => {
    if (!userLocation || !locs.length) return locs;
    
    return [...locs].sort((a, b) => {
      // First prioritize certification status
      const aIsCertified = a.isDarkSkyReserve || a.certification;
      const bIsCertified = b.isDarkSkyReserve || b.certification;
      
      if (aIsCertified && !bIsCertified) return -1;
      if (!aIsCertified && bIsCertified) return 1;
      
      // Calculate distance if not already available
      if (userLocation) {
        if (a.distance === undefined) {
          a.distance = calculateDistance(
            userLocation.latitude, 
            userLocation.longitude,
            a.latitude,
            a.longitude
          );
        }
        
        if (b.distance === undefined) {
          b.distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude
          );
        }
      }
      
      // Then sort by distance
      const distA = a.distance !== undefined ? a.distance : Infinity;
      const distB = b.distance !== undefined ? b.distance : Infinity;
      
      if (distA !== distB) {
        return distA - distB;
      }
      
      // Finally sort by SIQS (higher is better)
      return (b.siqs || 0) - (a.siqs || 0);
    });
  }, [userLocation]);
  
  // Fetch locations with debouncing for better performance
  const fetchLocations = useCallback(async () => {
    if (!userLocation) return;
    
    // Create a signature to detect duplicate searches
    const searchSignature = `${userLocation.latitude.toFixed(5)}-${userLocation.longitude.toFixed(5)}-${searchRadius}`;
    
    // Skip if we've already performed this exact search (except on initial load)
    if (searchSignature === lastSearchParamsRef.current && !isInitialFetchRef.current && locations.length > 0) {
      console.log('Skipping duplicate search');
      return;
    }
    
    // Clear any pending fetch timeout
    if (fetchTimeoutRef.current !== null) {
      window.clearTimeout(fetchTimeoutRef.current);
    }
    
    // Set a short delay before fetching to avoid multiple rapid fetches
    fetchTimeoutRef.current = window.setTimeout(async () => {
      setLoading(true);
      console.log(`Searching for locations within ${searchRadius}km radius`);
      
      try {
        // Get both certified and calculated locations in parallel for speed
        const [certifiedLocs, calculatedLocs] = await Promise.all([
          findLocationsWithinRadius(
            userLocation.latitude,
            userLocation.longitude,
            searchRadius,
            true
          ),
          findCalculatedLocations(
            userLocation.latitude,
            userLocation.longitude,
            searchRadius,
            false
          )
        ]);
        
        // Combine, remove duplicates, and ensure distances are calculated
        let allLocations = [...certifiedLocs];
        
        // Only add calculated locations that aren't duplicates of certified ones
        // Use a more efficient algorithm to detect duplicates
        const certifiedCoords = new Set(
          certifiedLocs.map(loc => `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`)
        );
        
        calculatedLocs.forEach(calcLoc => {
          const coordKey = `${calcLoc.latitude.toFixed(2)},${calcLoc.longitude.toFixed(2)}`;
          if (!certifiedCoords.has(coordKey)) {
            allLocations.push(calcLoc);
          }
        });
        
        // Ensure all locations have distances calculated
        allLocations = allLocations.map(loc => {
          if (loc.distance === undefined) {
            return {
              ...loc,
              distance: calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                loc.latitude,
                loc.longitude
              )
            };
          }
          return loc;
        });
        
        // Calculate real-time SIQS for all locations in batches for better performance
        if (allLocations.length > 0) {
          console.log(`Calculating SIQS for ${allLocations.length} locations`);
          allLocations = await batchCalculateSiqs(allLocations);
        }
        
        // Sort locations
        const sortedLocations = sortLocations(allLocations);
        
        setLocations(sortedLocations);
        setDisplayedLocations(sortedLocations.slice(0, maxResults));
        setHasMore(sortedLocations.length > maxResults);
        lastSearchParamsRef.current = searchSignature;
        isInitialFetchRef.current = false;
        
        if (sortedLocations.length === 0) {
          toast.info(
            language === 'en' 
              ? 'No locations found in this radius' 
              : '在此半径内未找到位置',
            { 
              description: language === 'en' 
                ? 'Try increasing your search radius' 
                : '尝试增加您的搜索半径'
            }
          );
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        toast.error(
          language === 'en' ? 'Failed to load locations' : '加载位置失败',
          { description: language === 'en' ? 'Please try again' : '请重试' }
        );
      } finally {
        setLoading(false);
        fetchTimeoutRef.current = null;
      }
    }, 300); // Small debounce delay
    
  }, [userLocation, searchRadius, language, sortLocations, maxResults, locations.length]);
  
  // Initial fetch when userLocation changes
  useEffect(() => {
    if (userLocation) {
      isInitialFetchRef.current = true;
      fetchLocations();
    }
    
    // Cleanup timeouts on unmount
    return () => {
      if (fetchTimeoutRef.current !== null) {
        window.clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [userLocation, fetchLocations]);
  
  // Fetch when radius changes
  useEffect(() => {
    if (userLocation) {
      fetchLocations();
    }
  }, [searchRadius, fetchLocations, userLocation]);
  
  // Load more locations
  const loadMore = useCallback(() => {
    const currentCount = displayedLocations.length;
    const nextBatch = locations.slice(0, currentCount + maxResults);
    setDisplayedLocations(nextBatch);
    setHasMore(nextBatch.length < locations.length);
  }, [displayedLocations.length, locations, maxResults]);
  
  // Refresh SIQS data for all locations
  const refreshSiqsData = useCallback(async () => {
    if (refreshing || !userLocation) return;
    
    setRefreshing(true);
    console.log('Refreshing SIQS data for all locations');
    
    try {
      // Update SIQS for all locations using batch calculation for better performance
      const refreshedLocations = await batchCalculateSiqs(locations);
      
      // Sort and update state
      const sortedLocations = sortLocations(refreshedLocations);
      setLocations(sortedLocations);
      setDisplayedLocations(sortedLocations.slice(0, maxResults));
      
      toast.success(
        language === 'en' ? 'SIQS data refreshed' : 'SIQS数据已刷新', 
        { 
          description: language === 'en' 
            ? 'All locations now show current conditions' 
            : '所有位置现在显示最新状况'
        }
      );
    } catch (error) {
      console.error('Error refreshing SIQS data:', error);
      toast.error(
        language === 'en' ? 'Failed to refresh SIQS data' : '刷新SIQS数据失败',
        { description: language === 'en' ? 'Please try again' : '请重试' }
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, userLocation, locations, language, sortLocations, maxResults]);
  
  return {
    searchRadius,
    setSearchRadius: setValidSearchRadius,
    maxRadius: MAX_RADIUS,
    locations,
    displayedLocations,
    loading: loading || refreshing,
    hasMore,
    loadMore,
    refreshSiqsData,
    totalLocationsCount: locations.length
  };
}
