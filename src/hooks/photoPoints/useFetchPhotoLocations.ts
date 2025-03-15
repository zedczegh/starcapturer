
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot, getSharedAstroSpots } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { fetchWeatherData } from "@/lib/api";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { isMountainousLocation } from "./locationTypeUtils";

// Default seeing conditions (when real data isn't available)
const DEFAULT_SEEING_CONDITIONS = 3;

export function useFetchPhotoLocations(
  userLocation: { latitude: number; longitude: number } | null,
  currentSiqs: number | null,
  searchDistance: number,
  setSearching: (value: boolean) => void,
  setLoading: (value: boolean) => void,
  setIsUserInGoodLocation: (value: boolean) => void
) {
  const { language } = useLanguage();
  const [allLocations, setAllLocations] = useState<SharedAstroSpot[]>([]);
  const [calculatedUserSiqs, setCalculatedUserSiqs] = useState<number | null>(currentSiqs);

  // Calculate real SIQS scores for locations
  const calculateRealSIQS = useCallback(async (
    locations: SharedAstroSpot[], 
    userLoc: { latitude: number; longitude: number }
  ) => {
    if (locations.length === 0) return;
    
    const enhancedLocations = [...locations];
    let userSiqs = calculatedUserSiqs;
    
    // If we don't have user's current SIQS, calculate it now
    if (userSiqs === null && userLoc) {
      try {
        // Get weather data
        const weatherData = await fetchWeatherData({
          latitude: userLoc.latitude,
          longitude: userLoc.longitude
        });
        
        // Get light pollution data
        const pollutionData = await fetchLightPollutionData(
          userLoc.latitude, 
          userLoc.longitude
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
          
          userSiqs = siqsResult.score;
          setCalculatedUserSiqs(userSiqs);
          
          // Check if user is in a good location
          const userHasGoodSiqs = userSiqs !== null && userSiqs >= 7;
          setIsUserInGoodLocation(userHasGoodSiqs);
        }
      } catch (err) {
        console.error("Error calculating user SIQS:", err);
      }
    } else {
      // Check if user is in a good location with existing SIQS
      const userHasGoodSiqs = userSiqs !== null && userSiqs >= 7;
      setIsUserInGoodLocation(userHasGoodSiqs);
    }
    
    // Calculate SIQS for each location with improved mountain detection
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
          
          // Special handling for mountainous areas - they might be better than estimated
          // Remote mountains often have better darkness than generic Bortle estimates
          const isMountain = isMountainousLocation(location);
          if (isMountain) {
            // For mountains, use even better Bortle scale reduction
            // Higher elevation typically means clearer, darker skies
            if (bortleScale > 3) {
              // Reduce Bortle scale for mountains - they're usually darker than estimation
              bortleScale = Math.max(2, bortleScale - 1.5);
            }
          }
          
          if (weatherData) {
            // Calculate SIQS with improved algorithm
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
            
            // If it's a mountain location, give a slight SIQS boost
            // Mountains often have clearer air and better seeing conditions
            let adjustedScore = siqsResult.score;
            if (isMountain && adjustedScore > 0) {
              adjustedScore = Math.min(10, adjustedScore * 1.15);
            }
            
            return {
              ...location,
              siqs: adjustedScore,
              isViable: siqsResult.isViable,
              bortleScale: bortleScale // Save the potentially adjusted bortleScale
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
    return validLocations;
  }, [calculatedUserSiqs, setIsUserInGoodLocation]);

  // Fetch locations function
  const fetchLocations = useCallback(async () => {
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
      
      // Calculate real SIQS values
      const enhancedLocations = await calculateRealSIQS(locationsWithDistance, userLocation);
      if (enhancedLocations) {
        setAllLocations(enhancedLocations);
      } else {
        setAllLocations([]);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error(
        language === "en" ? "Error loading locations" : "加载位置时出错", 
        { description: language === "en" ? "Please try again later" : "请稍后再试" }
      );
      setAllLocations([]);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [userLocation, language, searchDistance, calculateRealSIQS, setLoading, setSearching]);

  return {
    allLocations,
    fetchLocations,
    calculatedUserSiqs
  };
}
