
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

interface SiqsEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
}

// Local in-memory cache to avoid repeated calculations
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
}>();

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

/**
 * Component to handle real-time SIQS calculations and map effects
 * Optimized with debouncing, memoization and caching for better performance
 */
export const SiqsEffectsController: React.FC<SiqsEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated
}) => {
  const map = useMap();
  const [lastCalculation, setLastCalculation] = useState<number>(0);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<string | null>(null);
  
  // Get SIQS from cache if available
  const getSiqsFromCache = useCallback((latitude: number, longitude: number): number | null => {
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const cached = siqsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`Using cached SIQS for ${cacheKey}: ${cached.siqs}`);
      return cached.siqs;
    }
    
    return null;
  }, []);
  
  // Save SIQS to cache
  const cacheSiqs = useCallback((latitude: number, longitude: number, siqs: number) => {
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    siqsCache.set(cacheKey, {
      siqs,
      timestamp: Date.now()
    });
    
    // Also store in localStorage for persistence across sessions
    try {
      localStorage.setItem(`siqs_cache_${cacheKey}`, JSON.stringify({
        siqs,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Error caching SIQS in localStorage:", error);
    }
    
    console.log(`Cached SIQS for ${cacheKey}: ${siqs}`);
  }, []);
  
  // Calculate SIQS for user location with debouncing
  const calculateUserSiqs = useCallback(async () => {
    if (!userLocation) return;
    
    // Create location key for caching
    const locationKey = `${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}`;
    
    // Skip if same location was recently calculated
    if (locationKey === lastLocationRef.current) {
      const now = Date.now();
      if (now - lastCalculation < 30000) return; // 30-second cooldown for same location
    }
    
    // Check local memory cache first
    const cachedSiqs = getSiqsFromCache(userLocation.latitude, userLocation.longitude);
    if (cachedSiqs !== null && onSiqsCalculated) {
      onSiqsCalculated(cachedSiqs);
      return;
    }
    
    // Check localStorage cache as backup
    try {
      const cacheKey = `siqs_cache_${locationKey}`;
      const cachedResult = localStorage.getItem(cacheKey);
      if (cachedResult) {
        const parsed = JSON.parse(cachedResult);
        if (parsed && parsed.timestamp > Date.now() - CACHE_DURATION) {
          console.log("Using cached SIQS result from localStorage:", locationKey);
          if (onSiqsCalculated) {
            onSiqsCalculated(parsed.siqs);
          }
          return;
        }
      }
    } catch (error) {
      console.error("Error reading SIQS cache from localStorage:", error);
    }
    
    // Update refs
    lastLocationRef.current = locationKey;
    setLastCalculation(Date.now());
    
    try {
      const defaultBortleScale = 4; // Default if not available
      const result = await calculateRealTimeSiqs(
        userLocation.latitude, 
        userLocation.longitude, 
        defaultBortleScale
      );
      
      if (result) {
        // Cache the result
        cacheSiqs(userLocation.latitude, userLocation.longitude, result.siqs);
        
        if (onSiqsCalculated) {
          onSiqsCalculated(result.siqs);
        }
      }
    } catch (error) {
      console.error("Error calculating SIQS for current location:", error);
    }
  }, [userLocation, lastCalculation, onSiqsCalculated, getSiqsFromCache, cacheSiqs]);
  
  // Calculate SIQS when location changes - with debouncing
  useEffect(() => {
    if (!userLocation) return;
    
    // For calculated view, always calculate SIQS to ensure fresh data
    // For certified view, only calculate if not already calculated recently
    const needsCalculation = 
      activeView === 'calculated' || 
      lastLocationRef.current !== `${userLocation.latitude.toFixed(4)}-${userLocation.longitude.toFixed(4)}`;
    
    if (!needsCalculation) return;
    
    // Clear any existing timeout
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    // Set a new timeout for calculation
    calculationTimeoutRef.current = setTimeout(() => {
      calculateUserSiqs();
    }, 500);
    
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [userLocation, activeView, calculateUserSiqs]);
  
  // Clear old cache entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      // Clean up memory cache
      for (const [key, value] of siqsCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          siqsCache.delete(key);
        }
      }
      
      // Clean up localStorage cache
      try {
        const keys = Object.keys(localStorage);
        const siqsKeys = keys.filter(key => key.startsWith('siqs_cache_'));
        
        siqsKeys.forEach(key => {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (now - parsed.timestamp > CACHE_DURATION) {
                localStorage.removeItem(key);
              }
            } catch (e) {
              localStorage.removeItem(key); // Remove invalid cache entries
            }
          }
        });
      } catch (e) {
        console.error("Error cleaning up SIQS cache:", e);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);
  
  return null;
};

export default SiqsEffectsController;
