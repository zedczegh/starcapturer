
import { useState } from "react";

export const useLocationDataCache = () => {
  const [cache, setCache] = useState<Record<string, any>>({});
  
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
  
  return { setCachedData, getCachedData };
};
