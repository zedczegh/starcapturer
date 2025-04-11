
import React, { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService'; // Updated import
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import L from 'leaflet';

interface MapEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onSiqsCalculated?: (siqs: number) => void;
}

/**
 * Controller component for map effects and real-time SIQS updates
 * Handles SIQS calculations when user location changes
 */
const MapEffectsController: React.FC<MapEffectsControllerProps> = ({
  userLocation,
  activeView,
  searchRadius,
  onSiqsCalculated
}) => {
  const { t } = useLanguage();
  const map = useMap();
  
  // Calculate real-time SIQS for the current location
  const updateRealTimeSiqs = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      const result = await calculateRealTimeSiqs(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      if (result && typeof result.siqs === 'number') {
        console.log(`Real-time SIQS calculated: ${result.siqs.toFixed(1)}`);
        
        // Update the global SIQS store
        currentSiqsStore.setValue(result.siqs);
        
        // Call the callback if provided
        if (onSiqsCalculated) {
          onSiqsCalculated(result.siqs);
        }
      }
    } catch (error) {
      console.error("Error calculating real-time SIQS:", error);
    }
  }, [userLocation, onSiqsCalculated, searchRadius]);
  
  // Effect for location change
  useEffect(() => {
    if (userLocation) {
      updateRealTimeSiqs();
    }
  }, [userLocation, updateRealTimeSiqs]);
  
  // Effect for map initialization
  useEffect(() => {
    if (!map) return;
    
    // Enable map interactions
    map.scrollWheelZoom.enable();
    map.dragging.enable();
    
    // Clear SIQS cache when view changes
    if (activeView) {
      clearLocationCache(); // Using imported function
    }
    
    // Add performance optimizations
    map._onResize = L.Util.throttle(map._onResize, 200, map);
    
    // Update UI when radius changes
    if (activeView === 'calculated' && searchRadius) {
      console.log(`Search radius set to ${searchRadius}km for calculated locations`);
    }
    
    // Set world bounds to prevent infinite horizontal scrolling
    const worldBounds = L.latLngBounds(
      L.latLng(-90, -180),
      L.latLng(90, 180)
    );
    
    map.setMaxBounds(worldBounds);
    map.on('drag', function() {
      map.panInsideBounds(worldBounds, { animate: false });
    });

    // Add bounds limiting
    const originalGetBounds = map.getBounds;
    map.wrapLatLng = function(latlng) {
      const lng = latlng.lng;
      const wrappedLng = ((lng + 540) % 360) - 180;
      return L.latLng(latlng.lat, wrappedLng);
    };
    
    return () => {
      if (map) {
        map.off('drag');
      }
    };
  }, [map, activeView, searchRadius]);
  
  return null;
};

export default MapEffectsController;
