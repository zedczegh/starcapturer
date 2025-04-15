
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
      map.on('movestart', () => {
        if (map._container) {
          map._container.classList.add('moving');
        }
      });
      
      map.on('moveend', () => {
        if (map._container) {
          setTimeout(() => {
            map._container.classList.remove('moving');
          }, 100);
        }
      });
      
      // Force a resize to ensure correct rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (error) {
      console.error("Error applying map optimizations:", error);
    }
    
    return () => {
      try {
        if (map._container) {
          map._container.classList.remove('optimize-performance');
          map._container.classList.remove('moving');
        }
        
        // Clean up event listeners
        map.off('movestart');
        map.off('moveend');
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [map]);
  
  return (
    <>
      {/* Apply world bounds limit only - removed other effects */}
      <WorldBoundsController />
    </>
  );
};

export default MapEffectsComposer;
