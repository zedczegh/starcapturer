
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
      L.latLng(-85, -180),  // Southwest corner
      L.latLng(85, 180)     // Northeast corner
    );
    
    map.setMaxBounds(worldBounds);
    
    // Ensure zoom interactions work properly - explicitly set all interaction options
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.dragging.enable(); // Ensure dragging is explicitly enabled
    
    // Improve wrapping of coordinates to stay within -180 to 180 longitude
    const originalLatLng = L.latLng;
    
    // Override Leaflet's latLng to enforce wrapping but without creating an infinite recursion
    L.latLng = function(lat, lng) {
      if (lng !== undefined) {
        // Wrap longitude to stay within -180 to 180 range
        lng = ((lng + 540) % 360) - 180;
      }
      return originalLatLng(lat, lng);
    };
    
    // Maintain backwards compatibility with the original function
    Object.keys(originalLatLng).forEach(key => {
      L.latLng[key] = originalLatLng[key];
    });
    
    // Use a different approach to enforce single world view
    map.on('moveend', () => {
      const center = map.getCenter();
      const wrappedLng = ((center.lng + 540) % 360) - 180;
      
      // Only update if the longitude is significantly different after wrapping
      if (Math.abs(center.lng - wrappedLng) > 1) {
        center.lng = wrappedLng;
        map.setView(center, map.getZoom(), { animate: false });
      }
    });
    
    // Expose map instance globally for external components to use
    (window as any).leafletMap = map;
    
    // Check if map is properly initialized
    console.log("Map draggable:", map.dragging.enabled());
    
    return () => {
      if (map) {
        // Clean up event listeners
        map.off('moveend');
        // Remove global reference
        delete (window as any).leafletMap;
      }
    };
  }, [map, activeView, searchRadius]);
  
  return null;
};

export default MapEffectsController;
