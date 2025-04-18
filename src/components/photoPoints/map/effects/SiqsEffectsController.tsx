
import React, { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

interface SiqsEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
  disabled?: boolean;
}

const SiqsEffectsController: React.FC<SiqsEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated,
  disabled = false
}) => {
  const map = useMap();
  
  const calculateSiqsForLocation = useCallback(async (latitude: number, longitude: number) => {
    try {
      // Use our simplified cloud cover based SIQS calculation
      const result = await calculateRealTimeSiqs(latitude, longitude, 4);
      
      if (result && typeof result.score === 'number') {
        console.log(`Map effects: calculated SIQS ${result.score} for [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        if (onSiqsCalculated) {
          onSiqsCalculated(result.score);
        }
        return result.score;
      }
    } catch (error) {
      console.error("Error calculating SIQS in map effects:", error);
    }
    return null;
  }, [onSiqsCalculated]);
  
  useEffect(() => {
    if (disabled || !userLocation || !map) return;
    
    // Always calculate SIQS for user location
    const applyMapEffects = async () => {
      try {
        if (userLocation) {
          await calculateSiqsForLocation(userLocation.latitude, userLocation.longitude);
        }
        
        // Generate points around user for calculated view
        if (activeView === 'calculated' && searchRadius > 0) {
          // Log that we're using the simplified SIQS calculation
          console.log(`Using simplified nighttime cloud cover SIQS calculation for radius ${searchRadius}km`);
        }
      } catch (error) {
        console.error("Error applying map effects:", error);
      }
    };
    
    applyMapEffects();
  }, [map, userLocation, activeView, searchRadius, calculateSiqsForLocation]);
  
  return null;
};

export default SiqsEffectsController;
