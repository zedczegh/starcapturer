
import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { useAnimationState } from '../radar/AnimationStateManager';

interface SiqsEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  isScanning?: boolean;
  searchRadius?: number;
  onSiqsCalculated?: (siqs: number) => void;
}

const SiqsEffectsController: React.FC<SiqsEffectsControllerProps> = ({
  userLocation,
  activeView,
  isScanning = false,
  searchRadius = 100,
  onSiqsCalculated
}) => {
  const map = useMap();
  const { showAnimation } = useAnimationState({ isScanning });
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  
  // Calculate SIQS for current location
  useEffect(() => {
    if (!userLocation || !map) return;
    
    let isMounted = true;
    
    // Only show animation for calculated view
    if (activeView === 'calculated') {
      const fetchSiqs = async () => {
        try {
          const siqsResult = await calculateRealTimeSiqs(
            userLocation.latitude, 
            userLocation.longitude,
            undefined,
            searchRadius
          );
          
          if (isMounted) {
            setCurrentSiqs(siqsResult.siqs);
            if (onSiqsCalculated) {
              onSiqsCalculated(siqsResult.siqs);
            }
          }
        } catch (error) {
          console.error("Error calculating SIQS:", error);
        }
      };
      
      fetchSiqs();
    }
    
    return () => {
      isMounted = false;
    };
  }, [userLocation, activeView, map, onSiqsCalculated, searchRadius]);
  
  return null;
};

export default SiqsEffectsController;
