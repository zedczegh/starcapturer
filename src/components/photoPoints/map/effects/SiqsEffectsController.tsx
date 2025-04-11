
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

interface SiqsEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
}

/**
 * Component to handle real-time SIQS calculations and map effects
 * Optimized with debouncing and memoization for better performance
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
    
    // Update refs
    lastLocationRef.current = locationKey;
    setLastCalculation(Date.now());
    
    try {
      // Check for cached result first
      const cachedResult = localStorage.getItem(`siqs_cache_${locationKey}`);
      if (cachedResult) {
        const parsed = JSON.parse(cachedResult);
        if (parsed && parsed.timestamp > Date.now() - 3600000) { // Cache valid for 1 hour
          console.log("Using cached SIQS result for location:", locationKey);
          if (onSiqsCalculated) {
            onSiqsCalculated(parsed.siqs);
          }
          return;
        }
      }
      
      const defaultBortleScale = 4; // Default if not available
      const result = await calculateRealTimeSiqs(
        userLocation.latitude, 
        userLocation.longitude, 
        defaultBortleScale
      );
      
      if (result) {
        // Cache the result
        localStorage.setItem(`siqs_cache_${locationKey}`, JSON.stringify({
          siqs: result.siqs,
          timestamp: Date.now()
        }));
        
        if (onSiqsCalculated) {
          onSiqsCalculated(result.siqs);
        }
      }
    } catch (error) {
      console.error("Error calculating SIQS for current location:", error);
    }
  }, [userLocation, lastCalculation, onSiqsCalculated]);
  
  // Calculate SIQS when location changes - with debouncing
  useEffect(() => {
    if (!userLocation) return;
    
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
  }, [userLocation, calculateUserSiqs]);
  
  return null;
};

export default SiqsEffectsController;
