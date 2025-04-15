
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { WorldBoundsController } from '../MapEffectsController';

interface MapEffectsComposerProps {
  userLocation?: { latitude: number; longitude: number } | null;
  activeView?: 'certified' | 'calculated';
  searchRadius?: number;
  onSiqsCalculated?: (siqs: number) => void;
}

/**
 * Simplified map effects composer with reduced visual effects for better mobile performance
 */
const MapEffectsComposer: React.FC<MapEffectsComposerProps> = ({ 
  userLocation,
  activeView = 'certified',
  searchRadius = 100,
  onSiqsCalculated
}) => {
  // Always call useMap hook first before any conditional logic
  const map = useMap();
  
  // Optimize map performance for mobile devices
  useEffect(() => {
    if (!map) return;
    
    // Add better error handling
    try {
      // Disable unnecessary features for mobile performance
      map.options.fadeAnimation = false;
      map.options.zoomAnimation = false;
      map.options.markerZoomAnimation = false;
      
      // Reduce tile fade in duration
      if (map._container) {
        const mapContainer = map._container;
        mapContainer.classList.add('optimize-performance');
      }
      
      // Apply lower detail while moving (better performance)
      const handleMoveStart = () => {
        if (map._container) {
          map._container.classList.add('moving');
        }
      };
      
      const handleMoveEnd = () => {
        if (map._container) {
          setTimeout(() => {
            map._container.classList.remove('moving');
          }, 100);
        }
      };
      
      map.on('movestart', handleMoveStart);
      map.on('moveend', handleMoveEnd);
      
      // Force a resize to ensure correct rendering after a short delay
      // Only call invalidateSize if the map is properly initialized
      const timeoutId = setTimeout(() => {
        try {
          if (map && map._container && map._loaded) {
            map.invalidateSize();
          }
        } catch (e) {
          console.log("Non-critical map resize error:", e);
        }
      }, 300);
      
      return () => {
        try {
          map.off('movestart', handleMoveStart);
          map.off('moveend', handleMoveEnd);
          
          if (map._container) {
            map._container.classList.remove('optimize-performance');
            map._container.classList.remove('moving');
          }
          
          clearTimeout(timeoutId);
        } catch (e) {
          // Ignore cleanup errors
          console.log("Map cleanup error (non-critical):", e);
        }
      };
    } catch (error) {
      console.error("Error applying map optimizations:", error);
    }
  }, [map]);
  
  return (
    <>
      {/* Apply world bounds limit only - removed other effects */}
      <WorldBoundsController />
    </>
  );
};

export default MapEffectsComposer;
