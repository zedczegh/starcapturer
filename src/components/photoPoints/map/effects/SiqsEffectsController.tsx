import React, { useState, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { currentSiqsStore } from '@/components/index/CalculatorSection';

interface SiqsEffectsControllerProps {
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated';
  searchRadius?: number;
  onSiqsCalculated?: (siqs: number) => void;
  siqs?: number;
}

/**
 * Component to handle SIQS calculations based on map state
 */
const SiqsEffectsController: React.FC<SiqsEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated,
  siqs
}) => {
  const map = useMap();
  const { t } = useLanguage();
  const [calculationStarted, setCalculationStarted] = useState(false);
  
  // Handle SIQS calculations
  const calculateSiqs = useCallback(() => {
    if (!userLocation || !map) return;
    
    // If siqs prop is provided, use that instead of calculating
    if (siqs !== undefined) {
      if (onSiqsCalculated) onSiqsCalculated(siqs);
      currentSiqsStore.setValue(siqs);
      return;
    }
    
    // Otherwise calculate SIQS based on map
    calculateRealTimeSiqs(userLocation.latitude, userLocation.longitude, 4).then(result => {
      const calculatedSiqs = result.siqs;
      if (typeof calculatedSiqs === 'number') {
        if (onSiqsCalculated) onSiqsCalculated(calculatedSiqs);
        currentSiqsStore.setValue(calculatedSiqs);
      }
    }).catch(err => {
      console.error("Error calculating SIQS:", err);
    });
  }, [userLocation, map, onSiqsCalculated, siqs]);
  
  // Calculate SIQS when user location changes
  useEffect(() => {
    if (userLocation && map && !calculationStarted) {
      setCalculationStarted(true);
      calculateSiqs();
    }
  }, [userLocation, map, calculateSiqs, calculationStarted]);
  
  // Update SIQS when map moves
  useEffect(() => {
    if (!map) return;
    
    const handleMapMoveEnd = () => {
      calculateSiqs();
    };
    
    map.on('moveend', handleMapMoveEnd);
    
    return () => {
      map.off('moveend', handleMapMoveEnd);
    };
  }, [map, calculateSiqs]);
  
  // If siqs prop is provided, update currentSiqsStore
  useEffect(() => {
    if (siqs !== undefined) {
      currentSiqsStore.setValue(siqs);
    }
  }, [siqs]);
  
  return null;
};

export default SiqsEffectsController;
