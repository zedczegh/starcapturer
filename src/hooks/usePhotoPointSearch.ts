
import { useState, useEffect, useCallback } from "react";
import { SharedAstroSpot, getSharedAstroSpots } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";

interface UsePhotoPointSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  maxDistance: number;
  currentSiqs: number | null;
}

export const usePhotoPointSearch = ({
  userLocation,
  maxDistance,
  currentSiqs
}: UsePhotoPointSearchProps) => {
  const [loading, setLoading] = useState(true);
  const [photoPoints, setPhotoPoints] = useState<SharedAstroSpot[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<SharedAstroSpot[]>([]);
  const [displayLimit, setDisplayLimit] = useState(5);
  const [hasMoreLocations, setHasMoreLocations] = useState(false);
  
  // Fetch all photo points
  const fetchPhotoPoints = useCallback(async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const points = await getSharedAstroSpots(
        userLocation.latitude,
        userLocation.longitude,
        100 // Get more points to filter locally
      );
      setPhotoPoints(points);
    } catch (error) {
      console.error("Error fetching photo points:", error);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);
  
  // Filter and sort photo points based on SIQS and distance
  useEffect(() => {
    if (!userLocation || photoPoints.length === 0) {
      setFilteredPoints([]);
      setHasMoreLocations(false);
      return;
    }
    
    // Calculate distance for each point 
    const pointsWithDistance = photoPoints.map(point => ({
      ...point,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        point.latitude,
        point.longitude
      )
    }));
    
    // Filter by distance
    const withinRange = pointsWithDistance.filter(point => 
      (point.distance || 0) <= maxDistance
    );
    
    // If current SIQS is available, filter for locations with significantly higher SIQS
    const betterLocations = currentSiqs !== null
      ? withinRange.filter(point => (point.siqs || 0) > (currentSiqs + 1))
      : withinRange;
    
    // Sort by SIQS (highest first)
    const sorted = betterLocations.sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
    
    setFilteredPoints(sorted);
    setHasMoreLocations(sorted.length > displayLimit);
  }, [photoPoints, userLocation, maxDistance, currentSiqs, displayLimit]);
  
  // Load more locations
  const loadMoreLocations = useCallback(() => {
    setDisplayLimit(prev => prev + 5);
  }, []);
  
  // Check if user is already in a good location
  const isUserInGoodLocation = useCallback(() => {
    return currentSiqs !== null && currentSiqs >= 7.0;
  }, [currentSiqs]);
  
  // Get visible locations based on current display limit
  const visibleLocations = filteredPoints.slice(0, displayLimit);
  
  return {
    loading,
    photoPoints: visibleLocations,
    hasMoreLocations,
    isUserInGoodLocation,
    fetchPhotoPoints,
    loadMoreLocations
  };
};
