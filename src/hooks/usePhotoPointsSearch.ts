
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot, getSharedAstroSpots } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { fetchWeatherData } from "@/lib/api";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { getLocationInfo } from "@/data/locationDatabase";

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
  const [userRegionName, setUserRegionName] = useState<string>("");
  
  // SIQS threshold (20% better than current location is considered significant)
  // Lower threshold for mountain areas to ensure they're included
  const SIQS_IMPROVEMENT_THRESHOLD = 1.2;
  const SIQS_MOUNTAIN_THRESHOLD = 1.1;
  
  // Update user region name when location changes
  useEffect(() => {
    if (userLocation) {
      try {
        // Get higher-level location name (state/province)
        const locationInfo = getLocationInfo(userLocation.latitude, userLocation.longitude);
        
        // Extract just the region name
        let regionName = "";
        if (locationInfo.name) {
          // For Chinese locations, try to extract province/state level
          const nameParts = locationInfo.name.split(',');
          if (nameParts.length > 1) {
            // Try to get province/state level name
            const provincePart = nameParts.find(part => 
              part.trim().includes("Province") || 
              part.trim().includes("State") || 
              part.trim().includes("District") ||
              part.trim().includes("省") || 
              part.trim().includes("自治区") ||
              part.trim().includes("市")
            );
            
            if (provincePart) {
              regionName = provincePart.trim();
            } else {
              // If no province found, use the second part (usually city or county)
              regionName = nameParts[1].trim();
            }
          } else {
            regionName = locationInfo.name;
          }
        }
        
        setUserRegionName(regionName || (language === 'en' ? "Current Region" : "当前区域"));
      } catch (error) {
        console.error("Error setting user region name:", error);
        setUserRegionName(language === 'en' ? "Current Region" : "当前区域");
      }
    }
  }, [userLocation, language]);
  
  // Check if a location is in a mountainous area based on name or type
  const isMountainousLocation = (location: SharedAstroSpot): boolean => {
    if (!location.name) return false;
    
    const nameLC = location.name.toLowerCase();
    const chineseNameLC = location.chineseName?.toLowerCase() || '';
    
    // Check English name
    if (nameLC.includes('mountain') || 
        nameLC.includes('mount ') || 
        nameLC.includes(' mt.') || 
        nameLC.includes('mt ') ||
        nameLC.includes('peak') || 
        nameLC.includes('hills') ||
        nameLC.includes('range') ||
        nameLC.includes('ridge') ||
        nameLC.includes('highland') ||
        nameLC.includes('plateau')) {
      return true;
    }
    
    // Check Chinese name
    if (chineseNameLC.includes('山') || 
        chineseNameLC.includes('岭') || 
        chineseNameLC.includes('峰') ||
        chineseNameLC.includes('高原') ||
        chineseNameLC.includes('坪') ||
        chineseNameLC.includes('岗')) {
      return true;
    }
    
    // Check description for mountain references
    if (location.description) {
      const descriptionLC = location.description.toLowerCase();
      if (descriptionLC.includes('mountain') || 
          descriptionLC.includes('elevation') ||
          descriptionLC.includes('altitude') ||
          descriptionLC.includes('高山') ||
          descriptionLC.includes('海拔')) {
        return true;
      }
    }
    
    return false;
  };
  
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
    setAllLocations(validLocations);
    
    // Apply filters
    applyFilters(validLocations, calculatedUserSiqs);
  };
  
  // Filter locations based on distance, SIQS, and type
  const applyFilters = (locations: SharedAstroSpot[], userSiqs: number | null) => {
    if (!userLocation || locations.length === 0) return;
    
    // Filter by distance
    const withinDistance = locations.filter(
      location => (location.distance || 0) <= searchDistance
    );
    
    // If user has a good SIQS, only show locations that are significantly better
    let betterLocations = withinDistance;
    if (userSiqs !== null) {
      betterLocations = withinDistance.filter(location => {
        if (!location.siqs) return false;
        
        // Use a lower improvement threshold for mountain areas
        const isMountain = isMountainousLocation(location);
        const threshold = isMountain ? SIQS_MOUNTAIN_THRESHOLD : SIQS_IMPROVEMENT_THRESHOLD;
        
        return location.siqs > userSiqs * threshold;
      });
    }
    
    // Sort by a weighted combination of SIQS and distance with improved algorithm
    const sortedLocations = betterLocations.sort((a, b) => {
      // First prioritize by cloud cover (the most important factor)
      // We estimate this from the SIQS score difference
      const siqsDiff = (b.siqs || 0) - (a.siqs || 0);
      
      // For significant SIQS difference, prioritize better SIQS
      if (Math.abs(siqsDiff) > 1.0) {
        return siqsDiff;
      }
      
      // For similar SIQS, mountains get priority over urban areas
      const aIsMountain = isMountainousLocation(a);
      const bIsMountain = isMountainousLocation(b);
      
      if (aIsMountain && !bIsMountain) return -1;
      if (!aIsMountain && bIsMountain) return 1;
      
      // For locations with similar SIQS and the same mountain status
      // Use a weighted score that considers both SIQS and distance
      const aDistance = a.distance || 0;
      const bDistance = b.distance || 0;
      
      // Give more weight to SIQS than distance
      const aScore = (a.siqs || 0) * 3 - (aDistance / 500);
      const bScore = (b.siqs || 0) * 3 - (bDistance / 500);
      
      return bScore - aScore;
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
    isUserInGoodLocation,
    userRegionName
  };
};
