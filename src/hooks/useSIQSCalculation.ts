
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWeatherData, fetchLightPollutionData } from "@/lib/api";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { useLocationDataCache } from "./useLocationData";
import { useToast } from "@/hooks/use-toast";

export const useSIQSCalculation = (
  setCachedData: (key: string, data: any) => void,
  getCachedData: (key: string, maxAge?: number) => any
) => {
  const navigate = useNavigate();
  const [isCalculating, setIsCalculating] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Pre-compute values for better performance
  const currentMoonPhase = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const c = 365.25 * year;
    const e = 30.6 * month;
    const jd = c + e + day - 694039.09;
    return (jd % 29.53) / 29.53;
  }, []);
  
  const validateInputs = (locationName: string, latitude: string, longitude: string, language: string): boolean => {
    if (!locationName.trim()) {
      return false;
    }
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return false;
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return false;
    }
    
    return true;
  };
  
  const calculateSIQSForLocation = async (
    lat: number, 
    lng: number, 
    name: string, 
    displayOnly: boolean = false, 
    bortleScale: number, 
    seeingConditions: number, 
    setLoading?: (loading: boolean) => void, 
    setStatusMessage?: (message: string) => void,
    language: string = 'en'
  ) => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    displayOnly ? null : setLoading && setLoading(true);
    
    // Check if we have cached weather data
    const cacheKey = `weather-${lat.toFixed(4)}-${lng.toFixed(4)}`;
    const cachedWeatherData = !displayOnly ? null : getCachedData(cacheKey, 2 * 60 * 1000); // 2 minute cache for weather
    
    try {
      let data;
      
      if (cachedWeatherData) {
        data = cachedWeatherData;
      } else {
        try {
          data = await fetchWeatherData({
            latitude: lat,
            longitude: lng,
          });
          
          if (data) {
            // Cache the weather data for future use
            setCachedData(cacheKey, data);
          }
        } catch (weatherError) {
          console.error("Failed to fetch weather data:", weatherError);
          
          // Use fallback weather data
          data = {
            temperature: 20,
            humidity: 50,
            cloudCover: 30,
            windSpeed: 10,
            precipitation: 0,
            time: new Date().toISOString(),
            condition: "Clear",
            weatherCondition: "Clear",
            aqi: 50
          };
          
          // Show toast notification if not in display-only mode
          if (!displayOnly) {
            toast({
              title: language === 'en' ? "Using offline data" : "使用离线数据",
              description: language === 'en'
                ? "Could not fetch real-time weather. Using offline data instead."
                : "无法获取实时天气数据，使用离线数据替代。"
            });
          }
        }
      }
      
      if (!data) {
        setStatusMessage && setStatusMessage(language === 'en' ? 
          "Could not retrieve weather data. Please try again." : 
          "无法获取天气数据，请重试。");
        setIsCalculating(false);
        displayOnly ? null : setLoading && setLoading(false);
        return;
      }
      
      setWeatherData(data);
      
      // Get reliable Bortle scale data with fallbacks
      let actualBortleScale = bortleScale;
      
      if (!displayOnly || actualBortleScale === 4) {
        // Check if we have cached Bortle scale data
        const bortleCacheKey = `bortle-${lat.toFixed(4)}-${lng.toFixed(4)}`;
        const cachedBortleData = getCachedData(bortleCacheKey, 24 * 60 * 60 * 1000); // 24 hour cache for Bortle scale
        
        if (cachedBortleData && typeof cachedBortleData.bortleScale === 'number') {
          actualBortleScale = cachedBortleData.bortleScale;
          console.log("Using cached Bortle scale data:", actualBortleScale);
        } else {
          try {
            // Attempt to fetch Bortle scale from API
            const lightPollutionData = await fetchLightPollutionData(lat, lng);
            
            if (lightPollutionData && typeof lightPollutionData.bortleScale === 'number' && 
                lightPollutionData.bortleScale >= 1 && lightPollutionData.bortleScale <= 9) {
              actualBortleScale = lightPollutionData.bortleScale;
              console.log("Got Bortle scale from API:", actualBortleScale);
              
              // Cache the valid Bortle scale data
              setCachedData(bortleCacheKey, lightPollutionData);
            } else {
              // If API returned invalid data, use location-based estimation
              const estimatedScale = estimateBortleScaleByLocation(name, lat, lng);
              actualBortleScale = estimatedScale;
              console.log("Using estimated Bortle scale:", estimatedScale);
              
              // Cache the estimated data
              setCachedData(bortleCacheKey, { bortleScale: estimatedScale, estimated: true });
              
              if (!displayOnly) {
                toast({
                  title: language === 'en' ? "Using estimated light pollution data" : "使用估算的光污染数据",
                  description: language === 'en'
                    ? "Could not fetch precise light pollution data. Using location-based estimation."
                    : "无法获取精确的光污染数据。使用基于位置的估算。"
                });
              }
            }
          } catch (lightError) {
            console.error("Error fetching light pollution data in SIQS calculation:", lightError);
            
            // Use location-based estimation
            const estimatedScale = estimateBortleScaleByLocation(name, lat, lng);
            actualBortleScale = estimatedScale;
            console.log("Using estimated Bortle scale after API error:", estimatedScale);
            
            // Cache the estimated data
            setCachedData(bortleCacheKey, { bortleScale: estimatedScale, estimated: true });
            
            if (!displayOnly) {
              toast({
                title: language === 'en' ? "Using estimated light pollution data" : "使用估算的光污染数据",
                description: language === 'en'
                  ? "Could not fetch light pollution data. Using location-based estimation."
                  : "无法获取光污染数据。使用基于位置的估算。"
              });
            }
          }
        }
      }
      
      // Validate Bortle scale before proceeding
      if (actualBortleScale < 1 || actualBortleScale > 9 || isNaN(actualBortleScale)) {
        console.warn("Invalid Bortle scale value detected:", actualBortleScale);
        actualBortleScale = 5; // Default to moderate value if invalid
      }
      
      const siqsResult = calculateSIQS({
        cloudCover: data.cloudCover,
        bortleScale: actualBortleScale,
        seeingConditions,
        windSpeed: data.windSpeed,
        humidity: data.humidity,
        moonPhase: currentMoonPhase,
        precipitation: data.precipitation,
        weatherCondition: data.weatherCondition,
        aqi: data.aqi
      });
      
      if (displayOnly) {
        setSiqsScore(siqsResult.score * 10);
        setIsCalculating(false);
        return;
      }
      
      const locationId = Date.now().toString();
      
      const locationData = {
        id: locationId,
        name: name,
        latitude: lat,
        longitude: lng,
        bortleScale: actualBortleScale,
        seeingConditions,
        weatherData: data,
        siqsResult,
        moonPhase: currentMoonPhase,
        timestamp: new Date().toISOString(),
      };
      
      console.log("Navigating to location details with data:", locationData);
      
      // Ensure navigation happens immediately to prevent data loss
      navigate(`/location/${locationId}`, { 
        state: locationData,
        replace: false
      });
      
      // Wait a small delay to ensure the state is updated
      setTimeout(() => {
        setIsCalculating(false);
        displayOnly ? null : setLoading && setLoading(false);
      }, 100);
      
    } catch (error) {
      console.error("Error calculating SIQS:", error);
      setStatusMessage && setStatusMessage(language === 'en' ? 
        "An error occurred while calculating SIQS. Please try again." : 
        "计算SIQS时发生错误，请重试。");
      setIsCalculating(false);
      displayOnly ? null : setLoading && setLoading(false);
    }
  };
  
  // Function to estimate Bortle scale by location characteristics
  const estimateBortleScaleByLocation = (locationName: string, lat: number, lon: number): number => {
    // Check if we're near a known major city (approximate)
    const majorCities = [
      { name: "tokyo", lat: 35.6895, lon: 139.6917, bortleScale: 9 },
      { name: "new york", lat: 40.7128, lon: -74.0060, bortleScale: 9 },
      { name: "shanghai", lat: 31.2304, lon: 121.4737, bortleScale: 9 },
      { name: "beijing", lat: 39.9042, lon: 116.4074, bortleScale: 9 },
      { name: "london", lat: 51.5074, lon: -0.1278, bortleScale: 8 },
      { name: "paris", lat: 48.8566, lon: 2.3522, bortleScale: 8 },
      { name: "hong kong", lat: 22.3193, lon: 114.1694, bortleScale: 8 },
      { name: "singapore", lat: 1.3521, lon: 103.8198, bortleScale: 8 },
      { name: "seoul", lat: 37.5665, lon: 126.9780, bortleScale: 8 },
      { name: "delhi", lat: 28.7041, lon: 77.1025, bortleScale: 8 }
    ];
    
    const lowerName = locationName.toLowerCase();
    
    // First check by name for exact matches
    for (const city of majorCities) {
      if (lowerName.includes(city.name)) {
        return city.bortleScale;
      }
    }
    
    // Check for proximity to known cities
    for (const city of majorCities) {
      const distance = calculateHaversineDistance(lat, lon, city.lat, city.lon);
      if (distance < 50) { // Within 50km of a major city
        return city.bortleScale - 1; // One level less than city center
      } else if (distance < 100) { // Within 100km
        return city.bortleScale - 2; // Two levels less
      }
    }
    
    // Now apply generic estimation based on location name patterns
    if (/\b(city center|downtown|central|cbd)\b/i.test(lowerName)) {
      return 8; // Downtown/city center
    }
    
    if (/\b(city|urban|metro|municipal)\b/i.test(lowerName)) {
      return 7; // Urban area
    }
    
    if (/\b(suburb|residential|borough|district)\b/i.test(lowerName)) {
      return 6; // Suburban area
    }
    
    if (/\b(town|township|village)\b/i.test(lowerName)) {
      return 5; // Small town
    }
    
    if (/\b(rural|countryside|farmland|agricultural)\b/i.test(lowerName)) {
      return 4; // Rural area
    }
    
    if (/\b(park|forest|national|reserve|preserve)\b/i.test(lowerName)) {
      return 3; // Natural area
    }
    
    if (/\b(desert|mountain|remote|wilderness|isolated)\b/i.test(lowerName)) {
      return 2; // Remote area
    }
    
    // Default - moderate light pollution assumption
    return 5;
  };
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const toRad = (value: number): number => {
    return value * Math.PI / 180;
  };
  
  return {
    isCalculating,
    weatherData,
    siqsScore,
    currentMoonPhase,
    setSiqsScore,
    validateInputs,
    calculateSIQSForLocation
  };
};
