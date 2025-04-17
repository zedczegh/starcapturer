
import { useState, useEffect } from 'react';
import { fetchRecommendedAstroSpots } from '@/lib/api/astroSpots';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';

export function useRecommendedLocations(params: {
  userLocation: { latitude: number; longitude: number } | null;
  maxResults?: number;
  minSiqsScore?: number;
  calculateDistance?: boolean;
  radius?: number;
  onlyCertified?: boolean;
}) {
  const {
    userLocation,
    maxResults = 5,
    minSiqsScore = 0,
    calculateDistance = true,
    radius = 500,
    onlyCertified = false
  } = params;
  
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchLocations = async () => {
      setLoading(true);
      try {
        // Get current SIQS score from the store if available
        const currentSiqs = currentSiqsStore((state) => state.value);
        console.log("Current SIQS for location recommendations:", currentSiqs);
        
        // Fetch recommended spots from API
        const spots = await fetchRecommendedAstroSpots({
          userLocation,
          maxResults: maxResults + 5, // Fetch more to account for filtering
          calculateDistance,
          radius,
          onlyCertified
        });
        
        if (!isMounted) return;
        
        if (spots && spots.length > 0) {
          // Apply real-time SIQS updates if possible
          const updatedSpots = await updateLocationsWithRealTimeSiqs(spots);
          
          if (!isMounted) return;
          
          // Filter by minimum SIQS score if specified
          let filteredSpots = updatedSpots;
          if (minSiqsScore > 0) {
            filteredSpots = updatedSpots.filter(spot => {
              if (spot.siqs === undefined) return false;
              
              const siqsValue = typeof spot.siqs === 'object' ? spot.siqs.score : spot.siqs;
              return typeof siqsValue === 'number' && siqsValue >= minSiqsScore;
            });
          }
          
          setLocations(filteredSpots.slice(0, maxResults));
        } else {
          setLocations([]);
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
    
    // Only fetch if we have user location or this is a request for certified spots
    if (userLocation || onlyCertified) {
      fetchLocations();
    } else {
      setLocations([]);
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [userLocation, maxResults, minSiqsScore, calculateDistance, radius, onlyCertified]);
  
  return { locations, loading, error };
}
