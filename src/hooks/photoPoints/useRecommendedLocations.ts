
import { useState, useEffect } from 'react';
import { getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';

export function useRecommendedLocations(
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius = 100
) {
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchRadius_, setSearchRadius_] = useState(searchRadius);
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState(true);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const maxLoadMoreClicks = 3;
  
  // Fetch locations when user location or search radius changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchLocations = async () => {
      if (!userLocation) {
        if (isMounted) {
          setLoading(false);
          setLocations([]);
        }
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Get current SIQS score from the store if available
        const currentSiqs = currentSiqsStore((state) => state.value);
        console.log("Current SIQS for location recommendations:", currentSiqs);
        
        // Fetch recommended spots from API
        const spots = await getRecommendedPhotoPoints(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius_,
          false, // certifiedOnly
          30 // limit - fetch a decent amount
        );
        
        if (!isMounted) return;
        
        if (spots && spots.length > 0) {
          // Apply real-time SIQS updates if possible
          const updatedSpots = await updateLocationsWithRealTimeSiqs(spots);
          
          if (!isMounted) return;
          
          setLocations(updatedSpots);
          setHasMore(updatedSpots.length >= 25); // If we got close to our limit, assume there may be more
        } else {
          setLocations([]);
          setHasMore(false);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching recommended locations:", err);
        setError("Failed to fetch recommended locations");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchLocations();
    
    return () => {
      isMounted = false;
    };
  }, [userLocation, searchRadius_]);
  
  // Load more locations
  const loadMore = async () => {
    if (!userLocation || loading || !hasMore) return;
    
    setSearching(true);
    
    try {
      // Fetch more locations with a larger radius
      const spots = await getRecommendedPhotoPoints(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius_ * 1.5, // Increase search radius
        false,
        30
      );
      
      if (spots && spots.length > 0) {
        // Apply real-time SIQS updates
        const updatedSpots = await updateLocationsWithRealTimeSiqs(spots);
        
        // Filter out duplicates
        const existingIds = new Set(locations.map(loc => 
          `${loc.latitude}-${loc.longitude}`
        ));
        
        const newSpots = updatedSpots.filter(spot => 
          !existingIds.has(`${spot.latitude}-${spot.longitude}`)
        );
        
        setLocations(prev => [...prev, ...newSpots]);
        setHasMore(newSpots.length >= 10); // If we got enough new spots, assume there may be more
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more locations:", err);
    } finally {
      setSearching(false);
    }
  };
  
  // Load more calculated locations specifically
  const loadMoreCalculatedLocations = async () => {
    if (!userLocation || loadMoreClickCount >= maxLoadMoreClicks) {
      setCanLoadMoreCalculated(false);
      return;
    }
    
    setSearching(true);
    
    try {
      // Fetch more calculated locations with current radius but requesting non-certified
      const spots = await getRecommendedPhotoPoints(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius_ + (loadMoreClickCount * 100), // Gradually increase radius
        false, // don't get certified only
        30
      );
      
      if (spots && spots.length > 0) {
        // Filter to only get calculated (non-certified) locations
        const calculatedSpots = spots.filter(spot => 
          !spot.isDarkSkyReserve && !spot.certification
        );
        
        // Apply real-time SIQS updates
        const updatedSpots = await updateLocationsWithRealTimeSiqs(calculatedSpots);
        
        // Filter out duplicates
        const existingIds = new Set(locations.map(loc => 
          `${loc.latitude}-${loc.longitude}`
        ));
        
        const newSpots = updatedSpots.filter(spot => 
          !existingIds.has(`${spot.latitude}-${spot.longitude}`)
        );
        
        setLocations(prev => [...prev, ...newSpots]);
        setLoadMoreClickCount(prev => prev + 1);
        setCanLoadMoreCalculated(loadMoreClickCount + 1 < maxLoadMoreClicks);
      } else {
        setCanLoadMoreCalculated(false);
      }
    } catch (err) {
      console.error("Error loading more calculated locations:", err);
    } finally {
      setSearching(false);
    }
  };
  
  // Refresh SIQS data for existing locations
  const refreshSiqsData = async () => {
    if (locations.length === 0) return;
    
    setSearching(true);
    
    try {
      const updatedSpots = await updateLocationsWithRealTimeSiqs(locations);
      setLocations(updatedSpots);
    } catch (err) {
      console.error("Error refreshing SIQS data:", err);
    } finally {
      setSearching(false);
    }
  };
  
  return {
    locations,
    loading,
    error,
    searching,
    hasMore,
    loadMore,
    searchRadius: searchRadius_,
    setSearchRadius: setSearchRadius_,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks
  };
}
