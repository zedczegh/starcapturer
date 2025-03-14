
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot, getSharedAstroSpots } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { fetchWeatherData } from "@/lib/api";
import { fetchLightPollutionData } from "@/lib/api/pollution";

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

// Default seeing conditions (when real data isn't available)
const DEFAULT_SEEING_CONDITIONS = 3;

export const usePhotoPointsSearch = ({
  userLocation,
  currentSiqs,
  maxInitialResults = 5
}: UsePhotoPointsSearchProps) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchDistance, setSearchDistance] = useState(1000); // Default 1000km
  const [allLocations, setAllLocations] = useState<SharedAstroSpot[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<SharedAstroSpot[]>([]);
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [hasMoreLocations, setHasMoreLocations] = useState(false);
  const [isUserInGoodLocation, setIsUserInGoodLocation] = useState(false);
  
  // SIQS threshold (20% better than current location is considered significant)
  const SIQS_IMPROVEMENT_THRESHOLD = 1.2;
  
  // Load all nearby potential locations
  useEffect(() => {
    const fetchLocations = async () => {
      if (!userLocation) return;
      
      setLoading(true);
      setSearching(true);
      try {
        // Get potential locations from the API
        const locations = await getSharedAstroSpots(
          userLocation.latitude,
          userLocation.longitude,
          100, // Get more locations to filter later
          searchDistance // Use current search distance parameter
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
        
        // Calculate real SIQS for each location
        await calculateRealSIQS(locationsWithDistance, userLocation);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error(
          language === "en" ? "Error loading locations" : "加载位置时出错", 
          { description: language === "en" ? "Please try again later" : "请稍后再试" }
        );
      } finally {
        setLoading(false);
        setSearching(false);
      }
    };
    
    fetchLocations();
  }, [userLocation, language, searchDistance]);
  
  // Calculate real SIQS scores for locations
  const calculateRealSIQS = async (locations: SharedAstroSpot[], userLocation: { latitude: number; longitude: number }) => {
    if (locations.length === 0) return;
    
    const enhancedLocations = [...locations];
    let calculatedUserSiqs = currentSiqs;
    
    // If we don't have user's current SIQS, calculate it now
    if (calculatedUserSiqs === null && userLocation) {
      try {
        // Get weather data
        const weatherData = await fetchWeatherData({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        });
        
        // Get light pollution data
        const pollutionData = await fetchLightPollutionData(
          userLocation.latitude, 
          userLocation.longitude
        );
        
        if (weatherData && pollutionData) {
          // Calculate SIQS
          const siqsResult = calculateSIQS({
            cloudCover: weatherData.cloudCover,
            bortleScale: pollutionData.bortleScale || 5,
            seeingConditions: DEFAULT_SEEING_CONDITIONS,
            windSpeed: weatherData.windSpeed,
            humidity: weatherData.humidity,
            moonPhase: 0, // Default value since we don't have real-time moon data
            precipitation: weatherData.precipitation,
            weatherCondition: weatherData.weatherCondition,
            aqi: weatherData.aqi
          });
          
          calculatedUserSiqs = siqsResult.score;
          
          // Check if user is in a good location
          const userHasGoodSiqs = calculatedUserSiqs !== null && calculatedUserSiqs >= 7;
          setIsUserInGoodLocation(userHasGoodSiqs);
        }
      } catch (err) {
        console.error("Error calculating user SIQS:", err);
      }
    } else {
      // Check if user is in a good location with existing SIQS
      const userHasGoodSiqs = calculatedUserSiqs !== null && calculatedUserSiqs >= 7;
      setIsUserInGoodLocation(userHasGoodSiqs);
    }
    
    // Calculate SIQS for each location
    const locationsWithSiqs = await Promise.all(
      enhancedLocations.map(async (location) => {
        try {
          // If location already has SIQS, use it
          if (location.siqs !== undefined) {
            return location;
          }
          
          // Get weather data for location
          const weatherData = await fetchWeatherData({
            latitude: location.latitude,
            longitude: location.longitude
          });
          
          // Use existing Bortle scale or fetch it
          let bortleScale = location.bortleScale;
          if (!bortleScale) {
            const pollutionData = await fetchLightPollutionData(
              location.latitude, 
              location.longitude
            );
            bortleScale = pollutionData?.bortleScale || 5;
          }
          
          if (weatherData) {
            // Calculate SIQS
            const siqsResult = calculateSIQS({
              cloudCover: weatherData.cloudCover,
              bortleScale: bortleScale,
              seeingConditions: DEFAULT_SEEING_CONDITIONS,
              windSpeed: weatherData.windSpeed,
              humidity: weatherData.humidity,
              moonPhase: 0, // Default value
              precipitation: weatherData.precipitation,
              weatherCondition: weatherData.weatherCondition,
              aqi: weatherData.aqi
            });
            
            return {
              ...location,
              siqs: siqsResult.score,
              isViable: siqsResult.isViable
            };
          }
        } catch (err) {
          console.error(`Error calculating SIQS for location ${location.name}:`, err);
        }
        
        return location;
      })
    );
    
    // Filter out locations without SIQS
    const validLocations = locationsWithSiqs.filter(loc => loc.siqs !== undefined);
    setAllLocations(validLocations);
    
    // Apply filters
    applyFilters(validLocations, calculatedUserSiqs);
  };
  
  // Filter locations based on distance and SIQS
  const applyFilters = (locations: SharedAstroSpot[], userSiqs: number | null) => {
    if (!userLocation || locations.length === 0) return;
    
    // Filter by distance
    const withinDistance = locations.filter(
      location => (location.distance || 0) <= searchDistance
    );
    
    // If user has a good SIQS, only show locations that are significantly better
    let betterLocations = withinDistance;
    if (userSiqs !== null) {
      betterLocations = withinDistance.filter(location => 
        location.siqs !== undefined && 
        location.siqs > userSiqs * SIQS_IMPROVEMENT_THRESHOLD
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
  };
  
  // Re-filter when search distance changes
  useEffect(() => {
    if (allLocations.length > 0) {
      applyFilters(allLocations, currentSiqs);
    }
  }, [searchDistance, currentSiqs, maxInitialResults]);
  
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
    searching,
    searchDistance,
    setSearchDistance,
    displayedLocations,
    hasMoreLocations,
    loadMoreLocations,
    isUserInGoodLocation
  };
};
