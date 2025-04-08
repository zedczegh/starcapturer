
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

interface MapEffectsControllerProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onSiqsCalculated?: (siqs: number) => void;
}

const MapEffectsController: React.FC<MapEffectsControllerProps> = ({
  userLocation,
  searchRadius,
  activeView,
  onSiqsCalculated
}) => {
  const map = useMap();
  const [siqsScore, setSiqsScore] = useState<number | null>(null);
  const lastFetchRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  
  // Restrict map bounds to prevent infinite scrolling
  useEffect(() => {
    if (!map || isInitializedRef.current) return;
    
    // Set map bounds to prevent infinite scrolling east/west
    const southWest = L.latLng(-85.0511, -180);
    const northEast = L.latLng(85.0511, 180);
    const bounds = L.latLngBounds(southWest, northEast);
    
    try {
      map.setMaxBounds(bounds);
      map.on('drag', () => {
        map.panInsideBounds(bounds, { animate: false });
      });
      
      isInitializedRef.current = true;
    } catch (error) {
      console.error("Error setting map bounds:", error);
    }
  }, [map]);
  
  // Calculate real-time SIQS for the user's location
  const calculateSiqs = useCallback(async () => {
    if (!userLocation) return;
    
    // Throttle calculations to once per 10 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 10000) {
      return;
    }
    lastFetchRef.current = now;
    
    try {
      // Default Bortle scale if not available
      const defaultBortleScale = 4;
      
      const result = await calculateRealTimeSiqs(
        userLocation.latitude, 
        userLocation.longitude, 
        defaultBortleScale
      );
      
      setSiqsScore(result.siqs);
      
      // Pass the SIQS result to the parent if needed
      if (onSiqsCalculated) {
        onSiqsCalculated(result.siqs);
      }
    } catch (error) {
      console.error("Error calculating SIQS in effects controller:", error);
    }
  }, [userLocation, onSiqsCalculated]);
  
  // Calculate SIQS when location changes
  useEffect(() => {
    if (userLocation) {
      calculateSiqs();
    }
  }, [userLocation, calculateSiqs]);
  
  // Center map on user location if available during initial load
  useEffect(() => {
    if (!map || !userLocation) return;
    
    const center = [userLocation.latitude, userLocation.longitude];
    const zoom = map.getZoom() || 10;
    
    try {
      map.setView(center as L.LatLngExpression, zoom, { 
        animate: true 
      });
    } catch (error) {
      console.error("Error centering map:", error);
    }
  }, [map, userLocation]);
  
  // Apply restrictions for a single world view (no infinite horizontal scrolling)
  useEffect(() => {
    if (!map) return;
    
    // This ensures the map wraps around once when scrolling horizontally
    // and prevents multiple copies of the same location
    map.options.worldCopyJump = true;
    
  }, [map]);
  
  return null;
};

export default MapEffectsController;
