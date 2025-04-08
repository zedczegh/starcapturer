
import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { MapUpdater, SearchRadiusOverlay } from '@/components/location/map/MapEffectsComponents';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

interface MapEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
}

const MapEffectsController: React.FC<MapEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated
}) => {
  const map = useMap();
  const [isCalculating, setIsCalculating] = useState(false);
  const isCertifiedView = activeView === 'certified';
  
  // Calculate SIQS for the current user location
  useEffect(() => {
    let mounted = true;
    
    const calculateLocationSiqs = async () => {
      if (!userLocation) return;
      
      try {
        setIsCalculating(true);
        
        // Calculate SIQS for the current location using the correct function from realTimeSiqsService
        const result = await calculateRealTimeSiqs(
          userLocation.latitude, 
          userLocation.longitude,
          5 // Default Bortle scale if not provided
        );
        
        // Only update if component is still mounted
        if (mounted) {
          if (onSiqsCalculated && result?.siqs) {
            onSiqsCalculated(result.siqs);
          }
          setIsCalculating(false);
        }
      } catch (error) {
        console.error("Error calculating SIQS for map location:", error);
        if (mounted) {
          setIsCalculating(false);
        }
      }
    };
    
    calculateLocationSiqs();
    
    return () => {
      mounted = false;
    };
  }, [userLocation, onSiqsCalculated]);
  
  // Update map settings based on active view
  useEffect(() => {
    if (!map) return;
    
    // Update map maxZoom based on the active view
    if (isCertifiedView) {
      map.setMaxZoom(10);
    } else {
      map.setMaxZoom(18);
    }
    
  }, [map, isCertifiedView]);

  if (!userLocation) return null;
  
  return (
    <>
      {/* Update map center when user location changes */}
      <MapUpdater position={[userLocation.latitude, userLocation.longitude]} />
      
      {/* Add search radius overlay with radar scanning animation when loading */}
      <SearchRadiusOverlay
        position={[userLocation.latitude, userLocation.longitude]}
        radius={searchRadius}
        isLoading={isCalculating || (activeView === 'calculated' && searchRadius > 0)}
        color={isCertifiedView ? '#FFD700' : '#4ADE80'}
      />
    </>
  );
};

export default MapEffectsController;
