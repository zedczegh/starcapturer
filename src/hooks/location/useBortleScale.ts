import { useState, useEffect } from "react";
import { findClosestCity, interpolateBortleScale } from "@/utils/lightPollutionData";

/**
 * Estimate Bortle scale based on location name without coordinates
 * @param locationName Name of the location
 * @returns Estimated Bortle scale
 */
export const estimateBortleScale = (locationName: string): number => {
  if (!locationName) return 5;
  
  const lowercaseName = locationName.toLowerCase();
  
  // Check for urban keywords
  if (
    lowercaseName.includes('city') || 
    lowercaseName.includes('downtown') || 
    lowercaseName.includes('urban') ||
    lowercaseName.includes('市') ||
    lowercaseName.includes('区')
  ) {
    return 7;
  }
  
  // Check for suburban/town keywords
  if (
    lowercaseName.includes('town') || 
    lowercaseName.includes('village') || 
    lowercaseName.includes('suburb') ||
    lowercaseName.includes('township') ||
    lowercaseName.includes('镇') ||
    lowercaseName.includes('乡')
  ) {
    return 5;
  }
  
  // Check for rural/dark site keywords
  if (
    lowercaseName.includes('forest') || 
    lowercaseName.includes('park') || 
    lowercaseName.includes('reserve') ||
    lowercaseName.includes('mountain') ||
    lowercaseName.includes('wilderness') ||
    lowercaseName.includes('national') ||
    lowercaseName.includes('desert') ||
    lowercaseName.includes('森林') ||
    lowercaseName.includes('公园') ||
    lowercaseName.includes('山') ||
    lowercaseName.includes('沙漠')
  ) {
    return 3;
  }
  
  // Default value
  return 5;
};

/**
 * Hook to get the Bortle scale for a location
 */
export const useBortleScale = (latitude?: number, longitude?: number) => {
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!latitude || !longitude) {
      setBortleScale(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First try to find the closest known city
      const closestCity = findClosestCity(latitude, longitude);
      
      if (closestCity.distance < 50) {
        // If we're close to a known city, use its Bortle scale
        setBortleScale(closestCity.bortleScale);
      } else {
        // Otherwise use interpolation for more accurate estimate
        const interpolatedScale = interpolateBortleScale(latitude, longitude);
        setBortleScale(interpolatedScale);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error determining Bortle scale:", err);
      setError(err instanceof Error ? err : new Error("Failed to determine Bortle scale"));
      setLoading(false);
    }
  }, [latitude, longitude]);
  
  return { bortleScale, loading, error };
};

export default useBortleScale;
