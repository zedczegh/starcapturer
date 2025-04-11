
import React, { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateRealTimeSiqs, clearSiqsCache } from '@/services/realTimeSiqsService';
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
    
    // Enable map interactions - ensure dragging is enabled
    map.scrollWheelZoom.enable();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    if (map.tap) map.tap.enable();
    
    // Clear SIQS cache when view changes
    if (activeView) {
      clearSiqsCache();
    }
    
    // Add performance optimizations
    map._onResize = L.Util.throttle(map._onResize, 200, map);
    
    // Update UI when radius changes
    if (activeView === 'calculated' && searchRadius) {
      console.log(`Search radius set to ${searchRadius}km for calculated locations`);
    }
    
    // Set world bounds to prevent infinite horizontal scrolling
    // This restricts the map to one "copy" of the world
    const worldBounds = L.latLngBounds(
      L.latLng(-90, -180),  // Southwest corner
      L.latLng(90, 180)     // Northeast corner
    );
    
    map.setMaxBounds(worldBounds);
    map.options.maxBoundsViscosity = 1.0; // Make bounds "sticky"
    
    // Expose map instance globally for external components to use
    (window as any).leafletMap = map;
    
    // Check if map is properly initialized
    console.log("Map draggable:", map.dragging.enabled());
    
    return () => {
      if (map) {
        delete (window as any).leafletMap;
      }
    };
  }, [map, activeView, searchRadius]);
  
  return null;
};

export default MapEffectsController;
