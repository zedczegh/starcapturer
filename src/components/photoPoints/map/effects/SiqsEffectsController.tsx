
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
const SiqsEffectsController: React.FC<SiqsEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated
}) => {
  const map = useMap();
  const [lastCalculation, setLastCalculation] = useState<number>(0);
  const calculationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    console.log(`Cached SIQS for ${cacheKey}: ${siqs}`);
  }, []);
  
  // Calculate SIQS for current location
  const calculateSiqs = useCallback(async () => {
    if (!userLocation || !map || activeView !== 'calculated') {
      return;
    }
    
    const { latitude, longitude } = userLocation;
    const currentLocationKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Don't recalculate if we already did recently or location hasn't changed
    if (
      Date.now() - lastCalculation < 60000 && // Within the last minute
      lastLocationRef.current === currentLocationKey
    ) {
      return;
    }
    
    // Check cache first
    const cachedSiqs = getSiqsFromCache(latitude, longitude);
    if (cachedSiqs !== null) {
      if (onSiqsCalculated) {
        onSiqsCalculated(cachedSiqs);
      }
      return;
    }
    
    // Calculate new SIQS
    try {
      // The calculateRealTimeSiqs function returns { siqs, isViable, factors }
      const result = await calculateRealTimeSiqs(latitude, longitude);
      
      if (result && typeof result.siqs === 'number') {
        // Cache and use the result
        cacheSiqs(latitude, longitude, result.siqs);
        
        if (onSiqsCalculated) {
          onSiqsCalculated(result.siqs);
        }
        
        // Update tracking variables
        setLastCalculation(Date.now());
        lastLocationRef.current = currentLocationKey;
      }
    } catch (error) {
      console.error("Failed to calculate SIQS:", error);
    }
  }, [userLocation, map, activeView, lastCalculation, getSiqsFromCache, cacheSiqs, onSiqsCalculated]);
  
  // Set up calculation when map and location are ready
  useEffect(() => {
    // Always initialize refs, even if we don't calculate
    
    // Don't do anything if we're not in calculated view
    if (activeView !== 'calculated' || !userLocation) {
      return;
    }
    
    // Calculate SIQS with some delay to prevent excessive calculations
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    calculationTimeoutRef.current = setTimeout(() => {
      calculateSiqs();
    }, 1000);
    
    // Cleanup
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [userLocation, map, activeView, calculateSiqs]);
  
  // React components with hooks must always return something
  return null;
};

export default SiqsEffectsController;
