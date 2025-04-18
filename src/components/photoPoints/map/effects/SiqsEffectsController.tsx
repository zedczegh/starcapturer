
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
    
    // Apply effects based on the current view and map state
    const applyMapEffects = async () => {
      try {
        // For user location, always calculate SIQS
        if (userLocation) {
          await calculateSiqsForLocation(userLocation.latitude, userLocation.longitude);
        }
        
        console.log(`Map effects applied for ${activeView} view with radius ${searchRadius}km`);
      } catch (error) {
        console.error("Error applying map effects:", error);
      }
    };
    
    applyMapEffects();
    
    // We don't need event listeners since this component will re-render
    // when the props change
    
  }, [map, userLocation, activeView, searchRadius, calculateSiqsForLocation]);
  
  return null;
};

export default SiqsEffectsController;
