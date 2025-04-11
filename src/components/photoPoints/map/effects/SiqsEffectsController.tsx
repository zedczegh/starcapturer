
import React, { useEffect, useState, useCallback } from 'react';
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
 */
export const SiqsEffectsController: React.FC<SiqsEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated
}) => {
  const map = useMap();
  const [lastCalculation, setLastCalculation] = useState<number>(0);
  
  // Calculate SIQS for user location
  const calculateUserSiqs = useCallback(async () => {
    if (!userLocation) return;
    
    // Don't recalculate too frequently
    const now = Date.now();
    if (now - lastCalculation < 30000) return; // 30-second cooldown
    
    setLastCalculation(now);
    
    try {
      const defaultBortleScale = 4; // Default if not available
      const result = await calculateRealTimeSiqs(
        userLocation.latitude, 
        userLocation.longitude, 
        defaultBortleScale
      );
      
      if (onSiqsCalculated && result) {
        onSiqsCalculated(result.siqs);
      }
      
    } catch (error) {
      console.error("Error calculating SIQS for current location:", error);
    }
  }, [userLocation, lastCalculation, onSiqsCalculated]);
  
  // Calculate SIQS when location changes
  useEffect(() => {
    if (!userLocation) return;
    
    // Small delay to ensure map is ready
    const timer = setTimeout(() => {
      calculateUserSiqs();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [userLocation, calculateUserSiqs]);
  
  return null;
};

export default SiqsEffectsController;
