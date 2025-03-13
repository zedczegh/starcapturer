
import { useState, useEffect } from "react";
import { findClosestKnownLocation } from "@/utils/bortleScaleEstimation";

export const useLocationDataCache = () => {
  const [cache, setCache] = useState<Record<string, any>>({});
  
  // Load cache from localStorage on component mount
  useEffect(() => {
    try {
      const savedCache = localStorage.getItem('locationCache');
      if (savedCache) {
        setCache(JSON.parse(savedCache));
      }
    } catch (error) {
      console.error("Error loading location cache:", error);
    }
  }, []);
  
  // Save cache to localStorage when it changes
  useEffect(() => {
    if (Object.keys(cache).length > 0) {
      try {
        localStorage.setItem('locationCache', JSON.stringify(cache));
      } catch (error) {
        console.error("Error saving location cache:", error);
      }
    }
  }, [cache]);
  
  const setCachedData = (key: string, data: any) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }));
  };
  
  const getCachedData = (key: string, maxAge = 5 * 60 * 1000) => {
    const cached = cache[key];
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) return null;
    
    return cached.data;
  };
  
  const getLocationName = (latitude: number, longitude: number): string => {
    // First check if we have this location cached with a proper name
    const cacheKey = `loc-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const cachedLocation = getCachedData(cacheKey, 30 * 24 * 60 * 60 * 1000); // 30 days cache
    
    if (cachedLocation && cachedLocation.name && !cachedLocation.name.includes("Location at")) {
      return cachedLocation.name;
    }
    
    // If not cached or has a coordinate-based name, check our local database
    const closestLocation = findClosestKnownLocation(latitude, longitude);
    
    // If within 20km of a known location, use that name
    if (closestLocation.distance <= 20) {
      // Cache this result for future use
      setCachedData(cacheKey, {
        name: closestLocation.name,
        bortleScale: closestLocation.bortleScale
      });
      
      return closestLocation.name;
    }
    
    // Fall back to coordinate-based name
    return `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  };
  
  return { setCachedData, getCachedData, getLocationName };
};
