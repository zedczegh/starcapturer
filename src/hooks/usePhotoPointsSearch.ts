import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot, getSharedAstroSpots } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

export const usePhotoPointsSearch = ({
  userLocation,
  currentSiqs,
  maxInitialResults = 5
}: UsePhotoPointsSearchProps) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [searchDistance, setSearchDistance] = useState(1000); // Default 1000km
  const [allLocations, setAllLocations] = useState<SharedAstroSpot[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<SharedAstroSpot[]>([]);
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [hasMoreLocations, setHasMoreLocations] = useState(false);
  const [isUserInGoodLocation, setIsUserInGoodLocation] = useState(false);
  
  // SIQS threshold (20% better than current location is considered significant)
  const SIQS_IMPROVEMENT_THRESHOLD = 1.2;
  
  // Load all shared locations
  useEffect(() => {
    const fetchLocations = async () => {
      if (!userLocation) return;
      
      setLoading(true);
      try {
        const locations = await getSharedAstroSpots(
          userLocation.latitude,
          userLocation.longitude,
          100, // Get more locations to filter later
          5000 // Large radius to get many options
        );
        
        // Add distance calculation
        const locationsWithDistance = locations.map(location => ({
          ...location,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            location.latitude,
            location.longitude
          )
        }));
        
        setAllLocations(locationsWithDistance);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error(
          language === "en" ? "Error loading locations" : "加载位置时出错", 
          { description: language === "en" ? "Please try again later" : "请稍后再试" }
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, [userLocation, language]);
  
  // Filter locations based on distance and SIQS
  useEffect(() => {
    if (!userLocation || allLocations.length === 0) return;
    
    // Filter by distance
    const withinDistance = allLocations.filter(
      location => (location.distance || 0) <= searchDistance
    );
    
    // Check if user is in a good location (SIQS >= 7)
    const userHasGoodSiqs = currentSiqs !== null && currentSiqs >= 7;
    setIsUserInGoodLocation(userHasGoodSiqs);
    
    // If user has a good SIQS, only show locations that are significantly better
    let betterLocations = withinDistance;
    if (currentSiqs !== null) {
      betterLocations = withinDistance.filter(location => 
        location.siqs !== undefined && 
        location.siqs > currentSiqs * SIQS_IMPROVEMENT_THRESHOLD
      );
    }
    
    // Sort by SIQS first, then by distance if SIQS is similar
    const sortedLocations = betterLocations.sort((a, b) => {
      // If SIQS difference is significant, sort by SIQS
      if ((b.siqs || 0) - (a.siqs || 0) > 1) {
        return (b.siqs || 0) - (a.siqs || 0);
      } 
      // Otherwise, sort by distance
      return (a.distance || 0) - (b.distance || 0);
    });
    
    setFilteredLocations(sortedLocations);
    
    // Initialize displayed locations
    const initialLocations = sortedLocations.slice(0, maxInitialResults);
    setDisplayedLocations(initialLocations);
    
    // Check if there are more locations to load
    setHasMoreLocations(sortedLocations.length > initialLocations.length);
  }, [allLocations, searchDistance, currentSiqs, maxInitialResults, userLocation]);
  
  // Load more locations
  const loadMoreLocations = useCallback(() => {
    setDisplayedLocations(prev => {
      const newLocations = filteredLocations.slice(0, prev.length + maxInitialResults);
      setHasMoreLocations(filteredLocations.length > newLocations.length);
      return newLocations;
    });
  }, [filteredLocations, maxInitialResults]);
  
  return {
    loading,
    searchDistance,
    setSearchDistance,
    displayedLocations,
    hasMoreLocations,
    loadMoreLocations,
    isUserInGoodLocation
  };
};
